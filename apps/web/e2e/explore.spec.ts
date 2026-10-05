import type { Page, Route } from '@playwright/test';

import { expect, test } from '@playwright/test';

import type { ExploreFeedItem } from '@visual-ai/shared';

import { WEB_URL } from './support/env';

const USER_PROFILE_URL = /\/users\/user_/;
const FIXTURE_IMAGE_URL = `${WEB_URL}/e2e-fixture.png`;
const FIXTURE_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const API_CORS = {
  'Access-Control-Allow-Origin': WEB_URL,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': '*',
};

const NEIGHBOR_USER_ID = 'user_e2e_neighbor';
const E2E_USER_ID = process.env.E2E_CLERK_USER_ID ?? '';

function feedItem(
  id: string,
  prompt: string,
  overrides: Partial<ExploreFeedItem> = {},
): ExploreFeedItem {
  return {
    id,
    imageUrl: FIXTURE_IMAGE_URL,
    aspectRatio: '16:9',
    prompt,
    modelName: 'E2E Model',
    author: 'Neighbor Creator',
    authorUserId: NEIGHBOR_USER_ID,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
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

type FeedMockOptions = {
  pages?: Array<{ items: ExploreFeedItem[]; nextCursor: string | null }>;
  failFeed?: boolean;
  itemById?: Record<string, ExploreFeedItem | 'missing'>;
};

async function stubExploreApi(page: Page, options: FeedMockOptions = {}) {
  const pages = options.pages ?? [
    {
      items: [feedItem('e2e-exp-1', 'e2e explore prompt one')],
      nextCursor: null,
    },
  ];
  let feedCall = 0;
  const feedRequests: URL[] = [];

  await page.route('**/explore/feed**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: API_CORS });
    }
    feedRequests.push(new URL(route.request().url()));
    if (options.failFeed) {
      return fulfillJson(route, { message: 'fail' }, 500);
    }
    const pageIndex = Math.min(feedCall, pages.length - 1);
    feedCall += 1;
    return fulfillJson(route, pages[pageIndex]);
  });

  await page.route('**/explore/items/**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: API_CORS });
    }
    const id = route.request().url().split('/explore/items/')[1]?.split('?')[0] ?? '';
    const entry = options.itemById?.[id];
    if (entry === 'missing') {
      return fulfillJson(route, { message: 'Not found' }, 404);
    }
    if (entry) {
      return fulfillJson(route, entry);
    }
    return route.continue();
  });

  return { feedRequests };
}

async function openExploreFeed(page: Page) {
  await gotoSignedIn(page, '/explore');
  await expect(page.getByRole('heading', { name: 'Community Creations' })).toBeVisible();
}

async function openCreationFromFeed(page: Page) {
  await page.getByTestId('community-card').first().click();
  await expect(page.getByTestId('explore-image-viewer')).toBeVisible();
}

/** Hard `page.goto` to `/explore/:id` redirects to `/create` in dev; use in-app navigation. */
async function gotoExploreImageInApp(page: Page, id: string) {
  await page.evaluate(async (creationId) => {
    const root = document.querySelector('#app') as HTMLElement & {
      __vue_app__?: { config: { globalProperties: { $router: import('vue-router').Router } } };
    };
    const router = root.__vue_app__?.config.globalProperties.$router;
    if (!router) throw new Error('Vue router unavailable');
    await router.push({ name: 'explore-image', params: { id: creationId } });
  }, id);
  await expect(page).toHaveURL(new RegExp(`/explore/${id}$`));
}

test.describe('signed-in member', () => {
  test.beforeEach(async ({ page }) => {
    await stubFixtureImage(page);
  });

  test('sees the community feed without own creations', async ({ page }) => {
    const prompt = 'e2e neighbor lighthouse at dusk';
    const { feedRequests } = await stubExploreApi(page, {
      pages: [{ items: [feedItem('e2e-exp-feed-1', prompt)], nextCursor: null }],
    });

    await test.step('open Explore', async () => {
      await openExploreFeed(page);
    });

    await test.step('feed shows neighbor creations only', async () => {
      await expect(page.getByTestId('community-card')).toHaveCount(1);
      await expect(page.getByText(prompt)).toBeVisible();
      if (E2E_USER_ID) {
        const url = feedRequests[0]?.searchParams.get('excludeUserId');
        expect(url).toBe(E2E_USER_ID);
      }
      await expect(page.getByTestId('community-card')).not.toContainText(E2E_USER_ID);
    });
  });

  test('empty community feed explains nothing is published yet', async ({ page }) => {
    await stubExploreApi(page, { pages: [{ items: [], nextCursor: null }] });
    await openExploreFeed(page);
    await expect(page.getByTestId('community-feed-empty')).toBeVisible();
    await expect(
      page.getByText('No community creations yet. Be among the first to generate something inspiring.'),
    ).toBeVisible();
  });

  test('feed load failure offers a retry', async ({ page }) => {
    let fail = true;
    await page.route('**/explore/feed**', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: API_CORS });
      }
      if (fail) {
        fail = false;
        return fulfillJson(route, { message: 'fail' }, 500);
      }
      return fulfillJson(route, { items: [feedItem('e2e-exp-retry', 'after retry')], nextCursor: null });
    });

    await openExploreFeed(page);
    await expect(page.getByTestId('community-feed-error')).toBeVisible();
    await expect(page.getByText('Could not load community creations. Try again.')).toBeVisible();
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByTestId('community-card')).toHaveCount(1);
  });

  test('load more appends the next page of creations', async ({ page }) => {
    await stubExploreApi(page, {
      pages: [
        { items: [feedItem('e2e-exp-page-1', 'page one prompt')], nextCursor: 'cursor-2' },
        { items: [feedItem('e2e-exp-page-2', 'page two prompt')], nextCursor: null },
      ],
    });

    await openExploreFeed(page);
    await expect(page.getByTestId('community-card')).toHaveCount(1);
    await page.getByTestId('community-feed-load-more').click();
    await expect(page.getByTestId('community-card')).toHaveCount(2);
    await expect(page.getByText('page two prompt')).toBeVisible();
  });

  test('opening a creation shows image, prompt, and actions', async ({ page }) => {
    const prompt = 'e2e viewer prompt: aurora over fjord';
    const item = feedItem('e2e-exp-detail', prompt);
    await stubExploreApi(page, {
      pages: [{ items: [item], nextCursor: null }],
      itemById: { [item.id]: item },
    });

    await openExploreFeed(page);
    await openCreationFromFeed(page);

    await expect(page).toHaveURL(/\/explore\/e2e-exp-detail/);
    await expect(page.getByTestId('explore-image-viewer')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Prompt' })).toBeVisible();
    await expect(page.getByText(prompt)).toBeVisible();
    await expect(page.getByTestId('explore-viewer-share')).toBeVisible();
    await expect(page.getByTestId('explore-viewer-download')).toBeVisible();
    await expect(page.getByTestId('explore-viewer-remix')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Enhance tools' })).toBeVisible();
  });

  test('missing creation explains it could not be found', async ({ page }) => {
    await stubExploreApi(page, {
      pages: [{ items: [], nextCursor: null }],
      itemById: { 'e2e-missing-id': 'missing' },
    });

    await gotoSignedIn(page, '/explore');
    await gotoExploreImageInApp(page, 'e2e-missing-id');
    await expect(page.getByText('This creation could not be found.')).toBeVisible();
    await page.getByRole('button', { name: 'Back to Explore' }).click();
    await expect(page).toHaveURL(/\/explore$/);
  });

  test('share copies the creation page address', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(() => {
      delete (navigator as Navigator & { share?: unknown }).share;
    });
    const item = feedItem('e2e-exp-share', 'share me');
    await stubExploreApi(page, {
      pages: [{ items: [item], nextCursor: null }],
      itemById: { [item.id]: item },
    });

    await openExploreFeed(page);
    await openCreationFromFeed(page);
    await page.getByTestId('explore-viewer-share').click();
    await expect(page.getByText('Link copied')).toBeVisible();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toMatch(new RegExp(`/explore/${item.id}$`));
  });

  test('next moves to the neighbor creation', async ({ page }) => {
    const first = feedItem('e2e-exp-nav-1', 'first creation');
    const second = feedItem('e2e-exp-nav-2', 'second creation');
    await stubExploreApi(page, {
      pages: [{ items: [first, second], nextCursor: null }],
      itemById: { [first.id]: first, [second.id]: second },
    });

    await openExploreFeed(page);
    await page.getByRole('listitem').filter({ hasText: 'first creation' }).click();
    await expect(page.getByTestId('explore-image-viewer')).toBeVisible();
    await test.step('go to the next creation', async () => {
      await page.getByTestId('explore-viewer-next').click();
      await expect(page).toHaveURL(/\/explore\/e2e-exp-nav-2/);
      await expect(
        page.getByAltText('Generation by Neighbor Creator: second creation'),
      ).toBeVisible();
    });

    await test.step('go to the previous creation', async () => {
      await page.getByTestId('explore-viewer-prev').click();
      await expect(page).toHaveURL(/\/explore\/e2e-exp-nav-1/);
      await expect(
        page.getByAltText('Generation by Neighbor Creator: first creation'),
      ).toBeVisible();
    });
  });

  test('remix opens the generator with the creation prompt', async ({ page }) => {
    const prompt = 'e2e remix from explore viewer';
    const item = feedItem('e2e-exp-remix', prompt);
    await stubExploreApi(page, {
      pages: [{ items: [item], nextCursor: null }],
      itemById: { [item.id]: item },
    });

    await openExploreFeed(page);
    await openCreationFromFeed(page);
    await page.getByTestId('explore-viewer-remix').click();
    await expect(page).toHaveURL(/\/create(\/image)?$/);
    await expect(page.getByTestId('composer-textarea-input')).toHaveValue(prompt);
  });

  test('use as reference opens the generator with the image attached', async ({ page }) => {
    const prompt = 'e2e reference source prompt';
    const item = feedItem('e2e-exp-ref', prompt);
    await stubExploreApi(page, {
      pages: [{ items: [item], nextCursor: null }],
      itemById: { [item.id]: item },
    });

    await openExploreFeed(page);
    await openCreationFromFeed(page);
    await page.getByTestId('explore-viewer-reference').click();
    await expect(page).toHaveURL(/\/create(\/image)?$/);
    await expect(page.getByTestId('reference-image-preview')).toBeVisible();
    await expect(page.getByTestId('composer-textarea-input')).toHaveValue('');
  });
});

test.describe('signed-out visitor', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('sees the Explore heading without a feed', async ({ page }) => {
    await page.goto('/explore');
    await expect(page.getByRole('heading', { name: 'Community Creations' })).toBeVisible();
    await expect(page.getByTestId('community-feed-loading')).toHaveCount(0);
    await expect(page.getByTestId('community-card')).toHaveCount(0);
    await expect(page.getByTestId('community-feed-empty')).toHaveCount(0);
  });
});
