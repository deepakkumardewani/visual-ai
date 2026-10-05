import type { Page, Route } from '@playwright/test';

import { expect, test } from '@playwright/test';

import type { CollectionListItem } from '@visual-ai/shared';
import type { IImageObject } from '@visual-ai/shared';

import { WEB_URL } from './support/env';

const USER_PROFILE_URL = /\/users\/user_/;
const E2E_USER_ID = process.env.E2E_CLERK_USER_ID ?? 'user_e2e';
const FIXTURE_IMAGE_URL = `${WEB_URL}/e2e-fixture.png`;
const FIXTURE_DOWNLOAD_URL = `${FIXTURE_IMAGE_URL}?download=1`;
const FIXTURE_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const API_CORS = {
  'Access-Control-Allow-Origin': WEB_URL,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': '*',
};

function historyItem(
  id: string,
  prompt: string,
  overrides: Partial<IImageObject> = {},
): IImageObject {
  return {
    _id: id,
    userId: E2E_USER_ID,
    prompt,
    featureType: 'image',
    isFavorite: false,
    createdAt: new Date('2026-01-15T12:00:00.000Z'),
    images: [
      {
        aiImageUrl: FIXTURE_IMAGE_URL,
        format: 'png',
      },
    ],
    ...overrides,
  } as IImageObject;
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    headers: { ...API_CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function gotoSignedIn(page: Page, path: string) {
  await Promise.all([page.waitForResponse(USER_PROFILE_URL), page.goto(path)]);
}

async function stubFixtureImage(page: Page) {
  await page.route('**/e2e-fixture.png**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from(FIXTURE_IMAGE_BASE64, 'base64'),
    }),
  );
}

type AssetsMockOptions = {
  history?: IImageObject[];
  collections?: CollectionListItem[];
};

async function stubAssetsApi(page: Page, options: AssetsMockOptions = {}) {
  let history = [...(options.history ?? [])];
  let collections = [...(options.collections ?? [])];

  const userPayload = () => ({
    userId: E2E_USER_ID,
    userName: 'e2e_user',
    firstName: 'E2E',
    lastName: 'User',
    fullName: 'E2E User',
    email: process.env.E2E_CLERK_USER_EMAIL ?? 'e2e@example.com',
    credits: 100,
    dailyCredits: 10,
    referralCode: 'E2E',
    referrals: [],
    payments: [],
    history,
    favorites: [],
    activities: [],
  });

  await page.route(`**/users/${E2E_USER_ID}`, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: API_CORS });
    }
    if (route.request().method() !== 'GET') {
      return route.continue();
    }
    return fulfillJson(route, userPayload());
  });

  await page.route('**/collections**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: API_CORS });
    }
    const url = route.request().url();
    if (route.request().method() === 'GET' && url.includes('/collections?')) {
      return fulfillJson(route, { success: true, collections });
    }
    return route.continue();
  });

  await page.route('**/image/delete**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: API_CORS });
    }
    const body = route.request().postDataJSON() as { image?: IImageObject; imageIds?: string[] };
    if (route.request().method() === 'DELETE' && body.imageIds?.length) {
      history = history.filter((item) => !body.imageIds!.includes(item._id ?? ''));
      return fulfillJson(route, { success: true, message: 'Images deleted successfully' });
    }
    if (route.request().method() === 'DELETE' && body.image?._id) {
      history = history.filter((item) => item._id !== body.image!._id);
      return fulfillJson(route, {
        success: true,
        image: body.image,
        message: 'Image deleted successfully',
      });
    }
    return route.continue();
  });

  await page.route('**/image/favorite**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: API_CORS });
    }
    const body = route.request().postDataJSON() as { imageId?: string; imageIds?: string[] };
    if (body.imageIds?.length) {
      history = history.map((item) =>
        body.imageIds!.includes(item._id ?? '') ? { ...item, isFavorite: true } : item,
      );
      return fulfillJson(route, { success: true });
    }
    if (body.imageId) {
      let nextFavorite = false;
      history = history.map((item) => {
        if (item._id === body.imageId) {
          nextFavorite = !item.isFavorite;
          return { ...item, isFavorite: nextFavorite };
        }
        return item;
      });
      return fulfillJson(route, { success: true, isFavorite: nextFavorite });
    }
    return route.continue();
  });

  return {
    getHistory: () => history,
    setCollections: (next: CollectionListItem[]) => {
      collections = next;
    },
  };
}

function assetsPanel(page: Page) {
  return page.getByTestId('dashboard-assets-panel');
}

function assetTiles(page: Page) {
  return assetsPanel(page).locator('.asset-tile');
}

function assetImage(page: Page, name: RegExp | string) {
  return assetsPanel(page).getByRole('img', { name });
}

async function openAssets(page: Page) {
  await gotoSignedIn(page, '/assets');
  await expect(page.getByRole('tab', { name: 'Assets', selected: true })).toBeVisible();
  await expect(assetsPanel(page)).toBeVisible();
}

async function hoverFirstTile(page: Page) {
  const tile = assetTiles(page).first();
  await tile.hover();
  return tile;
}

async function setStaleCollectionSelection(page: Page, collectionId: string) {
  await page.evaluate((id) => {
    const root = document.querySelector('#app') as HTMLElement & { __vue_app__?: { _context: { provides: Record<symbol, unknown> } } };
    const app = root.__vue_app__;
    if (!app) throw new Error('Vue app unavailable');
    for (const sym of Object.getOwnPropertySymbols(app._context.provides)) {
      const candidate = app._context.provides[sym] as { _s?: Map<string, { selectedCollectionId: string | null; collections: unknown[] }> };
      if (candidate?._s?.get) {
        const store = candidate._s.get('collections');
        if (store) {
          store.selectedCollectionId = id;
          store.collections = [];
          return;
        }
      }
    }
    throw new Error('collections store unavailable');
  }, collectionId);
}

test.describe('My assets', () => {
  test.beforeEach(async ({ page, context }) => {
    await stubFixtureImage(page);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('empty library explains that nothing has been created yet', async ({ page }) => {
    await stubAssetsApi(page, { history: [] });
    await openAssets(page);

    await test.step('empty copy', async () => {
      await expect(page.getByText('Nothing here yet')).toBeVisible();
    });

    await test.step('toolbar hidden', async () => {
      await expect(page.locator('.history-toolbar')).toHaveCount(0);
      await expect(page.getByTestId('history-search')).toHaveCount(0);
    });
  });

  test('library lists my generations', async ({ page }) => {
    const item = historyItem('e2e-asset-1', 'e2e library lighthouse prompt');
    await stubAssetsApi(page, { history: [item] });
    await openAssets(page);

    await test.step('generation visible', async () => {
      await expect(assetImage(page, /e2e library lighthouse/)).toBeVisible();
    });

    await test.step('search and filters available', async () => {
      await expect(page.getByLabel('Search by prompt')).toBeVisible();
      await expect(page.getByTestId('history-type-filter')).toBeVisible();
      await expect(page.getByTestId('history-size-select')).toBeVisible();
    });
  });

  test('search narrows the library to matching prompts', async ({ page }) => {
    await stubAssetsApi(page, {
      history: [
        historyItem('e2e-search-a', 'e2e unique alpha lantern'),
        historyItem('e2e-search-b', 'e2e beta harbor sunset'),
      ],
    });
    await openAssets(page);

    await assetsPanel(page).getByLabel('Search by prompt').fill('unique alpha');
    await expect(assetImage(page, /unique alpha lantern/)).toBeVisible();
    await expect(assetImage(page, /beta harbor/)).toHaveCount(0);
  });

  test('type filter shows one tool’s results', async ({ page }) => {
    await stubAssetsApi(page, {
      history: [
        historyItem('e2e-type-img', 'e2e text to image fox', { featureType: 'image' }),
        historyItem('e2e-type-up', 'e2e upscale mountain', {
          featureType: 'upscale',
          images: [{ enhancedImageUrl: FIXTURE_IMAGE_URL, format: 'png' }],
        }),
      ],
    });
    await openAssets(page);

    await assetsPanel(page).getByTestId('history-type-filter').click();
    await page.getByRole('button', { name: 'Upscale', pressed: false }).click();
    await expect(assetImage(page, /upscale mountain/)).toBeVisible();
    await expect(assetImage(page, /text to image fox/)).toHaveCount(0);
    await expect(assetTiles(page)).toHaveCount(1);
  });

  test('filters that match nothing explain the empty result', async ({ page }) => {
    await stubAssetsApi(page, {
      history: [historyItem('e2e-filter-empty', 'e2e visible prompt')],
    });
    await openAssets(page);

    await assetsPanel(page).getByLabel('Search by prompt').fill('no-such-prompt-xyz');
    await expect(page.getByText('No results match your filters.')).toBeVisible();
  });

  test('search and filters reset after a reload', async ({ page }) => {
    await stubAssetsApi(page, {
      history: [
        historyItem('e2e-reload-a', 'e2e reload alpha'),
        historyItem('e2e-reload-b', 'e2e reload beta'),
      ],
    });
    await openAssets(page);

    await assetsPanel(page).getByLabel('Search by prompt').fill('alpha');
    await expect(assetImage(page, /reload beta/)).toHaveCount(0);

    await Promise.all([page.waitForResponse(USER_PROFILE_URL), page.reload()]);
    await expect(assetsPanel(page).getByLabel('Search by prompt')).toHaveValue('');
    await expect(assetImage(page, /reload alpha/)).toBeVisible();
    await expect(assetImage(page, /reload beta/)).toBeVisible();
  });

  test('download saves the selected image', async ({ page }) => {
    await stubAssetsApi(page, {
      history: [historyItem('e2e-dl-1', 'e2e download prompt')],
    });
    await openAssets(page);
    await hoverFirstTile(page);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^image-.*\.png$/);
  });

  test('copy link copies the image file address', async ({ page }) => {
    await stubAssetsApi(page, {
      history: [
        historyItem('e2e-link-1', 'e2e copy link prompt', {
          images: [{ aiImageUrl: FIXTURE_DOWNLOAD_URL, format: 'png' }],
        }),
      ],
    });
    await openAssets(page);
    await hoverFirstTile(page);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: 'Copy link' }).click();
    await expect(page.getByText('Link copied')).toBeVisible();

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain('e2e-fixture.png');
  });

  test('delete asks for confirmation and removes the image', async ({ page }) => {
    await stubAssetsApi(page, {
      history: [historyItem('e2e-del-1', 'e2e delete me prompt')],
    });
    await openAssets(page);
    await hoverFirstTile(page);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(page.getByRole('heading', { name: 'Delete generation' })).toBeVisible();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(assetImage(page, /delete me prompt/)).toHaveCount(0);
  });

  test('dismissing delete keeps the image', async ({ page }) => {
    await stubAssetsApi(page, {
      history: [historyItem('e2e-keep-1', 'e2e keep after cancel')],
    });
    await openAssets(page);
    await hoverFirstTile(page);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Keep' }).click();
    await expect(assetImage(page, /keep after cancel/)).toBeVisible();
  });

  test('bulk delete removes every selected image', async ({ page }) => {
    await stubAssetsApi(page, {
      history: [
        historyItem('e2e-bulk-a', 'e2e bulk delete alpha'),
        historyItem('e2e-bulk-b', 'e2e bulk delete beta'),
      ],
    });
    await openAssets(page);

    await assetsPanel(page).getByRole('button', { name: 'Select image' }).first().click();
    await assetsPanel(page).getByRole('button', { name: 'Select image' }).nth(1).click();
    await assetsPanel(page).getByRole('button', { name: 'Delete' }).click();

    await expect(assetImage(page, /bulk delete alpha/)).toHaveCount(0);
    await expect(assetImage(page, /bulk delete beta/)).toHaveCount(0);
  });

  test.fixme(
    'create a collection and add an image to it',
    async () => {
      // Collection create/add UI is behind ENABLE_COLLECTION_CREATE (false in production build).
    },
  );

  test.fixme('rename a collection', async () => {
    // No rename control in the Assets collections strip UI.
  });

  test.fixme('delete a collection keeps the images in All', async () => {
    // No delete-collection control in the Assets UI while collection flags are off.
  });

  test('a missing collection tells me to return to All', async ({ page }) => {
    await stubAssetsApi(page, {
      history: [historyItem('e2e-missing-col', 'e2e collection missing prompt')],
    });
    await openAssets(page);
    await setStaleCollectionSelection(page, 'col_deleted');

    await expect(page.getByText('this collection is empty')).toBeVisible();
    await expect(page.getByText('Switch to All, select images, then use Add to collection.')).toBeVisible();
  });

  test('favorite marks an image', async ({ page }) => {
    await stubAssetsApi(page, {
      history: [historyItem('e2e-fav-1', 'e2e favorite prompt', { isFavorite: false })],
    });
    await openAssets(page);
    await hoverFirstTile(page);

    await page.getByRole('button', { name: 'Add to favorites' }).click();
    await expect(page.getByRole('button', { name: 'Remove from favorites' })).toBeVisible();
  });
});
