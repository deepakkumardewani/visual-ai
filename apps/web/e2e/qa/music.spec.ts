import { randomUUID } from 'node:crypto';

import { clerk } from '@clerk/testing/playwright';
import { mergeTests, type Page } from '@playwright/test';

import { test as mediaTest } from '../fixtures/media';
import { expect, test as qaTest } from '../fixtures/qa';
import { E2E_WEB_ORIGIN, requireEnv } from '../support/env';
import { readCredits, setCredits } from '../support/proPerksSeed';

const test = mergeTests(qaTest, mediaTest);

const E2E_USER_ID = requireEnv('E2E_CLERK_USER_ID');
const RUN = randomUUID().slice(0, 8);
const USER_PROFILE_URL = /\/users\/user_/;
const MUSIC_PATH = '/audio/music';
const MUSIC_POST_URL = /\/generate\/audio\/music\/?$/;
const WIDTH_PHONE = 375;
const HEIGHT_PHONE = 812;
const MIN_TAP_PX = 44;
const MAX_TAB_PRESSES = 60;
// Independent of the app's cost function: ceil(usd x 200 credits per USD), per file.
const LYRIA_COST = 12; // 0.06 USD
const STABLE_AUDIO_COST = 40; // 0.20 USD
const MINIMAX_COST = 30; // 0.15 USD
// Enough for every stubbed cost below, so the remaining balance the stub reports is reachable.
const SEEDED_CREDITS = 500;
const STUB_ASSET_TITLE = 'E2E stub asset';
const NO_CREDITS_USED = 'No credits were used.';
// Evidence PNGs land in the repo-level agent_docs/qa tree (playwright runs from apps/web).
const shotPath = (name: string) => `../../agent_docs/qa/music-studio/${name}.png`;

const promptText = () => `e2e calm piano, rainy evening ${RUN}`;

async function openMusicStudio(page: Page) {
  await Promise.all([
    page.waitForResponse((res) => USER_PROFILE_URL.test(res.url()) && res.ok(), {
      timeout: 30_000,
    }),
    page.goto(MUSIC_PATH),
  ]);
  await clerk.loaded({ page });
  await expect(page.getByRole('heading', { name: 'Music studio' })).toBeVisible();
}

function prompt(page: Page) {
  return page.getByLabel('Describe the music', { exact: true });
}

function chipTotal(page: Page) {
  return page.getByTestId('credits-chip');
}

function modelOption(page: Page, label: string) {
  return page.getByTestId('music-model-option').filter({ hasText: label });
}

async function tabUntilFocused(page: Page, target: ReturnType<Page['getByTestId']>) {
  for (let presses = 0; presses < MAX_TAB_PRESSES; presses += 1) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`target not reachable by keyboard within ${MAX_TAB_PRESSES} Tab presses`);
}

async function stubSavedAsset(page: Page) {
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
            id: 'e2e-e2e-media-stub-job',
            type: 'audio',
            feature: 'music',
            modelKey: 'E2E_STUB',
            title: STUB_ASSET_TITLE,
            url: `${E2E_WEB_ORIGIN}/e2e-media/sample.mp3`,
            durationSec: 1,
            creditsCharged: LYRIA_COST,
            saved: true,
            createdAt: new Date().toISOString(),
          },
        ],
        nextCursor: null,
      },
    });
  });
}

test.describe('music studio', () => {
  let originalBalance: Awaited<ReturnType<typeof readCredits>>;

  test.beforeAll(async () => {
    originalBalance = await readCredits(E2E_USER_ID);
    await setCredits(E2E_USER_ID, { credits: SEEDED_CREDITS, dailyCredits: 0 });
  });

  test.afterAll(async () => {
    await setCredits(E2E_USER_ID, originalBalance);
  });

  test.beforeEach(async ({ page }) => {
    await openMusicStudio(page);
  });

  test('@critical generate with Lyria charges the per-file cost once', async ({
    page,
    mediaGenerationStub,
    snap,
  }) => {
    const before = await readCredits(E2E_USER_ID);
    const remaining = before.credits - LYRIA_COST;
    await expect(chipTotal(page)).toContainText(String(before.credits + before.dailyCredits));
    mediaGenerationStub.setVariant('slow', {
      credits: LYRIA_COST,
      userCreditsRemaining: remaining,
    });

    await prompt(page).fill(promptText());
    await expect(page.getByTestId('studio-cost')).toContainText(String(LYRIA_COST));
    const posted = page.waitForRequest((req) => MUSIC_POST_URL.test(req.url()));
    await page.getByTestId('studio-generate').click();
    const body = (await posted).postDataJSON();
    expect(body).toMatchObject({ modelKey: 'LYRIA_2', prompt: promptText() });
    expect(body).not.toHaveProperty('durationSec');

    await expect(page.getByTestId('job-progress')).toBeVisible();
    const card = page.getByTestId('result-card');
    await expect(card).toBeVisible();
    await expect(card.getByRole('button', { name: `Play ${STUB_ASSET_TITLE}` })).toBeFocused();
    await expect(chipTotal(page)).toContainText(String(remaining + before.dailyCredits));

    expect(mediaGenerationStub.acceptedRequestCount()).toBe(1);
    expect(mediaGenerationStub.interceptedPosts()).toHaveLength(1);
    // The stub answers the POST, so the real API never ran: the stored balance cannot have moved.
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
    await snap('music-success');
    await page.screenshot({ path: shotPath('success') });
  });

  test.describe('insufficient credits', () => {
    // The browser logs the deliberate 402 as a failed resource load.
    test.use({ expectedConsoleErrors: [/status of 402|→ 402/] });

    test('@critical insufficient credits opens the low-credits dialog and queues nothing', async ({
      page,
      mediaGenerationStub,
    }) => {
      mediaGenerationStub.setVariant('insufficient', { required: LYRIA_COST, available: 7 });
      const before = await readCredits(E2E_USER_ID);

      await prompt(page).fill(promptText());
      await page.getByTestId('studio-generate').click();

      const dialog = page.getByRole('dialog', { name: 'Low credits' });
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(`${LYRIA_COST} credits are required`);
      await expect(dialog).toContainText('7 credits available');
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
    await page.getByTestId('studio-generate').click();

    const error = page.getByTestId('studio-error-state');
    await expect(error).toBeVisible();
    await expect(error).toContainText(NO_CREDITS_USED);
    await expect(page.getByTestId('result-card')).toHaveCount(0);
    await expect(chipTotal(page)).toContainText(total);
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
    await page.screenshot({ path: shotPath('failure-no-charge') });
  });

  test('@high duration control only on Stable Audio', async ({ page, mediaGenerationStub }) => {
    const before = await readCredits(E2E_USER_ID);
    mediaGenerationStub.setVariant('success', { credits: STABLE_AUDIO_COST });
    const duration = page.getByTestId('duration-control');
    await prompt(page).fill(promptText());

    await expect(duration).toHaveCount(0);
    await expect(page.getByTestId('studio-cost')).toContainText(String(LYRIA_COST));

    await modelOption(page, 'Stable Audio 2.5').click();
    await expect(duration).toBeVisible();
    await expect(page.getByTestId('studio-cost')).toContainText(String(STABLE_AUDIO_COST));
    await page.screenshot({ path: shotPath('stable-audio-duration') });

    const posted = page.waitForRequest((req) => MUSIC_POST_URL.test(req.url()));
    await page.getByTestId('studio-generate').click();
    expect(((await posted).postDataJSON() as Record<string, unknown>).durationSec).toBeGreaterThan(
      0,
    );
    await expect(page.getByTestId('result-card')).toBeVisible();

    await modelOption(page, 'Minimax 2.6').click();
    await expect(duration).toHaveCount(0);
    await modelOption(page, 'Lyria 2').click();
    await expect(duration).toHaveCount(0);
    await expect(page.getByTestId('studio-cost')).toContainText(String(LYRIA_COST));
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
  });

  test('@high Minimax instrumental hides lyrics', async ({ page, mediaGenerationStub }) => {
    const before = await readCredits(E2E_USER_ID);
    mediaGenerationStub.setVariant('success', { credits: MINIMAX_COST });
    await prompt(page).fill(promptText());
    await expect(page.getByTestId('instrumental-note')).toHaveCount(0);

    await modelOption(page, 'Minimax 2.6').click();
    await expect(page.getByTestId('instrumental-note')).toContainText('Instrumental only');
    await expect(page.getByLabel('Lyrics')).toHaveCount(0);
    await expect(page.getByTestId('studio-cost')).toContainText(String(MINIMAX_COST));

    const posted = page.waitForRequest((req) => MUSIC_POST_URL.test(req.url()));
    await page.getByTestId('studio-generate').click();
    const body = (await posted).postDataJSON() as Record<string, unknown>;
    expect(body).toMatchObject({ modelKey: 'MINIMAX_MUSIC_26', instrumental: true });
    expect(body).not.toHaveProperty('lyrics');
    await expect(page.getByTestId('result-card')).toBeVisible();
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
    await page.screenshot({ path: shotPath('minimax-instrumental') });
  });

  test('@high keyboard-only flow', async ({ page, mediaGenerationStub }) => {
    const before = await readCredits(E2E_USER_ID);
    mediaGenerationStub.setVariant('success', { credits: LYRIA_COST });
    const field = prompt(page);

    await field.focus();
    await expect(field).toHaveCSS('outline-style', 'solid');
    await page.keyboard.type(promptText());
    await expect(field).toHaveValue(promptText());

    const generate = page.getByTestId('studio-generate');
    await tabUntilFocused(page, generate);
    await expect(generate).toBeEnabled();
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('result-card')).toBeVisible();
    await expect(
      page.getByTestId('result-card').getByRole('button', { name: `Play ${STUB_ASSET_TITLE}` }),
    ).toBeFocused();
    expect(mediaGenerationStub.acceptedRequestCount()).toBe(1);
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
  });

  test('@medium 375px layout', async ({ page }) => {
    await page.setViewportSize({ width: WIDTH_PHONE, height: HEIGHT_PHONE });
    await openMusicStudio(page);
    await prompt(page).fill(promptText());

    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);

    const targets = [
      page.getByTestId('studio-generate'),
      ...(await page.getByTestId('music-chip').all()),
      ...(await page.getByTestId('music-model-option').all()),
    ];
    expect(targets.length).toBeGreaterThan(5);
    for (const target of targets) {
      const box = await target.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(MIN_TAP_PX);
    }
    await page.screenshot({ path: shotPath('mobile-375') });
  });

  test('@medium result plays in History', async ({ page, mediaGenerationStub }) => {
    const before = await readCredits(E2E_USER_ID);
    mediaGenerationStub.setVariant('success', { credits: LYRIA_COST });
    await prompt(page).fill(promptText());
    await page.getByTestId('studio-generate').click();
    await expect(page.getByTestId('result-card')).toBeVisible();
    expect(await readCredits(E2E_USER_ID)).toEqual(before);

    // The History fetch is answered with the saved asset the stubbed job produced, so the list is stable.
    await stubSavedAsset(page);
    await page.getByTestId('nav-tab-assets').click();
    await expect(page).toHaveURL(/\/assets$/);
    const play = page.getByRole('button', { name: `Play ${STUB_ASSET_TITLE}`, exact: true });
    await expect(play).toBeVisible();

    await play.click();
    await expect(page.getByTestId('mini-player')).toBeVisible();
    await expect(page.getByTestId('mini-player-title')).toHaveText(STUB_ASSET_TITLE);
    await expect(page.getByTestId('mini-player').getByTestId('play-button')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.screenshot({ path: shotPath('history-plays') });
  });
});
