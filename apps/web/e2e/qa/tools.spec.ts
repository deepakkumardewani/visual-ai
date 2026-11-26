import { randomUUID } from 'node:crypto';
import path from 'node:path';

import { clerk } from '@clerk/testing/playwright';
import { mergeTests, type Locator, type Page } from '@playwright/test';

import { test as generationTest } from '../fixtures/generation';
import { test as mediaTest } from '../fixtures/media';
import { expect, test as qaTest } from '../fixtures/qa';
import { E2E_WEB_ORIGIN, requireEnv } from '../support/env';
import { deleteMediaAsset, seedImageAsset } from '../support/mediaAssetSeed';
import { readCredits, setCredits } from '../support/proPerksSeed';

const test = mergeTests(qaTest, mediaTest, generationTest);

const E2E_USER_ID = requireEnv('E2E_CLERK_USER_ID');
const RUN = randomUUID().slice(0, 8);
const USER_PROFILE_URL = /\/users\/user_/;
const WIDTH_PHONE = 375;
const HEIGHT_PHONE = 812;
const MIN_TAP_PX = 44;
const MAX_TAB_PRESSES = 80;
const SEEDED_CREDITS = 500;
const NO_CREDITS_USED = 'No credits were used.';
const VIDEO_LIMIT_COPY = 'Videos up to 2 minutes and 100 MB';
const NOT_FOUND_COPY = 'That file could not be found. Add one below instead.';
const IMAGE_TYPE_COPY = 'Choose a JPG, PNG or WEBP image.';
const SKETCH_GUIDANCE = 'Use the reference sketch as composition guide.';
const STUB_ASSET_TITLE = 'E2E stub asset';
const FIXTURE_ORIGIN_PATH = `${E2E_WEB_ORIGIN}/e2e-media`;
// Independent of the app's cost function: max(1, ceil(usd x 200 credits per USD)).
const IMAGE_WATERMARK_COST = 1; // 0.00019 USD
const VIDEO_WATERMARK_COST = 1; // 0.00045 USD
const AUTOCAPTION_BLOCK_COST = 11; // 0.055 USD per 30 s block
const NANO_BANANA_2_COST = 1; // image models use the fixed per-image tiers, not the media formula
const FLUX_KONTEXT_MAX_COST = 5; // premium tier
const ASSET_DIR = path.join(__dirname, '..', 'fixtures', 'assets');
const SAMPLE_WEBP = path.join(ASSET_DIR, 'placeholder.webp');
const SAMPLE_MP4 = path.join(ASSET_DIR, 'placeholder.mp4');
const SAMPLE_WAV = path.join(ASSET_DIR, 'sample.wav');
// Evidence PNGs land in the repo-level agent_docs/qa tree (playwright runs from apps/web).
const shotPath = (name: string) => `../../agent_docs/qa/tools/${name}.png`;

interface ToolPage {
  name: string;
  path: string;
  heading: string;
  fileTestId: string;
  file: string;
  textTestId?: string;
  cost: number;
}

const IMAGE_WATERMARK: ToolPage = {
  name: 'image watermark',
  path: '/tools/image-watermark',
  heading: 'Image watermark',
  fileTestId: 'watermark-image',
  file: SAMPLE_WEBP,
  textTestId: 'watermark-text',
  cost: IMAGE_WATERMARK_COST,
};
const VIDEO_WATERMARK: ToolPage = {
  name: 'video watermark',
  path: '/tools/video-watermark',
  heading: 'Video watermark',
  fileTestId: 'video-watermark-file',
  file: SAMPLE_MP4,
  textTestId: 'video-watermark-text',
  cost: VIDEO_WATERMARK_COST,
};
const AUTOCAPTION: ToolPage = {
  name: 'autocaption',
  path: '/tools/autocaption',
  heading: 'Autocaption',
  fileTestId: 'autocaption-file',
  file: SAMPLE_MP4,
  cost: AUTOCAPTION_BLOCK_COST,
};
const MEDIA_TOOLS = [IMAGE_WATERMARK, VIDEO_WATERMARK, AUTOCAPTION];

async function openPath(page: Page, url: string, heading: string) {
  await Promise.all([
    page.waitForResponse((res) => USER_PROFILE_URL.test(res.url()) && res.ok(), {
      timeout: 30_000,
    }),
    page.goto(url),
  ]);
  await clerk.loaded({ page });
  await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
}

const openTool = (page: Page, tool: ToolPage) => openPath(page, tool.path, tool.heading);
const chipTotal = (page: Page) => page.getByTestId('credits-chip');
const generateButton = (page: Page) => page.getByTestId('studio-generate');
const studioCost = (page: Page) => page.getByTestId('studio-cost');
const resultCard = (page: Page) => page.getByTestId('result-card');
const errorState = (page: Page) => page.getByTestId('studio-error-state');

const watermarkText = () => `E2E ${RUN}`;

async function attachFile(page: Page, tool: ToolPage) {
  await page.getByTestId(`${tool.fileTestId}-input`).setInputFiles(tool.file);
  await expect(
    page
      .getByTestId(`${tool.fileTestId}-detail`)
      .or(page.getByTestId(`${tool.fileTestId}-thumb`))
      .first(),
  ).toBeVisible();
}

/** Attaches the file, then the watermark text when the tool has one. */
async function fillTool(page: Page, tool: ToolPage) {
  await attachFile(page, tool);
  if (tool.textTestId) await page.getByTestId(tool.textTestId).fill(watermarkText());
  await expect(generateButton(page)).toBeEnabled();
}

const DEFAULT_UPLOAD_SEC = 5;

/**
 * Answers the upload itself with a chosen duration. The paid POST that would use the id is
 * stubbed, so the stored file never matters, and the API's upload limit (30 per 10 minutes) is
 * kept for the few tests that exercise real storage.
 */
async function stubUploads(page: Page, durationSec: () => number = () => DEFAULT_UPLOAD_SEC) {
  const headers = {
    'Access-Control-Allow-Origin': E2E_WEB_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': '*',
  };
  await page.route('**/media/uploads**', async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (request.method() !== 'POST') return route.fallback();
    const isVideo = new URL(request.url()).searchParams.get('purpose') === 'tool-video';
    return route.fulfill({
      status: 201,
      headers,
      json: {
        uploadId: `e2e-upload-${RUN}`,
        ...(isVideo ? { durationSec: durationSec() } : {}),
      },
    });
  });
}

async function tabUntilFocused(page: Page, target: Locator) {
  for (let presses = 0; presses < MAX_TAB_PRESSES; presses += 1) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`target not reachable by keyboard within ${MAX_TAB_PRESSES} Tab presses`);
}

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);
}

async function expectTapTargets(targets: Locator[]) {
  expect(targets.length).toBeGreaterThan(1);
  for (const target of targets) {
    const box = await target.boundingBox();
    expect(box?.height ?? 0, String(target)).toBeGreaterThanOrEqual(MIN_TAP_PX);
  }
}

async function drawStroke(page: Page) {
  const canvas = page.getByTestId('sketch-canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('sketch canvas has no box');
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.25);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.6, {
    steps: 8,
  });
  await page.mouse.up();
}

async function stubReferenceUpload(page: Page) {
  await page.route('**/generate/reference-images**', async (route) => {
    const headers = {
      'Access-Control-Allow-Origin': E2E_WEB_ORIGIN,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': '*',
    };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    return route.fulfill({
      status: 200,
      headers,
      json: { urls: ['https://cdn.invalid/sketch.png'] },
    });
  });
}

test.describe('tools', () => {
  let originalBalance: Awaited<ReturnType<typeof readCredits>>;

  test.beforeAll(async () => {
    originalBalance = await readCredits(E2E_USER_ID);
    await setCredits(E2E_USER_ID, { credits: SEEDED_CREDITS, dailyCredits: 0 });
  });

  test.afterAll(async () => {
    await setCredits(E2E_USER_ID, originalBalance);
  });

  test('@critical image watermark runs and charges once', async ({
    page,
    mediaGenerationStub,
    snap,
  }) => {
    await openTool(page, IMAGE_WATERMARK);
    const before = await readCredits(E2E_USER_ID);
    const total = before.credits + before.dailyCredits;
    const remaining = total - IMAGE_WATERMARK_COST;
    await expect(chipTotal(page)).toContainText(String(total));
    await expect(page.getByTestId('studio-empty-state')).toContainText(
      'Add an image and the text for your watermark.',
    );
    await expect(generateButton(page)).toBeDisabled();
    await expect(page.getByTestId('studio-reason')).toHaveText('Add an image first.');

    await attachFile(page, IMAGE_WATERMARK);
    await expect(page.getByTestId('studio-reason')).toHaveText('Enter the watermark text.');
    await page.getByTestId('watermark-text').fill(watermarkText());
    await expect(page.getByTestId('watermark-preview')).toContainText(watermarkText());
    await expect(studioCost(page)).toContainText(String(IMAGE_WATERMARK_COST));
    mediaGenerationStub.setVariant('slow', {
      credits: IMAGE_WATERMARK_COST,
      userCreditsRemaining: remaining,
    });

    const releaseProgress = mediaGenerationStub.holdProgress();
    const posted = page.waitForRequest((req) =>
      /\/generate\/tools\/image-watermark\/?$/.test(req.url()),
    );
    await generateButton(page).click();
    const body = (await posted).postDataJSON() as Record<string, unknown>;
    expect(body).toMatchObject({
      watermarkText: watermarkText(),
      position: 'bottom-right',
    });
    expect(body.uploadId).toEqual(expect.any(String));
    expect(JSON.stringify(body)).not.toMatch(/FULLJOURNEY|https?:|blob:/);

    await expect(page.getByTestId('job-progress')).toBeVisible();
    await expect(resultCard(page)).toHaveCount(0);
    releaseProgress();
    const image = resultCard(page).getByTestId('result-image');
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute('alt', STUB_ASSET_TITLE);
    await expect(resultCard(page).getByTestId('result-download')).toHaveAttribute(
      'href',
      `${FIXTURE_ORIGIN_PATH}/placeholder.webp`,
    );
    await expect(chipTotal(page)).toContainText(String(remaining));

    // The result offers the image-capable studios.
    await resultCard(page).getByTestId('handoff-trigger').click();
    await expect(page.getByRole('menuitem', { name: 'Image watermark' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Video image input' })).toBeVisible();
    await page.keyboard.press('Escape');

    expect(mediaGenerationStub.acceptedRequestCount()).toBe(1);
    expect(mediaGenerationStub.interceptedPosts()).toHaveLength(1);
    // The stub answers the POST, so the real API never ran: the stored balance cannot have moved.
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
    await snap('image-watermark-success');
    await page.screenshot({ path: shotPath('image-watermark-success') });
  });

  test('@critical autocaption bills by 30 second block', async ({
    page,
    context,
    mediaGenerationStub,
    snap,
  }) => {
    let reported = 30;
    await stubUploads(page, () => reported);
    await openTool(page, AUTOCAPTION);
    const before = await readCredits(E2E_USER_ID);
    await expect(page.getByTestId('studio-empty-state')).toContainText(
      'Add a video to caption it.',
    );

    // 30 s is one block, 31 s starts a second, 120 s (the limit) is four.
    const expected = [
      { seconds: 30, credits: AUTOCAPTION_BLOCK_COST },
      { seconds: 31, credits: 2 * AUTOCAPTION_BLOCK_COST },
      { seconds: 120, credits: 4 * AUTOCAPTION_BLOCK_COST },
    ];
    for (const { seconds, credits } of expected) {
      reported = seconds;
      await attachFile(page, AUTOCAPTION);
      await expect(page.getByTestId('autocaption-file-detail')).toHaveText(`${seconds} s`);
      await expect(studioCost(page)).toContainText(String(credits));
      await page.getByTestId('autocaption-file-remove').click();
      await expect(page.getByTestId('autocaption-file-detail')).toHaveCount(0);
      await expect(page.getByTestId('autocaption-file-pick')).toBeVisible();
    }

    reported = 31;
    await attachFile(page, AUTOCAPTION);
    await expect(studioCost(page)).toContainText(String(2 * AUTOCAPTION_BLOCK_COST));
    mediaGenerationStub.setVariant('success', {
      credits: 2 * AUTOCAPTION_BLOCK_COST,
    });
    const posted = page.waitForRequest((req) =>
      /\/generate\/tools\/autocaption\/?$/.test(req.url()),
    );
    await generateButton(page).click();
    const body = (await posted).postDataJSON() as Record<string, unknown>;
    // The billed duration comes from storage, never the client: no duration field travels.
    expect(body.uploadId).toEqual(expect.any(String));
    expect(Object.keys(body).filter((key) => /dur|sec|length|block/i.test(key))).toEqual([]);

    const caption = page.getByTestId('caption-result');
    await expect(caption).toBeVisible();
    await expect(caption.locator('video')).toHaveAttribute('aria-label', STUB_ASSET_TITLE);
    const transcript = page.getByTestId('transcript-text');
    // Untrusted transcript text is shown as text: the tags are visible characters, not elements.
    await expect(transcript).toContainText('<b>bold</b> <img src=x onerror="window.__xss=1"> done');
    await expect(transcript.locator('b, img')).toHaveCount(0);
    expect(
      await page.evaluate(() => (window as unknown as { __xss?: number }).__xss),
    ).toBeUndefined();

    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: E2E_WEB_ORIGIN,
    });
    await page.getByTestId('transcript-copy').click();
    await expect(page.getByTestId('transcript-copy')).toHaveText('Copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
      'Hello from the transcript.',
    );
    const download = page.waitForEvent('download');
    await page.getByTestId('transcript-download').click();
    expect((await download).suggestedFilename()).toBe('transcript.txt');

    expect(mediaGenerationStub.acceptedRequestCount()).toBe(1);
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
    await snap('autocaption-success');
    await page.screenshot({ path: shotPath('autocaption-success') });
  });

  test.describe('insufficient credits', () => {
    // The browser logs the deliberate 402 as a failed resource load.
    test.use({ expectedConsoleErrors: [/status of 402|→ 402/] });

    test('@critical 402 and failure states for every tool', async ({
      page,
      mediaGenerationStub,
    }) => {
      await stubUploads(page);
      const before = await readCredits(E2E_USER_ID);
      const total = String(before.credits + before.dailyCredits);

      for (const tool of MEDIA_TOOLS) {
        await test.step(`${tool.name}: 402 opens the low-credits dialog and queues nothing`, async () => {
          await openTool(page, tool);
          await fillTool(page, tool);
          mediaGenerationStub.setVariant('insufficient', {
            required: tool.cost,
            available: 0,
          });
          const postsBefore = mediaGenerationStub.interceptedPosts().length;
          const acceptedBefore = mediaGenerationStub.acceptedRequestCount();
          await generateButton(page).click();

          const dialog = page.getByRole('dialog', { name: 'Low credits' });
          await expect(dialog).toBeVisible();
          await expect(dialog).toContainText(`${tool.cost} credit`);
          await expect(resultCard(page)).toHaveCount(0);
          expect(mediaGenerationStub.interceptedPosts()).toHaveLength(postsBefore + 1);
          expect(mediaGenerationStub.acceptedRequestCount()).toBe(acceptedBefore);
          await page.keyboard.press('Escape');
          await expect(dialog).toHaveCount(0);
        });

        await test.step(`${tool.name}: failure says no credits were used`, async () => {
          await openTool(page, tool);
          await fillTool(page, tool);
          mediaGenerationStub.setVariant('failure');
          await generateButton(page).click();

          await expect(errorState(page)).toBeVisible();
          await expect(errorState(page)).toContainText(NO_CREDITS_USED);
          await expect(resultCard(page)).toHaveCount(0);
          await expect(chipTotal(page)).toContainText(total);
          await page.screenshot({
            path: shotPath(`failure-${tool.fileTestId}`),
          });
        });
      }
      expect(await readCredits(E2E_USER_ID)).toEqual(before);
    });

    // Kept separate on purpose: requesting generationStub and mediaGenerationStub in one test
    // makes the later /progress route win and the other tool's job never completes.
    test('@critical 402 and failure states for every tool: sketch', async ({
      page,
      generationStub,
    }) => {
      await test.step('sketch: too few credits opens the low-credits dialog and sends nothing', async () => {
        await setCredits(E2E_USER_ID, { credits: 0, dailyCredits: 0 });
        try {
          await openPath(page, '/tools/sketch', 'Sketch to image');
          await drawStroke(page);
          await page.getByTestId('sketch-prompt').fill(`e2e sketch ${RUN}`);
          await generateButton(page).click();
          await expect(page.getByRole('dialog', { name: 'Low credits' })).toBeVisible();
          expect(generationStub.generateRequestCount()).toBe(0);
          await expect(page.getByTestId('sketch-result')).toHaveCount(0);
          await page.screenshot({ path: shotPath('sketch-low-credits') });
        } finally {
          await setCredits(E2E_USER_ID, {
            credits: SEEDED_CREDITS,
            dailyCredits: 0,
          });
        }
      });

      await test.step('sketch: a failed job shows an error and nothing is charged', async () => {
        await openPath(page, '/tools/sketch', 'Sketch to image');
        await stubReferenceUpload(page);
        await drawStroke(page);
        await page.getByTestId('sketch-prompt').fill(`e2e sketch ${RUN}`);
        generationStub.setNextProgressError('The sketch could not be turned into an image.');
        await generateButton(page).click();
        await expect(errorState(page)).toContainText(
          'The sketch could not be turned into an image.',
        );
        await expect(errorState(page)).toContainText(NO_CREDITS_USED);
        await expect(page.getByTestId('sketch-result')).toHaveCount(0);
      });
      expect(await readCredits(E2E_USER_ID)).toEqual({
        credits: SEEDED_CREDITS,
        dailyCredits: 0,
      });
    });

    test('@critical sketch server 402 opens the low-credits dialog', async ({ page }) => {
      await openPath(page, '/tools/sketch', 'Sketch to image');
      await stubReferenceUpload(page);
      await page.route('**/generate/image', async (route) => {
        const headers = {
          'Access-Control-Allow-Origin': E2E_WEB_ORIGIN,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Headers': '*',
        };
        if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
        return route.fulfill({
          status: 402,
          headers,
          json: {
            code: 'INSUFFICIENT_CREDITS',
            required: NANO_BANANA_2_COST,
            available: 0,
          },
        });
      });
      await drawStroke(page);
      await page.getByTestId('sketch-prompt').fill(`e2e sketch ${RUN}`);
      await generateButton(page).click();
      await expect(page.getByRole('dialog', { name: 'Low credits' })).toBeVisible();
      await expect(page.getByTestId('sketch-result')).toHaveCount(0);
      await page.keyboard.press('Escape');
      await page.unroute('**/generate/image');
    });
  });

  test('@high over-limit video rejected with copy', async ({ page, mediaGenerationStub }) => {
    const OVER_LIMIT_SEC = 121;
    await stubUploads(page, () => OVER_LIMIT_SEC);
    const before = await readCredits(E2E_USER_ID);

    for (const tool of [VIDEO_WATERMARK, AUTOCAPTION]) {
      await openTool(page, tool);
      await page.getByTestId(`${tool.fileTestId}-input`).setInputFiles(tool.file);
      const error = page.getByTestId(`${tool.fileTestId}-error`);
      await expect(error).toBeVisible();
      await expect(error).toHaveText(VIDEO_LIMIT_COPY);
      await expect(page.getByTestId(`${tool.fileTestId}-detail`)).toHaveCount(0);
      await expect(generateButton(page)).toBeDisabled();
      await expect(page.getByTestId('studio-reason')).toHaveText(/Add a video first\./);
      await page.screenshot({
        path: shotPath(`over-limit-${tool.fileTestId}`),
      });
    }
    expect(mediaGenerationStub.interceptedPosts()).toHaveLength(0);
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
  });

  test('@high other file types rejected with copy', async ({ page, mediaGenerationStub }) => {
    await openTool(page, IMAGE_WATERMARK);
    // The browser filter is bypassed on purpose: the app must still refuse the wrong type.
    await page.getByTestId('watermark-image-input').setInputFiles(SAMPLE_WAV);
    await expect(page.getByTestId('watermark-image-error')).toHaveText(IMAGE_TYPE_COPY);
    await expect(page.getByTestId('watermark-image-thumb')).toHaveCount(0);
    await expect(generateButton(page)).toBeDisabled();
    expect(mediaGenerationStub.interceptedPosts()).toHaveLength(0);
  });

  test('@high sketch generate uses the image cost', async ({ page, generationStub, snap }) => {
    await openPath(page, '/tools/sketch', 'Sketch to image');
    await stubReferenceUpload(page);
    const before = await readCredits(E2E_USER_ID);
    await expect(page.getByTestId('studio-empty-state')).toContainText(
      'Draw a sketch, then describe the picture.',
    );
    await expect(generateButton(page)).toBeDisabled();
    await expect(page.getByTestId('studio-reason')).toHaveText('Draw something first.');

    await drawStroke(page);
    await expect(page.getByTestId('studio-reason')).toHaveText('Describe the picture.');
    const prompt = `e2e tiny house ${RUN}`;
    await page.getByTestId('sketch-prompt').fill(prompt);
    const model = page.getByTestId('sketch-model');
    await model.selectOption({ label: 'Flux Kontext Max' });
    await expect(studioCost(page)).toContainText(String(FLUX_KONTEXT_MAX_COST));
    await model.selectOption({ label: 'Nano Banana 2' });
    await expect(studioCost(page)).toContainText(String(NANO_BANANA_2_COST));

    const posted = page.waitForRequest((req) => /\/generate\/image\/?$/.test(req.url()));
    await generateButton(page).click();
    const body = (await posted).postDataJSON() as Record<string, unknown>;
    expect(body).toMatchObject({
      modelName: 'Nano Banana 2',
      prompt: `${SKETCH_GUIDANCE} ${prompt}`,
      numOfOutputs: 1,
      aspectRatio: '1:1',
      outputFormat: 'png',
      referenceImageUrls: ['https://cdn.invalid/sketch.png'],
    });
    const result = page.getByTestId('sketch-result');
    await expect(result).toBeVisible();
    await expect(result).toHaveAttribute('alt', 'Image generated from your sketch');
    expect(generationStub.generateRequestCount()).toBe(1);
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
    await snap('sketch-success');
    await page.screenshot({ path: shotPath('sketch-success') });
  });

  test('@high handoff preloads the target', async ({ page, mediaGenerationStub }) => {
    const asset = await seedImageAsset({
      userId: E2E_USER_ID,
      token: `tools-handoff-${randomUUID().slice(0, 8)}`,
      url: `${FIXTURE_ORIGIN_PATH}/placeholder.webp`,
    });
    try {
      await openPath(page, `${IMAGE_WATERMARK.path}?asset=${asset.id}`, 'Image watermark');
      await expect(page.getByTestId('watermark-image-thumb')).toBeVisible();
      await expect(page).not.toHaveURL(/asset=/);
      await expect(errorState(page)).toHaveCount(0);
      // The loaded image only needs the text now.
      await expect(page.getByTestId('studio-reason')).toHaveText('Enter the watermark text.');
      await page.screenshot({ path: shotPath('handoff-image-watermark') });

      await openPath(page, `/video?asset=${asset.id}`, 'Video studio');
      await expect(page.getByTestId('video-image-thumb')).toBeVisible();
      await expect(page).not.toHaveURL(/asset=/);
      expect(mediaGenerationStub.interceptedPosts()).toHaveLength(0);
    } finally {
      await deleteMediaAsset(asset.id);
    }
  });

  test('@high saved image appears in History with Download', async ({ page }) => {
    const asset = await seedImageAsset({
      userId: E2E_USER_ID,
      token: `tools-history-${randomUUID().slice(0, 8)}`,
      url: `${FIXTURE_ORIGIN_PATH}/placeholder.webp`,
    });
    try {
      await page.goto('/assets');
      await clerk.loaded({ page });
      const item = page.getByTestId('history-image-item').filter({
        has: page.getByRole('img', { name: asset.title }),
      });
      await expect(item).toBeVisible();
      await expect(item.getByRole('link', { name: `Download ${asset.title}` })).toHaveAttribute(
        'href',
        `${FIXTURE_ORIGIN_PATH}/placeholder.webp`,
      );
      await item.getByTestId('handoff-trigger').click();
      await expect(page.getByRole('menuitem', { name: 'Image watermark' })).toBeVisible();
      await page.keyboard.press('Escape');
      await page.screenshot({ path: shotPath('history-image') });
    } finally {
      await deleteMediaAsset(asset.id);
    }
  });

  test.describe('not found', () => {
    // The browser logs the deliberate 404 as a failed resource load.
    test.use({ expectedConsoleErrors: [/status of 404|→ 404/] });

    test("@high another user's asset shows not-found", async ({ page, mediaGenerationStub }) => {
      const asset = await seedImageAsset({
        userId: `e2e-other-user-${RUN}`,
        token: `tools-foreign-${randomUUID().slice(0, 8)}`,
        url: `${FIXTURE_ORIGIN_PATH}/placeholder.webp`,
      });
      try {
        await openPath(page, `${IMAGE_WATERMARK.path}?asset=${asset.id}`, 'Image watermark');
        const alert = errorState(page);
        await expect(alert).toBeVisible();
        await expect(alert).toContainText(NOT_FOUND_COPY);
        await expect(page.getByTestId('watermark-image-thumb')).toHaveCount(0);
        await expect(page.getByTestId('watermark-image-pick')).toBeVisible();
        await expect(page).not.toHaveURL(/asset=/);
        await page.screenshot({ path: shotPath('handoff-not-found') });

        await page.getByTestId('studio-error-action').click();
        await expect(alert).toHaveCount(0);
        expect(mediaGenerationStub.interceptedPosts()).toHaveLength(0);
      } finally {
        await deleteMediaAsset(asset.id);
      }
    });
  });

  test('@medium keyboard-only flows', async ({ page, mediaGenerationStub }) => {
    const before = await readCredits(E2E_USER_ID);
    mediaGenerationStub.setVariant('success', {
      credits: IMAGE_WATERMARK_COST,
    });
    await stubUploads(page);
    await openTool(page, IMAGE_WATERMARK);

    const pick = page.getByTestId('watermark-image-pick');
    await tabUntilFocused(page, pick);
    await expect(pick).toHaveCSS('outline-style', 'solid');
    const chooser = page.waitForEvent('filechooser');
    await page.keyboard.press('Enter');
    await (await chooser).setFiles(SAMPLE_WEBP);
    await expect(page.getByTestId('watermark-image-thumb')).toBeVisible();

    const text = page.getByTestId('watermark-text');
    await tabUntilFocused(page, text);
    await expect(text).toHaveCSS('outline-style', 'solid');
    await page.keyboard.type(watermarkText());
    await expect(text).toHaveValue(watermarkText());

    const topLeft = page.getByRole('radio', { name: 'top left' });
    await tabUntilFocused(page, topLeft);
    await expect(topLeft).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Space');
    await expect(topLeft).toHaveAttribute('aria-checked', 'true');

    const generate = generateButton(page);
    await tabUntilFocused(page, generate);
    const posted = page.waitForRequest((req) =>
      /\/generate\/tools\/image-watermark\/?$/.test(req.url()),
    );
    await page.keyboard.press('Enter');
    expect(((await posted).postDataJSON() as Record<string, unknown>).position).toBe('top-left');
    await expect(resultCard(page)).toBeVisible();

    // The result's Download link and Use in... menu are keyboard reachable too.
    const handoff = page.getByTestId('handoff-trigger');
    await tabUntilFocused(page, handoff);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitem', { name: 'Image watermark' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(handoff).toBeFocused();

    // Sketch toolbar: the tool radios work with arrow keys.
    await openPath(page, '/tools/sketch', 'Sketch to image');
    const brush = page.getByTestId('sketch-tool-brush');
    await brush.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('sketch-tool-eraser')).toBeChecked();
    const prompt = page.getByTestId('sketch-prompt');
    await tabUntilFocused(page, prompt);
    await expect(prompt).toHaveCSS('outline-style', 'solid');

    expect(mediaGenerationStub.acceptedRequestCount()).toBe(1);
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
  });

  test('@medium 375px layout', async ({ page, mediaGenerationStub }) => {
    mediaGenerationStub.setVariant('success', {
      credits: IMAGE_WATERMARK_COST,
    });
    await stubUploads(page);
    await page.setViewportSize({ width: WIDTH_PHONE, height: HEIGHT_PHONE });

    await openTool(page, IMAGE_WATERMARK);
    await fillTool(page, IMAGE_WATERMARK);
    await expectNoHorizontalScroll(page);
    await expectTapTargets([
      generateButton(page),
      page.getByTestId('watermark-text'),
      page.getByTestId('watermark-scale'),
      page.getByTestId('watermark-opacity'),
      ...(await page
        .getByRole('radiogroup', { name: 'Watermark position' })
        .getByRole('radio')
        .all()),
    ]);
    await page.screenshot({ path: shotPath('mobile-375-image-watermark') });
    await generateButton(page).click();
    await expect(resultCard(page)).toBeVisible();
    await expectNoHorizontalScroll(page);
    await page.screenshot({
      path: shotPath('mobile-375-image-watermark-result'),
    });

    await openTool(page, VIDEO_WATERMARK);
    await fillTool(page, VIDEO_WATERMARK);
    await expectNoHorizontalScroll(page);
    await expectTapTargets([
      generateButton(page),
      page.getByTestId('video-watermark-text'),
      page.getByTestId('video-watermark-size'),
      page.getByTestId('video-watermark-file-remove'),
    ]);
    await page.screenshot({ path: shotPath('mobile-375-video-watermark') });

    await openTool(page, AUTOCAPTION);
    await attachFile(page, AUTOCAPTION);
    await expectNoHorizontalScroll(page);
    await expectTapTargets([generateButton(page), page.getByTestId('autocaption-file-remove')]);
    await generateButton(page).click();
    await expect(page.getByTestId('caption-result')).toBeVisible();
    await expectNoHorizontalScroll(page);
    await expectTapTargets([
      page.getByTestId('transcript-copy'),
      page.getByTestId('transcript-download'),
    ]);
    await page.screenshot({ path: shotPath('mobile-375-autocaption-result') });

    await openPath(page, '/tools/sketch', 'Sketch to image');
    await drawStroke(page);
    await expectNoHorizontalScroll(page);
    await expectTapTargets([
      generateButton(page),
      page.getByTestId('sketch-undo'),
      page.getByTestId('sketch-clear'),
      page.getByTestId('sketch-prompt'),
      page.getByTestId('sketch-model'),
    ]);
    await page.screenshot({ path: shotPath('mobile-375-sketch') });
  });

  test('@medium 375px sketch brush size slider is a full-height tap target', async ({ page }) => {
    await page.setViewportSize({ width: WIDTH_PHONE, height: HEIGHT_PHONE });
    await openPath(page, '/tools/sketch', 'Sketch to image');
    await expectTapTargets([page.getByTestId('sketch-size'), page.getByTestId('sketch-undo')]);
  });
});
