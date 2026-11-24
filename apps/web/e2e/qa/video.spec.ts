import { randomUUID } from 'node:crypto';
import path from 'node:path';

import { clerk } from '@clerk/testing/playwright';
import { mergeTests, type Locator, type Page } from '@playwright/test';

import { test as mediaTest } from '../fixtures/media';
import { expect, test as qaTest } from '../fixtures/qa';
import { E2E_WEB_ORIGIN, requireEnv } from '../support/env';
import { readCredits, setCredits } from '../support/proPerksSeed';

const test = mergeTests(qaTest, mediaTest);

const E2E_USER_ID = requireEnv('E2E_CLERK_USER_ID');
const RUN = randomUUID().slice(0, 8);
const USER_PROFILE_URL = /\/users\/user_/;
const VIDEO_PATH = '/video';
const VIDEO_POST_URL = /\/generate\/video\/?$/;
const WIDTH_PHONE = 375;
const HEIGHT_PHONE = 812;
const MIN_TAP_PX = 44;
const MAX_TAB_PRESSES = 80;
// Independent of the app's cost function: max(1, ceil(usd x 200 credits per USD)), per file.
const P_VIDEO_DRAFT_5S_720P = 5; // 5 s x 0.005 USD
const P_VIDEO_FULL_5S_720P = 20; // 5 s x 0.02 USD
const WAN_11S_720P = 154; // 11 s x 0.07 USD, just over the 150 confirm threshold
const WAN_5S_720P = 70; // 5 s x 0.07 USD
const FIXTURE_AUDIO_SEC = 5; // the fake upload service reports 5 s for any stored audio
const AUDIO_DRIVEN_COST = 5; // 5 s clamped audio, draft, 720p
const SEEDED_CREDITS = 500;
const STUB_ASSET_TITLE = 'E2E stub asset';
const NO_CREDITS_USED = 'No credits were used.';
const ASSET_DIR = path.join(__dirname, '..', 'fixtures', 'assets');
const SAMPLE_MP3 = path.join(ASSET_DIR, 'sample.mp3');
const SAMPLE_WEBP = path.join(ASSET_DIR, 'placeholder.webp');
// Evidence PNGs land in the repo-level agent_docs/qa tree (playwright runs from apps/web).
const shotPath = (name: string) => `../../agent_docs/qa/video-studio/${name}.png`;

const promptText = () => `e2e paper boat on a rainy street ${RUN}`;

async function openVideoStudio(page: Page) {
  await Promise.all([
    page.waitForResponse((res) => USER_PROFILE_URL.test(res.url()) && res.ok(), {
      timeout: 30_000,
    }),
    page.goto(VIDEO_PATH),
  ]);
  await clerk.loaded({ page });
  await expect(page.getByRole('heading', { name: 'Video studio' })).toBeVisible();
}

const prompt = (page: Page) => page.getByLabel('Describe the scene', { exact: true });
const chipTotal = (page: Page) => page.getByTestId('credits-chip');
const generateButton = (page: Page) => page.getByTestId('studio-generate');
const studioCost = (page: Page) => page.getByTestId('studio-cost');
const draftSwitch = (page: Page) => page.getByRole('switch', { name: /Draft preview/ });
const modelRadio = (page: Page, label: string) =>
  page.getByRole('radiogroup', { name: 'Model' }).getByRole('radio', { name: label });

// Waits for the open animation to finish so proof shots never catch a mid-fade dialog.
async function settled(dialog: Locator) {
  await expect
    .poll(() =>
      dialog.evaluate((el) =>
        el.getAnimations({ subtree: true }).every((a) => a.playState !== 'running'),
      ),
    )
    .toBe(true);
  await expect(dialog).toHaveCSS('opacity', '1');
}

async function tabUntilFocused(page: Page, target: Locator) {
  for (let presses = 0; presses < MAX_TAB_PRESSES; presses += 1) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`target not reachable by keyboard within ${MAX_TAB_PRESSES} Tab presses`);
}

async function stubSavedAudioAsset(page: Page) {
  await page.route('**/media/assets**', async (route) => {
    const headers = {
      'Access-Control-Allow-Origin': E2E_WEB_ORIGIN,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        route.request().headers()['access-control-request-headers'] ??
        'authorization, content-type',
    };
    const method = route.request().method();
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (method !== 'GET') return route.fallback();
    return route.fulfill({
      status: 200,
      headers,
      json: {
        items: [
          {
            id: `e2e-video-audio-${RUN}`,
            type: 'audio',
            feature: 'music',
            modelKey: 'E2E_STUB',
            title: STUB_ASSET_TITLE,
            url: `${E2E_WEB_ORIGIN}/e2e-media/sample.mp3`,
            durationSec: 1,
            creditsCharged: 12,
            saved: true,
            createdAt: new Date().toISOString(),
          },
        ],
        nextCursor: null,
      },
    });
  });
}

test.describe('video studio', () => {
  let originalBalance: Awaited<ReturnType<typeof readCredits>>;

  test.beforeAll(async () => {
    originalBalance = await readCredits(E2E_USER_ID);
    await setCredits(E2E_USER_ID, { credits: SEEDED_CREDITS, dailyCredits: 0 });
  });

  test.afterAll(async () => {
    await setCredits(E2E_USER_ID, originalBalance);
  });

  test.beforeEach(async ({ page }) => {
    await openVideoStudio(page);
  });

  test('@critical generate a video charges the server cost once', async ({
    page,
    mediaGenerationStub,
    snap,
  }) => {
    const before = await readCredits(E2E_USER_ID);
    const total = before.credits + before.dailyCredits;
    const remaining = total - P_VIDEO_FULL_5S_720P;
    await expect(chipTotal(page)).toContainText(String(total));
    await expect(page.getByTestId('studio-empty-state')).toContainText(
      'Describe a scene to make your first video.',
    );
    mediaGenerationStub.setVariant('slow', {
      credits: P_VIDEO_FULL_5S_720P,
      userCreditsRemaining: remaining,
    });

    await prompt(page).fill(promptText());
    // Draft is the default path; turning it off shows the full price on the action bar.
    await expect(studioCost(page)).toContainText(String(P_VIDEO_DRAFT_5S_720P));
    await draftSwitch(page).uncheck();
    await expect(studioCost(page)).toContainText(String(P_VIDEO_FULL_5S_720P));

    // Hold the progress stream so the in-flight state stays on screen until it is asserted.
    const releaseProgress = mediaGenerationStub.holdProgress();
    const posted = page.waitForRequest((req) => VIDEO_POST_URL.test(req.url()));
    await generateButton(page).click();
    const body = (await posted).postDataJSON();
    expect(body).toMatchObject({
      modelKey: 'P_VIDEO',
      prompt: promptText(),
      durationSec: 5,
      resolution: '720p',
      draft: false,
    });
    expect(body).not.toHaveProperty('imageUploadId');
    expect(body).not.toHaveProperty('audioUploadId');

    await expect(page.getByTestId('job-progress')).toBeVisible();
    await expect(page.getByTestId('result-card')).toHaveCount(0);
    releaseProgress();
    const card = page.getByTestId('result-card');
    await expect(card).toBeVisible();
    const video = card.locator('video');
    await expect(video).toHaveAttribute('aria-label', STUB_ASSET_TITLE);
    await expect(page.getByTestId('draft-label')).toHaveCount(0);
    await expect(chipTotal(page)).toContainText(String(remaining));

    expect(mediaGenerationStub.acceptedRequestCount()).toBe(1);
    expect(mediaGenerationStub.interceptedPosts()).toHaveLength(1);
    // The stub answers the POST, so the real API never ran: the stored balance cannot have moved.
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
    await snap('video-success');
    await page.screenshot({ path: shotPath('success') });
  });

  test('@critical the result video never autoplays and starts paused', async ({
    page,
    mediaGenerationStub,
  }) => {
    mediaGenerationStub.setVariant('success', { credits: P_VIDEO_DRAFT_5S_720P });
    await prompt(page).fill(promptText());
    await generateButton(page).click();

    const video = page.getByTestId('result-card').locator('video');
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute('controls', '');
    await expect(video).not.toHaveAttribute('autoplay', /.*/);
    expect(await video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true);
  });

  test.describe('insufficient credits', () => {
    // The browser logs the deliberate 402 as a failed resource load.
    test.use({ expectedConsoleErrors: [/status of 402|→ 402/] });

    test('@critical insufficient credits opens the low-credits dialog and queues nothing', async ({
      page,
      mediaGenerationStub,
    }) => {
      mediaGenerationStub.setVariant('insufficient', {
        required: P_VIDEO_DRAFT_5S_720P,
        available: 2,
      });
      const before = await readCredits(E2E_USER_ID);

      await prompt(page).fill(promptText());
      await generateButton(page).click();

      const dialog = page.getByRole('dialog', { name: 'Low credits' });
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(`${P_VIDEO_DRAFT_5S_720P} credits are required`);
      await expect(dialog).toContainText('2 credits available');
      await settled(dialog);
      await expect(page.getByTestId('result-card')).toHaveCount(0);
      expect(mediaGenerationStub.acceptedRequestCount()).toBe(0);
      expect(mediaGenerationStub.interceptedPosts()).toHaveLength(1);
      expect(await readCredits(E2E_USER_ID)).toEqual(before);
      await page.screenshot({ path: shotPath('insufficient-credits') });
    });
  });

  test('@critical failure shows "No credits were used." and the balance is unchanged', async ({
    page,
    mediaGenerationStub,
  }) => {
    mediaGenerationStub.setVariant('failure');
    const before = await readCredits(E2E_USER_ID);
    const total = String(before.credits + before.dailyCredits);
    await expect(chipTotal(page)).toContainText(total);

    await prompt(page).fill(promptText());
    await generateButton(page).click();

    const error = page.getByTestId('studio-error-state');
    await expect(error).toBeVisible();
    await expect(error).toContainText(NO_CREDITS_USED);
    await expect(page.getByTestId('result-card')).toHaveCount(0);
    await expect(chipTotal(page)).toContainText(total);
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
    await page.screenshot({ path: shotPath('failure-no-charge') });
  });

  test('@critical 150-credit job asks for confirmation and Cancel is the default', async ({
    page,
    mediaGenerationStub,
  }) => {
    const before = await readCredits(E2E_USER_ID);
    mediaGenerationStub.setVariant('success', { credits: WAN_11S_720P });
    await prompt(page).fill(promptText());
    await modelRadio(page, 'Wan 3').click();
    await expect(draftSwitch(page)).toHaveCount(0);
    await expect(studioCost(page)).toContainText(String(WAN_5S_720P));

    // Below the threshold there is no dialog; 11 s at 720p is 154 credits, over it.
    await page.getByTestId('video-duration-slider').fill('11');
    await expect(studioCost(page)).toContainText(String(WAN_11S_720P));
    await generateButton(page).click();

    const dialog = page.getByRole('dialog', { name: 'Generate' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(String(WAN_11S_720P));
    const cancel = dialog.getByRole('button', { name: 'Cancel' });
    await expect(cancel).toBeFocused();
    await settled(dialog);
    await page.screenshot({ path: shotPath('confirm-dialog') });

    await cancel.click();
    await expect(dialog).toHaveCount(0);
    expect(mediaGenerationStub.interceptedPosts()).toHaveLength(0);
    expect(await readCredits(E2E_USER_ID)).toEqual(before);

    await generateButton(page).click();
    await dialog.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByTestId('result-card')).toBeVisible();
    expect(mediaGenerationStub.acceptedRequestCount()).toBe(1);
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
  });

  test('@high draft then render final', async ({ page, mediaGenerationStub }) => {
    const before = await readCredits(E2E_USER_ID);
    mediaGenerationStub.setVariant('success', { credits: P_VIDEO_DRAFT_5S_720P });
    await prompt(page).fill(promptText());
    await expect(draftSwitch(page)).toBeChecked();
    await expect(page.getByTestId('draft-saving')).toContainText(
      `saves ${P_VIDEO_FULL_5S_720P - P_VIDEO_DRAFT_5S_720P} credits`,
    );

    const draftPost = page.waitForRequest((req) => VIDEO_POST_URL.test(req.url()));
    await generateButton(page).click();
    const draftBody = (await draftPost).postDataJSON();
    expect(draftBody).toMatchObject({ modelKey: 'P_VIDEO', draft: true, prompt: promptText() });
    await expect(page.getByTestId('draft-label')).toHaveText('Draft');
    const renderFinal = page.getByTestId('render-final');
    await expect(renderFinal).toContainText(`${P_VIDEO_FULL_5S_720P} credits`);
    await page.screenshot({ path: shotPath('draft-result') });

    // Render final keeps the prompt and shows the full price before anything is sent.
    mediaGenerationStub.setVariant('success', { credits: P_VIDEO_FULL_5S_720P });
    await renderFinal.click();
    await expect(generateButton(page)).toBeFocused();
    await expect(studioCost(page)).toContainText(String(P_VIDEO_FULL_5S_720P));
    await expect(prompt(page)).toHaveValue(promptText());
    expect(mediaGenerationStub.acceptedRequestCount()).toBe(1);

    const finalPost = page.waitForRequest((req) => VIDEO_POST_URL.test(req.url()));
    await generateButton(page).click();
    const finalBody = (await finalPost).postDataJSON();
    expect(finalBody).toMatchObject({
      modelKey: 'P_VIDEO',
      draft: false,
      prompt: promptText(),
      durationSec: draftBody.durationSec,
      resolution: draftBody.resolution,
    });
    await expect(page.getByTestId('draft-label')).toHaveCount(0);
    expect(mediaGenerationStub.acceptedRequestCount()).toBe(2);
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
  });

  test('@high image and audio attach with Estimated cost', async ({
    page,
    mediaGenerationStub,
  }) => {
    const before = await readCredits(E2E_USER_ID);
    mediaGenerationStub.setVariant('success', { credits: AUDIO_DRIVEN_COST });
    await prompt(page).fill(promptText());
    await expect(studioCost(page)).not.toContainText('Estimated');

    // Uploads are not paid calls: they hit the real API, which stores them with the fake storage.
    await page.getByTestId('video-image-input').setInputFiles(SAMPLE_WEBP);
    const imageThumb = page.getByTestId('video-image-thumb');
    await expect(imageThumb).toBeVisible();
    await page.getByTestId('video-audio-input').setInputFiles(SAMPLE_MP3);
    await expect(page.getByTestId('video-audio-detail')).toHaveText(`${FIXTURE_AUDIO_SEC} s`);
    await expect(studioCost(page)).toContainText('Estimated');
    await expect(studioCost(page)).toContainText(String(AUDIO_DRIVEN_COST));
    await expect(page.getByText('Set by your audio')).toBeVisible();
    await page.screenshot({ path: shotPath('attachments-estimated') });

    const posted = page.waitForRequest((req) => VIDEO_POST_URL.test(req.url()));
    await generateButton(page).click();
    const body = (await posted).postDataJSON() as Record<string, unknown>;
    // Only upload ids travel; never a URL or the audio length.
    expect(body.imageUploadId).toEqual(expect.any(String));
    expect(body.audioUploadId).toEqual(expect.any(String));
    expect(JSON.stringify(body)).not.toMatch(/https?:|blob:/);
    await expect(page.getByTestId('result-card')).toBeVisible();

    await page.getByTestId('video-image-remove').click();
    await expect(page.getByTestId('video-image-thumb')).toHaveCount(0);
    await page.getByTestId('video-audio-remove').click();
    await expect(studioCost(page)).not.toContainText('Estimated');
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
  });

  test.describe('renamed audio', () => {
    // The browser logs the server's deliberate 400 as a failed resource load.
    test.use({ expectedConsoleErrors: [/status of 400|→ 400/] });

    test('@high audio renamed .mp3 is rejected', async ({ page, mediaGenerationStub }) => {
      const before = await readCredits(E2E_USER_ID);
      // A PNG-like body pretending to be audio: the browser type passes, the server sniff must not.
      await page.getByTestId('video-audio-input').setInputFiles({
        name: 'not-audio.mp3',
        mimeType: 'audio/mpeg',
        buffer: Buffer.from(`not really audio ${RUN}`.repeat(40)),
      });

      const alert = page.getByTestId('video-audio-error');
      await expect(alert).toBeVisible();
      await expect(alert).not.toBeEmpty();
      await expect(page.getByTestId('video-audio-detail')).toHaveCount(0);
      await expect(page.getByTestId('video-audio-pick')).toBeEnabled();
      expect(mediaGenerationStub.interceptedPosts()).toHaveLength(0);
      expect(await readCredits(E2E_USER_ID)).toEqual(before);
      await page.screenshot({ path: shotPath('renamed-audio-rejected') });
    });
  });

  test('@high video and audio players never overlap', async ({ page, mediaGenerationStub }) => {
    const before = await readCredits(E2E_USER_ID);
    mediaGenerationStub.setVariant('success', { credits: P_VIDEO_DRAFT_5S_720P });
    await stubSavedAudioAsset(page);

    await page.getByTestId('nav-tab-assets').click();
    await expect(page).toHaveURL(/\/assets$/);
    await page.getByRole('button', { name: `Play ${STUB_ASSET_TITLE}`, exact: true }).click();
    const miniPlayer = page.getByTestId('mini-player');
    await expect(miniPlayer.getByTestId('play-button')).toHaveAttribute('aria-pressed', 'true');

    await page.getByTestId('nav-tab-video').click();
    await expect(page).toHaveURL(/\/video$/);
    await expect(miniPlayer.getByTestId('play-button')).toHaveAttribute('aria-pressed', 'true');
    await prompt(page).fill(promptText());
    // The fixed mini-player covers the static desktop action bar (app bug, see report), so Generate
    // is activated from the keyboard instead of a pointer click.
    await generateButton(page).focus();
    await page.keyboard.press('Enter');

    // Starting a video ends the audio: the mini-player closes and no audio element keeps playing.
    await expect(page.getByTestId('result-card')).toBeVisible();
    await expect(miniPlayer).toHaveCount(0);
    const anyAudioPlaying = await page.evaluate(() =>
      Array.from(document.querySelectorAll('audio')).some((el) => !el.paused),
    );
    expect(anyAudioPlaying).toBe(false);
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
  });

  test('@high keyboard-only compose', async ({ page, mediaGenerationStub }) => {
    const before = await readCredits(E2E_USER_ID);
    mediaGenerationStub.setVariant('success', { credits: P_VIDEO_DRAFT_5S_720P });
    const field = prompt(page);

    await field.focus();
    await expect(field).toHaveCSS('outline-style', 'solid');
    await page.keyboard.type(promptText());
    await expect(field).toHaveValue(promptText());

    // Model radio group and draft switch are reachable and operable without a pointer.
    const wan = modelRadio(page, 'Wan 3');
    const pVideo = modelRadio(page, 'P-Video');
    await pVideo.focus();
    await page.keyboard.press('ArrowRight');
    await expect(wan).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('ArrowLeft');
    await expect(pVideo).toHaveAttribute('aria-checked', 'true');
    await expect(draftSwitch(page)).toBeVisible();
    await tabUntilFocused(page, draftSwitch(page));
    await expect(draftSwitch(page)).toBeChecked();
    await page.keyboard.press('Space');
    await expect(draftSwitch(page)).not.toBeChecked();
    await page.keyboard.press('Space');
    await expect(draftSwitch(page)).toBeChecked();

    const generate = generateButton(page);
    await tabUntilFocused(page, generate);
    await expect(generate).toBeEnabled();
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('result-card')).toBeVisible();
    expect(mediaGenerationStub.acceptedRequestCount()).toBe(1);
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
  });

  test('@high attachments are operable by keyboard', async ({ page }) => {
    const pick = page.getByTestId('video-image-pick');
    await tabUntilFocused(page, pick);
    await expect(pick).toHaveCSS('outline-style', 'solid');
    const chooser = page.waitForEvent('filechooser');
    await page.keyboard.press('Enter');
    await (await chooser).setFiles(SAMPLE_WEBP);

    const remove = page.getByTestId('video-image-remove');
    await expect(remove).toBeVisible();
    await tabUntilFocused(page, remove);
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('video-image-thumb')).toHaveCount(0);
    await expect(pick).toBeVisible();
  });

  test('@medium 375px layout', async ({ page, mediaGenerationStub }) => {
    mediaGenerationStub.setVariant('success', { credits: P_VIDEO_DRAFT_5S_720P });
    await page.setViewportSize({ width: WIDTH_PHONE, height: HEIGHT_PHONE });
    await openVideoStudio(page);
    await prompt(page).fill(promptText());
    await page.getByTestId('video-image-input').setInputFiles(SAMPLE_WEBP);
    await expect(page.getByTestId('video-image-thumb')).toBeVisible();

    const noHorizontalScroll = async () => {
      const overflow = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);
    };
    await noHorizontalScroll();

    const targets = [
      generateButton(page),
      // The 44px tap target of the switch is its wrapping label, not the 20px checkbox.
      page.getByTestId('draft-toggle'),
      page.getByTestId('video-audio-pick'),
      page.getByTestId('video-image-remove'),
      page.getByTestId('video-duration-slider'),
      ...(await page.getByRole('radiogroup', { name: 'Model' }).getByRole('radio').all()),
      ...(await page.getByRole('radiogroup', { name: 'Resolution' }).getByRole('radio').all()),
    ];
    expect(targets.length).toBeGreaterThan(6);
    for (const target of targets) {
      const box = await target.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(MIN_TAP_PX);
    }
    await page.screenshot({ path: shotPath('mobile-375') });

    await generateButton(page).click();
    await expect(page.getByTestId('result-card')).toBeVisible();
    await noHorizontalScroll();
    await page.screenshot({ path: shotPath('mobile-375-result') });
  });
});
