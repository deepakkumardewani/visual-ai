/**
 * Captures the README screenshots from the real running app (docs/assets/readme/*).
 *
 * Not part of the normal suite: it only runs in the dedicated `readme` project
 * (`bunx playwright test e2e/readme/capture-readme.spec.ts --project=readme`) and the
 * `chromium` project ignores e2e/readme/. PNGs land in README_SHOT_DIR (default: the OS temp dir)
 * and are converted to WebP by e2e/readme/convert-readme.sh.
 *
 * Safety: the generation fixture stubs POST /generate/*, the paid-call guard stays ON (auto
 * fixture, fails the test if anything paid reaches the network), /feedback* and all user data are
 * stubbed, and every image is a local repo asset served by the dev web server.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { Locator, Page } from '@playwright/test';

import { expect, test } from '../fixtures/generation';
import type { Artwork } from '../support/readme-stubs';
import {
  API_CORS,
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
} from '../support/readme-stubs';

const SHOT_DIR = process.env.README_SHOT_DIR ?? path.join(os.tmpdir(), 'readme-shots');
const VIEWPORT = { width: 1440, height: 900 };
const IMAGE_DECODE_TIMEOUT_MS = 4_000;
const SETTLE_MS = 1_200;

test.use({ viewport: VIEWPORT, deviceScaleFactor: 2, colorScheme: 'light' });
test.setTimeout(90_000);

// --- Page plumbing ---------------------------------------------------------------------------

/** Waits until every <img> on the page has decoded so shots never catch a half-loaded tile. */
async function settleImages(page: Page) {
  // Lazy/offscreen images never load, so decoding is raced against a timeout.
  await page.evaluate(async (timeoutMs) => {
    const decodes = Array.from(document.images)
      .filter((img) => img.complete && img.naturalWidth > 0)
      .map((img) => img.decode().catch(() => undefined));
    await Promise.race([
      Promise.all(decodes),
      new Promise((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
  }, IMAGE_DECODE_TIMEOUT_MS);
  await page.waitForTimeout(SETTLE_MS);
}

async function shot(page: Page, name: string, options: { clip?: Locator } = {}) {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  await settleImages(page);
  const file = path.join(SHOT_DIR, `${name}.png`);
  if (options.clip) await options.clip.screenshot({ path: file, animations: 'disabled' });
  else await page.screenshot({ path: file, animations: 'disabled' });
}

// --- Create-page stub ---------------------------------------------------------------------------

async function generateOnCreate(page: Page, art: Artwork) {
  await page.getByTestId('composer-textarea-input').fill(art.prompt);
  await page.getByTestId('generate-cta').dispatchEvent('click');
  await expect(page.getByTestId('result-next-actions')).toBeVisible();
}

async function openCreateWithResult(
  page: Page,
  generationStub: { setPrompt: (p: string) => void },
  theme: 'light' | 'dark',
) {
  await useTheme(page, theme);
  await stubProfile(
    page,
    HISTORY_ART.slice(1).map((art, index) => toHistoryItem(art, index + 1)),
  );
  await stubFeedbackApi(page, { eligible: false });
  generationStub.setPrompt(HERO_ART.prompt);
  await stubProgress(page, HERO_ART);
  await gotoSignedIn(page, '/create/image');
  await generateOnCreate(page, HERO_ART);
}

// --- Shots ---------------------------------------------------------------------------------------

async function prepare(page: Page, theme: 'light' | 'dark' = 'light') {
  await useTheme(page, theme);
  await stubProfile(
    page,
    HISTORY_ART.map((art, index) => toHistoryItem(art, index + 1)),
  );
  await stubFeedbackApi(page, { eligible: false });
}

test.describe('README screenshots', () => {
  test('create-light', async ({ page, generationStub }) => {
    await openCreateWithResult(page, generationStub, 'light');
    await shot(page, 'create-light');
    expect(generationStub.generateRequestCount()).toBe(1);
  });

  test('create-dark', async ({ page, generationStub }) => {
    await openCreateWithResult(page, generationStub, 'dark');
    await shot(page, 'create-dark');
  });

  test('models', async ({ page }) => {
    await prepare(page);
    await gotoSignedIn(page, '/create/image');
    await page.getByTestId('model-picker').locator('button:visible').first().click();
    await page.waitForTimeout(800);
    await shot(page, 'models');
  });

  test('prompt-ai', async ({ page }) => {
    await prepare(page);
    await gotoSignedIn(page, '/create/image');
    await page.getByTestId('composer-textarea-input').fill('a lighthouse in a storm');
    await page.getByRole('heading', { name: /your creations/i }).click();
    await page.locator('[data-testid="prompt-ai-trigger"]:visible').first().click();
    await expect(page.getByTestId('prompt-ai-panel')).toBeVisible();
    await shot(page, 'prompt-ai');
  });

  test('photo-tools', async ({ page }) => {
    await prepare(page);
    const before = landingFile('colorize-1.144e6229');
    const after = landingUrl('colorize-1.1');
    await stubTransform(page, after);
    await gotoSignedIn(page, '/create/colorize');
    await page.getByTestId('image-upload-input').setInputFiles(before);
    await page.getByTestId('colorize-cta').dispatchEvent('click');
    await confirmIfAsked(page);
    await page.waitForTimeout(4_000);
    await shot(page, 'photo-tools');
  });

  test('assets', async ({ page }) => {
    await prepare(page);
    await stubCollections(page);
    await gotoSignedIn(page, '/assets');
    await expect(page.getByTestId('dashboard-assets-panel')).toBeVisible();
    await shot(page, 'assets');
  });

  test('explore', async ({ page }) => {
    await prepare(page);
    await page.route('**/explore/feed**', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: API_CORS });
      }
      return jsonCors(route, { items: demoExploreFeed(), nextCursor: null });
    });
    await gotoSignedIn(page, '/explore');
    await expect(page.getByTestId('community-card').first()).toBeVisible();
    await shot(page, 'explore');
  });

  test('pricing', async ({ page }) => {
    await prepare(page);
    await gotoSignedIn(page, '/pricing');
    await page
      .getByRole('heading', { name: /free or pro/i })
      .evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await page.evaluate(() => window.scrollBy(0, -90));
    await shot(page, 'pricing');
  });

  test('feedback-popup', async ({ page, generationStub }) => {
    await useTheme(page, 'light');
    await stubProfile(
      page,
      HISTORY_ART.slice(1).map((art, index) => toHistoryItem(art, index + 1)),
    );
    await stubFeedbackApi(page, { eligible: true });
    generationStub.setPrompt(HERO_ART.prompt);
    await stubProgress(page, HERO_ART);
    await gotoSignedIn(page, '/create/image');
    await generateOnCreate(page, HERO_ART);
    await expect(page.getByTestId('feedback-popup')).toBeVisible();
    await page.getByTestId('feedback-rating-5').click();
    await page.waitForTimeout(800);
    await shot(page, 'feedback-popup');
  });

  test('feedback-admin', async ({ page }) => {
    await prepare(page);
    await stubAdminFeedback(page);
    await page.goto('/admin/feedback');
    await page
      .getByTestId(/^feedback-row-/)
      .first()
      .click();
    await expect(page.getByTestId('feedback-detail')).toBeVisible();
    await shot(page, 'feedback-admin');
  });
});

// --- Photo tools + admin helpers -----------------------------------------------------------------

async function confirmIfAsked(page: Page) {
  const dialog = page.getByRole('dialog');
  if (await dialog.isVisible().catch(() => false)) {
    await dialog
      .getByRole('button', { name: /continue|colorize|confirm/i })
      .first()
      .click();
  }
}

const ADMIN_NOW = Date.now();
const HOURS = 3_600_000;

function adminItem(overrides: Record<string, unknown>, index: number) {
  return {
    id: `readme-fb-${index}`,
    userId: `user_demo_${index}`,
    source: 'popup',
    type: 'rating',
    testimonialConsent: false,
    context: {
      route: '/create/image',
      lastModelId: 'flux-lightning',
      plan: 'free',
      creditsTier: '100-499',
      appVersion: '2.4.0',
      userAgent: 'Chrome 131 on macOS',
    },
    status: 'new',
    adminNote: '',
    createdAt: new Date(ADMIN_NOW - (index * 9 + 1) * HOURS).toISOString(),
    updatedAt: new Date(ADMIN_NOW - (index * 9 + 1) * HOURS).toISOString(),
    ...overrides,
  };
}

function adminFixture() {
  return [
    adminItem(
      {
        email: 'nova.lindqvist@example.com',
        rating: 5,
        message:
          'The model picker with credit costs up front is exactly what I wanted. Upscaling my old family photos was a one-click job.',
        testimonialConsent: true,
        displayName: 'Nova L.',
      },
      0,
    ),
    adminItem(
      {
        email: 'kai.moreau@example.com',
        type: 'idea',
        source: 'menu',
        message: 'Would love batch download for a whole collection as a single zip.',
        status: 'triaged',
        adminNote: 'Good fit for the assets page. Needs a size cap.',
      },
      1,
    ),
    adminItem(
      {
        email: 'ines.okafor@example.com',
        type: 'bug',
        source: 'menu',
        message: 'The aspect ratio chips reset to 1:1 when I switch models from the picker.',
        status: 'planned',
      },
      2,
    ),
    adminItem(
      {
        email: 'theo.marlow@example.com',
        rating: 4,
        message: 'Fast and the results are crisp. More styles please.',
      },
      3,
    ),
    adminItem(
      {
        email: 'suri.anand@example.com',
        rating: 2,
        message: 'Colorize result looked a bit washed out on one photo.',
        status: 'done',
      },
      4,
    ),
    adminItem(
      {
        email: 'lena.voss@example.com',
        type: 'other',
        source: 'menu',
        message: 'Thanks for the daily free credits, great for trying things out.',
      },
      5,
    ),
  ];
}

async function stubAdminFeedback(page: Page) {
  await page.route(/\/feedback\/admin\/access$/, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: API_CORS });
    }
    return jsonCors(route, { isAdmin: true });
  });
  await page.route(/\/feedback\/admin(\?.*)?$/, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: API_CORS });
    }
    const items = adminFixture();
    return jsonCors(route, {
      items,
      total: items.length,
      page: 1,
      limit: 25,
      summary: {
        avgRating: 4.2,
        countByType: { rating: 3, bug: 1, idea: 1, other: 1 },
        open: 3,
      },
    });
  });
}
