import { randomUUID } from 'node:crypto';

import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures/qa';
import { requireEnv } from '../support/env';

const USER_PROFILE_URL = /\/users\/user_/;
// Same var the app reads; the fallback is the shared dev cloud used by .env.local / .env.staging.
const CLOUDINARY_UPLOAD =
  process.env.VITE_CLOUDINARY_BASE_URL ?? 'https://res.cloudinary.com/o7be9uws/image/upload';
const THUMB_WIDTH = 'w_400';
const THUMB_TRANSFORM = 'q_auto,f_auto,w_400,c_limit';
// Evidence PNGs land in the repo-level agent_docs/qa tree (playwright runs from apps/web).
const shotPath = (name: string) => `../../agent_docs/qa/thumbnails/${name}.png`;

type SeededItem = { id: string; publicId: string; prompt: string };

function seedItem(): SeededItem {
  const token = randomUUID().replace(/-/g, '').slice(0, 10);
  return {
    id: `e2e_thumb_${token}`,
    publicId: `e2e/thumb_${token}`,
    prompt: `thumb prompt ${token}`,
  };
}

function toHistoryEntry(item: SeededItem) {
  return {
    _id: item.id,
    userId: requireEnv('E2E_CLERK_USER_ID'),
    prompt: item.prompt,
    featureType: 'image',
    isFavorite: false,
    createdAt: new Date().toISOString(),
    images: [
      {
        name: `${item.id}.png`,
        aiImagePublicId: item.publicId,
        resolution: '1024x1024',
        aspectRatio: '1:1',
        width: 1024,
        height: 1024,
        format: 'png',
        bytes: 1000,
      },
    ],
  };
}

/** Replaces the profile history (and optionally the collections list) with deterministic seed data. */
async function seedHistory(page: Page, items: SeededItem[], collectionName?: string) {
  await page.route(`**/users/${requireEnv('E2E_CLERK_USER_ID')}**`, async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const response = await route.fetch();
    const body = (await response.json()) as Record<string, unknown>;
    return route.fulfill({ response, json: { ...body, history: items.map(toHistoryEntry) } });
  });

  await page.route('**/collections?**', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const imageIds = items.map((item) => item.id);
    const collections = collectionName
      ? [
          {
            id: `e2e_col_${randomUUID().slice(0, 8)}`,
            userId: requireEnv('E2E_CLERK_USER_ID'),
            name: collectionName,
            imageIds,
            count: imageIds.length,
            coverImageIds: imageIds.slice(0, 4),
          },
        ]
      : [];
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, collections }),
    });
  });
}

async function openAssets(page: Page) {
  await page.goto('about:blank');
  await Promise.all([
    page.waitForResponse((res) => USER_PROFILE_URL.test(res.url()) && res.ok()),
    page.goto('/assets', { waitUntil: 'domcontentloaded' }),
  ]);
  await expect(page.getByTestId('dashboard-assets-panel')).toBeVisible();
}

const thumbPrefix = (item: SeededItem) =>
  new RegExp(`${CLOUDINARY_UPLOAD}/[^/]*${THUMB_WIDTH}[^/]*/.*${item.publicId}$`);

test.describe('History thumbnails', () => {
  test('History grid image request URL contains w_400 @high', async ({
    page,
    cloudinaryMock,
    snap,
  }) => {
    const item = seedItem();
    await seedHistory(page, [item]);
    await openAssets(page);

    const tile = page.getByTestId('dashboard-assets-panel').getByRole('img', { name: item.prompt });
    await expect(tile).toBeVisible();
    await expect(tile).toHaveAttribute('src', thumbPrefix(item));
    await expect
      .poll(() => cloudinaryMock.requestedUrls.filter((url) => url.includes(item.publicId)))
      .toEqual([expect.stringMatching(thumbPrefix(item))]);
    await snap('history-grid-thumbnail');
    await page.screenshot({ path: shotPath('history-grid-thumbnail'), fullPage: true });
  });

  test('collections strip image request URL contains w_400 @high', async ({
    page,
    cloudinaryMock,
  }) => {
    const item = seedItem();
    const collectionName = `Thumbs ${item.id.slice(-6)}`;
    await seedHistory(page, [item], collectionName);
    await openAssets(page);

    const chip = page.getByRole('button', { name: new RegExp(`^${collectionName}, 1 images`) });
    await expect(chip).toBeVisible();
    // Cover images are decorative (alt="" inside aria-hidden), so assert on the recorded request.
    // The strip builds `<base>/<thumb transform>/<publicId>` (the grid's URL has a second transform).
    await expect
      .poll(() => cloudinaryMock.requestedUrls)
      .toContain(`${CLOUDINARY_UPLOAD}/q_auto,f_auto,w_400,c_limit/${item.publicId}`);
    const covers = chip.locator('img');
    await expect(covers).toHaveCount(1);
    await expect(covers).toHaveAttribute('src', thumbPrefix(item));
    await page.screenshot({ path: shotPath('collections-strip-thumbnail'), fullPage: true });
  });

  test('ImageDialog requests the non-thumbnail URL @high', async ({ page, cloudinaryMock }) => {
    const item = seedItem();
    await seedHistory(page, [item]);
    await openAssets(page);

    const fullUrl = `${CLOUDINARY_UPLOAD}/q_auto,f_auto/${item.publicId}`;
    const tile = page.getByTestId('dashboard-assets-panel').getByRole('img', { name: item.prompt });
    await expect(tile).toHaveAttribute('src', thumbPrefix(item));
    expect(cloudinaryMock.requestedUrls).not.toContain(fullUrl);

    await tile.click();
    const dialogImage = page.locator(`img[src="${fullUrl}"]`);
    await expect(dialogImage).toBeVisible();
    await expect(dialogImage).not.toHaveAttribute('src', new RegExp(THUMB_WIDTH));
    await expect.poll(() => cloudinaryMock.requestedUrls).toContain(fullUrl);
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(dialogImage).toBeInViewport();
    // Let the open transition finish so the evidence shows the settled dialog.
    await expect(dialogImage).toHaveCSS('opacity', '1');
    await expect(page.getByRole('dialog')).toHaveCSS('opacity', '1');
    await page.screenshot({ path: shotPath('image-dialog-full-size'), fullPage: true });
  });

  test('empty history renders no image requests @medium', async ({ page, cloudinaryMock }) => {
    await seedHistory(page, []);
    await openAssets(page);

    await expect(page.getByText('Nothing here yet')).toBeVisible();
    await expect(page.getByTestId('dashboard-assets-panel').getByRole('img')).toHaveCount(0);
    // Prerendered production builds load the landing gallery's Cloudinary images on /assets,
    // so only history-grid (thumbnail-transform) requests are relevant here.
    expect(cloudinaryMock.requestedUrls.filter((url) => url.includes(THUMB_TRANSFORM))).toEqual([]);
    await page.screenshot({ path: shotPath('empty-history'), fullPage: true });
  });
});
