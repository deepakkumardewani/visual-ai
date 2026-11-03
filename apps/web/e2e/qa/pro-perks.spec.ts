import { clerk } from '@clerk/testing/playwright';
import { mergeTests, type Page } from '@playwright/test';

import type { IImageObject } from '@visual-ai/shared';

import { test as generationTest } from '../fixtures/generation';
import { expect, test as qaTest } from '../fixtures/qa';
import { API_URL, E2E_WEB_ORIGIN, requireEnv } from '../support/env';
import {
  deleteUsers,
  makePro,
  pullHistoryImages,
  pushHistoryImage,
  readCredits,
  seedExploreUsers,
  uniqueToken,
  type ExploreSeed,
} from '../support/proPerksSeed';
import { resetToFree } from '../support/subscriptionState';

const test = mergeTests(qaTest, generationTest);

const E2E_USER_ID = requireEnv('E2E_CLERK_USER_ID');
const USER_PROFILE_URL = /\/users\/user_/;
const PROGRESS_URL = /\/progress\?jobId=/;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const PREMIUM_MODEL = 'NANO_BANANA_PRO';
const PREMIUM_ERROR_CODE = 'PREMIUM_MODEL_REQUIRES_PRO';
const FREE_DOWNLOAD_TRANSFORM = 'q_auto,f_auto,w_2048,c_limit';
const STUDIO_CREDITS = 500;
const SAVED_ROWS = 4;
const ALT_PREFIX_LENGTH = 60;
// 1x1 transparent PNG
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
// Evidence PNGs land in the repo-level agent_docs/qa tree (playwright runs from apps/web).
const shotPath = (name: string) => `../../agent_docs/qa/pro-perks/${name}.png`;

type ExploreFeed = { items: { id: string; prompt: string }[]; nextCursor: string | null };

async function clerkBearerToken(page: Page): Promise<string> {
  await clerk.loaded({ page });
  return page.evaluate(async () => {
    const token = await window.Clerk.session?.getToken();
    if (!token) throw new Error('[e2e] Clerk session token unavailable');
    return token;
  });
}

async function gotoPage(page: Page, path: string) {
  await page.goto('about:blank');
  await Promise.all([
    page.waitForResponse((res) => USER_PROFILE_URL.test(res.url()) && res.ok()),
    page.goto(path, { waitUntil: 'domcontentloaded' }),
  ]);
}

/** GET against the API with the signed-in user's Clerk token (page must be on the app). */
async function authedGet(page: Page, path: string) {
  const token = await clerkBearerToken(page);
  return page.request.get(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
}

async function readFeed(page: Page): Promise<ExploreFeed> {
  await gotoPage(page, '/create/image');
  const res = await authedGet(page, `/explore/feed?excludeUserId=${E2E_USER_ID}&limit=48`);
  expect(res.ok(), `GET /explore/feed failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  return (await res.json()) as ExploreFeed;
}

test.describe('Pro perks enforced', () => {
  // One shared Clerk user whose plan and history are mutated: tests run one at a time.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async () => {
    await resetToFree(E2E_USER_ID);
  });

  test.afterAll(async () => {
    await resetToFree(E2E_USER_ID);
  });

  test('@critical free user gets 403 for a premium model and credits are unchanged', async ({
    page,
    snap,
  }) => {
    await gotoPage(page, '/create/image');
    await expect(page.getByTestId('composer-textarea-input')).toBeVisible();
    const token = await clerkBearerToken(page);
    const before = await readCredits(E2E_USER_ID);

    const res = await page.request.post(`${API_URL}/generate/image`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        userId: E2E_USER_ID,
        prompt: `premium gate ${uniqueToken()}`,
        modelId: PREMIUM_MODEL,
        aspectRatio: '1:1',
        noOfOutputs: 1,
      },
    });

    expect(res.status()).toBe(HTTP_FORBIDDEN);
    expect(((await res.json()) as { code: string }).code).toBe(PREMIUM_ERROR_CODE);
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
    await snap('premium-model-403');
  });

  test('@high history at cap returns an unsaved result with Download', async ({
    page,
    generationStub,
    snap,
  }) => {
    const token = uniqueToken();
    const prompt = `cap unsaved result ${token}`;
    const replicateUrl = `https://replicate.delivery/e2e/${token}/out.png`;
    const requestedDownloads: string[] = [];
    generationStub.setPrompt(prompt);

    await page.route(USER_PROFILE_URL, async (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      const response = await route.fetch();
      const user = (await response.json()) as Record<string, unknown>;
      return route.fulfill({
        response,
        json: { ...user, credits: STUDIO_CREDITS, dailyCredits: 0 },
      });
    });
    await page.route('https://replicate.delivery/**', (route) => {
      requestedDownloads.push(route.request().url());
      return route.fulfill({
        status: 200,
        contentType: 'image/png',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: Buffer.from(PNG_BASE64, 'base64'),
      });
    });
    // Registered after the stub's own handler, so it wins: the API's at-cap completion payload.
    await page.route(PROGRESS_URL, (route) => {
      const image: Omit<IImageObject, '_id' | 'createdAt' | 'featureType'> & {
        featureType: string;
        createdAt: string;
      } = {
        // No _id: the real at-cap payload is never persisted, so it has none.
        userId: E2E_USER_ID,
        prompt,
        featureType: 'image',
        // The server stamps createdAt on the at-cap payload; JSON serializes it to an ISO string.
        createdAt: new Date().toISOString(),
        modelName: 'E2E Stub',
        imageType: 'horizontal',
        images: [
          {
            name: 'unsaved',
            aiImageUrl: replicateUrl,
            resolution: '1x1',
            aspectRatio: '16:9',
            width: 1,
            height: 1,
            format: 'png',
            bytes: 70,
          },
        ],
      };
      const body = { status: 'completed', image, userCreditsRemaining: 10, savedToHistory: false };
      return route.fulfill({
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': E2E_WEB_ORIGIN,
          'Access-Control-Allow-Credentials': 'true',
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: `data: ${JSON.stringify(body)}\n\n`,
      });
    });

    // A real at-cap user has a full history: seed saved rows so the grid must rank the unsaved result.
    const saved = await Promise.all(
      Array.from({ length: SAVED_ROWS }, (_, index) =>
        pushHistoryImage(E2E_USER_ID, {
          prompt: `cap saved ${index} ${token}`,
          publicId: `e2e/cap_${index}_${token}`,
        }),
      ),
    );
    try {
      await gotoPage(page, '/create/image');
      await page.getByTestId('composer-textarea-input').fill(prompt);
      await page.getByTestId('generate-cta').dispatchEvent('click');

      await expect(page.getByAltText(prompt.slice(0, ALT_PREFIX_LENGTH)).first()).toBeVisible();
      const actions = page.getByTestId('result-next-actions');
      await expect(actions).toBeVisible();
      await expect(actions.getByRole('button', { name: 'Download' })).toBeVisible();
      // Download belongs to the unsaved result, never to one of the saved rows below it.
      const cards = page.getByTestId('user-generation-card');
      await expect(cards.filter({ hasText: token })).toHaveCount(SAVED_ROWS + 1);
      await expect(
        cards.filter({ hasText: prompt }).getByTestId('result-next-actions'),
      ).toHaveCount(1);
      await expect(actions).toHaveCount(1);
      await snap('unsaved-result-with-download');
      await page.screenshot({ path: shotPath('unsaved-result-with-download'), fullPage: true });

      const download = page.waitForEvent('download');
      // dispatchEvent: the result actions animate in, so a pointer click can miss (as in create-image.spec).
      await actions.getByRole('button', { name: 'Download' }).dispatchEvent('click');
      expect((await download).suggestedFilename()).toMatch(/^image-\d+\.png$/);
      expect(new Set(requestedDownloads)).toEqual(new Set([replicateUrl]));
    } finally {
      await pullHistoryImages(
        E2E_USER_ID,
        saved.map((item) => item.id),
      );
    }
  });

  test.describe('Explore privacy', () => {
    let seed: ExploreSeed;

    test.beforeEach(async () => {
      seed = await seedExploreUsers(uniqueToken());
    });

    test.afterEach(async () => {
      await deleteUsers(seed.userIds);
    });

    test('@high Pro generation is hidden from Explore', async ({ page, snap }) => {
      const feed = await readFeed(page);
      const prompts = feed.items.map((item) => item.prompt);
      expect(prompts).toContain(seed.publicItem.prompt);
      expect(prompts).not.toContain(seed.privateItem.prompt);

      const direct = await authedGet(page, `/explore/items/${seed.privateItem.id}`);
      expect(direct.status()).toBe(HTTP_NOT_FOUND);

      await gotoPage(page, '/explore');
      await expect(page.getByRole('img', { name: seed.publicItem.prompt }).first()).toBeVisible();
      await expect(page.getByRole('img', { name: seed.privateItem.prompt })).toHaveCount(0);
      await snap('explore-private-hidden');
      await page.screenshot({ path: shotPath('explore-private-hidden'), fullPage: true });
    });

    test('@medium legacy docs still appear in Explore', async ({ page, snap }) => {
      const feed = await readFeed(page);
      expect(feed.items.map((item) => item.prompt)).toContain(seed.legacyItem.prompt);

      const direct = await authedGet(page, `/explore/items/${seed.legacyItem.id}`);
      expect(direct.ok()).toBeTruthy();

      await gotoPage(page, '/explore');
      await expect(page.getByRole('img', { name: seed.legacyItem.prompt }).first()).toBeVisible();
      await snap('explore-legacy-visible');
    });
  });

  test.describe('Downloads', () => {
    async function openDialogAndDownload(page: Page, imageId: string, prompt: string) {
      await gotoPage(page, '/assets');
      await expect(page.getByTestId('dashboard-assets-panel')).toBeVisible();
      await page.getByTestId('dashboard-assets-panel').getByRole('img', { name: prompt }).click();
      const downloadEndpoint = page.waitForResponse(
        (res) => res.url().includes(`/images/${imageId}/download`) && res.ok(),
      );
      await page.getByRole('dialog').getByRole('button', { name: 'Download' }).click();
      return (await (await downloadEndpoint).json()) as { url: string };
    }

    test('@high free download is optimized and Pro download is original', async ({
      page,
      cloudinaryMock,
      snap,
    }) => {
      const token = uniqueToken();
      const free = await pushHistoryImage(E2E_USER_ID, {
        prompt: `download free ${token}`,
        publicId: `e2e/dl_free_${token}`,
      });
      const pro = await pushHistoryImage(E2E_USER_ID, {
        prompt: `download pro ${token}`,
        publicId: `e2e/dl_pro_${token}`,
      });
      try {
        const freeBody = await openDialogAndDownload(page, free.id, free.prompt);
        expect(freeBody.url).toContain(FREE_DOWNLOAD_TRANSFORM);
        expect(freeBody.url).toContain(`e2e/dl_free_${token}`);
        await expect.poll(() => cloudinaryMock.requestedUrls).toContain(freeBody.url);
        await snap('free-download-optimized');

        await makePro(E2E_USER_ID);
        const proBody = await openDialogAndDownload(page, pro.id, pro.prompt);
        expect(proBody.url).toBe(pro.originalUrl);
        expect(proBody.url).not.toContain(FREE_DOWNLOAD_TRANSFORM);
        await expect.poll(() => cloudinaryMock.requestedUrls).toContain(pro.originalUrl);
        await page.screenshot({ path: shotPath('pro-download-original'), fullPage: true });
      } finally {
        await pullHistoryImages(E2E_USER_ID, [free.id, pro.id]);
      }
    });

    test('@medium another user cannot fetch a download URL for an image they do not own', async ({
      page,
    }) => {
      const other = await seedExploreUsers(uniqueToken());
      try {
        await gotoPage(page, '/create/image');
        const res = await authedGet(page, `/images/${other.publicItem.id}/download?index=0`);
        expect(res.status()).toBe(HTTP_NOT_FOUND);
      } finally {
        await deleteUsers(other.userIds);
      }
    });
  });
});
