/**
 * Records the raw scenes for the README hero demo video (one WebM per scene).
 *
 * Not part of the normal suite: it only runs in the `readme` project
 * (`bunx playwright test e2e/readme/capture-demo.spec.ts --project=readme`). Clips land in
 * DEMO_CAPTURE_DIR and are edited into demo.mp4 with Remotion outside the app source.
 *
 * Safety (same as capture-readme.spec.ts): the generation fixture stubs POST /generate/*, the
 * paid-call guard stays ON, /feedback* and all user data are stubbed with an invented demo user,
 * and every image is a local repo asset.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { Locator, Page, TestInfo } from '@playwright/test';

import { expect, test } from '../fixtures/generation';
import {
  HERO_ART,
  HISTORY_ART,
  demoExploreFeed,
  gotoSignedIn,
  jsonCors,
  landingFile,
  landingUrl,
  stubCollections,
  stubFeedbackApi,
  stubProfile,
  stubProgress,
  stubTransform,
  toHistoryItem,
  useTheme,
  API_CORS,
} from '../support/readme-stubs';

const CAPTURE_DIR = process.env.DEMO_CAPTURE_DIR ?? path.join(os.tmpdir(), 'readme-demo-capture');
// Playwright records at the viewport size (no upscaling), so the 16:9 viewport is the video size.
const VIEWPORT = { width: 1600, height: 900 };
const VIDEO_SIZE = VIEWPORT;
const TYPE_DELAY_MS = 45;
const GENERATE_DELAY_MS = 2_200;
const CURSOR_STEPS = 18;

test.use({
  viewport: VIEWPORT,
  colorScheme: 'light',
  video: { mode: 'on', size: VIDEO_SIZE },
});
test.setTimeout(120_000);

const CURSOR_SCRIPT = `
  window.addEventListener('DOMContentLoaded', () => {
    const cursor = document.createElement('div');
    cursor.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 3L19 12L12 13L9 20L5 3Z" fill="white" stroke="#1c1713" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    cursor.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;left:-40px;top:-40px;filter:drop-shadow(1px 2px 3px rgba(0,0,0,.35));';
    document.documentElement.appendChild(cursor);
    window.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    }, true);
  });
`;

// Clips start while the app is still showing loading skeletons; the edit trims to this offset.
let sceneStartedAt = 0;
let readyMs = 0;
let marks: Record<string, number> = {};

function markReady() {
  readyMs = Date.now() - sceneStartedAt;
}

/** Named offsets (ms since scene start) the edit uses to speed up and zoom on key moments. */
function mark(name: string) {
  marks[name] = Date.now() - sceneStartedAt;
}

interface PrepareOptions {
  feedbackEligible?: boolean;
  /** Scenes that generate the hero image start without it in history so the reveal is new. */
  includeHeroInHistory?: boolean;
}

async function prepare(page: Page, options: PrepareOptions = {}) {
  const history = options.includeHeroInHistory ? HISTORY_ART : HISTORY_ART.slice(1);
  sceneStartedAt = Date.now();
  readyMs = 0;
  marks = {};
  await useTheme(page, 'light');
  await page.addInitScript(CURSOR_SCRIPT);
  await stubProfile(
    page,
    history.map((art, index) => toHistoryItem(art, index + 1)),
  );
  await stubFeedbackApi(page, { eligible: options.feedbackEligible ?? false });
}

async function glideTo(page: Page, target: Locator) {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error('glideTo: target has no bounding box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: CURSOR_STEPS });
}

async function glideAndClick(page: Page, target: Locator) {
  await glideTo(page, target);
  await page.waitForTimeout(250);
  await target.click();
}

/** Saves the scene's recording under a stable name once the page is closed. */
async function saveScene(page: Page, name: string, testInfo: TestInfo) {
  const video = page.video();
  // Taken right before close so the edit can align marks to the end of the recording.
  const endMs = Date.now() - sceneStartedAt;
  await page.close();
  if (!video) throw new Error(`No video recorded for scene "${name}" (${testInfo.title})`);
  fs.mkdirSync(CAPTURE_DIR, { recursive: true });
  await video.saveAs(path.join(CAPTURE_DIR, `${name}.webm`));
  fs.writeFileSync(
    path.join(CAPTURE_DIR, `${name}.json`),
    JSON.stringify({ readyMs, marks: { ...marks, end: endMs } }),
  );
}

async function typePrompt(page: Page, prompt: string) {
  const input = page.getByTestId('composer-textarea-input');
  await glideAndClick(page, input);
  mark('typeStart');
  await input.pressSequentially(prompt, { delay: TYPE_DELAY_MS });
  mark('typeEnd');
}

async function generate(page: Page) {
  await glideTo(page, page.getByTestId('generate-cta'));
  await page.waitForTimeout(300);
  await page.getByTestId('generate-cta').dispatchEvent('click');
}

test.describe('README demo scenes', () => {
  test('01-create', async ({ page, generationStub }, testInfo) => {
    await prepare(page);
    generationStub.setPrompt(HERO_ART.prompt);
    await stubProgress(page, HERO_ART, { delayMs: GENERATE_DELAY_MS });
    await gotoSignedIn(page, '/create/image');
    await expect(page.getByTestId('model-picker').locator('button:visible').first()).toBeVisible();
    await page.waitForTimeout(1_500);
    markReady();

    await typePrompt(page, HERO_ART.prompt);
    await page.waitForTimeout(500);

    const picker = page.getByTestId('model-picker').locator('button:visible').first();
    await glideAndClick(page, picker);
    mark('pickerOpen');
    await page.waitForTimeout(2_000);
    await page.keyboard.press('Escape');
    mark('pickerClosed');
    await page.waitForTimeout(600);

    await generate(page);
    mark('generated');
    await expect(page.getByTestId('result-next-actions')).toBeVisible();
    mark('result');
    await page.waitForTimeout(3_500);
    expect(generationStub.generateRequestCount()).toBe(1);
    await saveScene(page, '01-create', testInfo);
  });

  test('02-photo-tool', async ({ page }, testInfo) => {
    await prepare(page);
    await stubTransform(page, landingUrl('colorize-1.1'));
    await gotoSignedIn(page, '/create/colorize');
    await expect(page.getByTestId('image-upload-input')).toBeAttached();
    await page.waitForTimeout(1_500);
    markReady();
    await page.getByTestId('image-upload-input').setInputFiles(landingFile('colorize-1.144e6229'));
    mark('uploaded');
    await page.waitForTimeout(1_800);
    await glideTo(page, page.getByTestId('colorize-cta'));
    await page.getByTestId('colorize-cta').dispatchEvent('click');
    mark('colorizeClick');
    const dialog = page.getByRole('dialog');
    if (await dialog.isVisible().catch(() => false)) {
      await dialog
        .getByRole('button', { name: /continue|colorize|confirm/i })
        .first()
        .click();
    }
    await page.waitForTimeout(5_500);
    await saveScene(page, '02-photo-tool', testInfo);
  });

  test('03-assets', async ({ page }, testInfo) => {
    await prepare(page, { includeHeroInHistory: true });
    await stubCollections(page);
    await gotoSignedIn(page, '/assets');
    await expect(page.getByTestId('dashboard-assets-panel')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Assets' })).toBeVisible();
    await page.waitForTimeout(2_000);
    markReady();
    await page.waitForTimeout(1_500);
    await page.mouse.move(700, 420, { steps: CURSOR_STEPS });
    mark('scroll');
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(2_000);
    await saveScene(page, '03-assets', testInfo);
  });

  test('04-explore', async ({ page }, testInfo) => {
    await prepare(page, { includeHeroInHistory: true });
    await page.route('**/explore/feed**', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: API_CORS });
      }
      return jsonCors(route, { items: demoExploreFeed(), nextCursor: null });
    });
    await gotoSignedIn(page, '/explore');
    await expect(page.getByTestId('community-card').first()).toBeVisible();
    await page.waitForTimeout(1_000);
    markReady();
    await page.waitForTimeout(1_500);
    await page.mouse.move(720, 400, { steps: CURSOR_STEPS });
    mark('scroll');
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(2_200);
    await saveScene(page, '04-explore', testInfo);
  });

  test('05-pricing', async ({ page }, testInfo) => {
    await prepare(page);
    await gotoSignedIn(page, '/pricing');
    await page
      .getByRole('heading', { name: /free or pro/i })
      .evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await page.evaluate(() => window.scrollBy(0, -90));
    await page.waitForTimeout(1_000);
    markReady();
    await page.mouse.move(720, 500, { steps: CURSOR_STEPS });
    await page.waitForTimeout(3_000);
    await saveScene(page, '05-pricing', testInfo);
  });

  test('06-feedback', async ({ page, generationStub }, testInfo) => {
    await prepare(page, { feedbackEligible: true });
    generationStub.setPrompt(HERO_ART.prompt);
    await stubProgress(page, HERO_ART);
    await gotoSignedIn(page, '/create/image');
    await page.getByTestId('composer-textarea-input').fill(HERO_ART.prompt);
    markReady();
    await page.getByTestId('generate-cta').dispatchEvent('click');
    await expect(page.getByTestId('feedback-popup')).toBeVisible();
    await page.waitForTimeout(1_200);
    mark('popup');
    await glideAndClick(page, page.getByTestId('feedback-rating-5'));
    mark('rated');
    await page.waitForTimeout(3_000);
    await saveScene(page, '06-feedback', testInfo);
  });
});
