import { randomUUID } from 'node:crypto';

import { clerk } from '@clerk/testing/playwright';
import { mergeTests, type Page } from '@playwright/test';

import { test as mediaTest } from '../fixtures/media';
import { expect, test as qaTest } from '../fixtures/qa';
import { E2E_WEB_ORIGIN, requireEnv } from '../support/env';
import { readCredits } from '../support/proPerksSeed';

const test = mergeTests(qaTest, mediaTest);

const E2E_USER_ID = requireEnv('E2E_CLERK_USER_ID');
const RUN = randomUUID().slice(0, 8);
const USER_PROFILE_URL = /\/users\/user_/;
const SONG_PATH = '/audio/song';
const WIDTH_PHONE = 375;
const HEIGHT_PHONE = 812;
const MIN_TAP_PX = 44;
const MAX_TAB_PRESSES = 40;
// Minimax Music 2.6: ceil(0.15 USD x 200 credits per USD), independent of the app's cost function.
const SONG_COST = 30;
const STUB_ASSET_TITLE = 'E2E stub asset';
const NO_CREDITS_USED = 'No credits were used.';
// Evidence PNGs land in the repo-level agent_docs/qa tree (playwright runs from apps/web).
const shotPath = (name: string) => `../../agent_docs/qa/song-studio/${name}.png`;

const EXAMPLE_ROAD_TRIP = {
  style: 'Indie rock, upbeat, windows down',
  lyrics: '[Verse]\nMap folded on the dashboard',
};
const EXAMPLE_LULLABY = {
  style: 'Lo-fi piano, soft, sleepy',
  lyrics: '[Verse]\nRain on the window, the city hums low',
};

function songDraft() {
  return {
    style: `e2e dreamy synth-pop ${RUN}`,
    lyrics: `[Verse]\nNeon streets and quiet rain ${RUN}\n[Chorus]\nWe keep the lights on`,
  };
}

async function openSongStudio(page: Page) {
  await Promise.all([
    page.waitForResponse((res) => USER_PROFILE_URL.test(res.url()) && res.ok(), {
      timeout: 30_000,
    }),
    page.goto(SONG_PATH),
  ]);
  await clerk.loaded({ page });
  await expect(page.getByRole('heading', { name: 'Song studio' })).toBeVisible();
}

async function fillSong(page: Page, draft = songDraft()) {
  await page.getByLabel('Style', { exact: true }).fill(draft.style);
  await page.getByLabel('Lyrics', { exact: true }).fill(draft.lyrics);
}

function chipTotal(page: Page) {
  return page.getByTestId('credits-chip');
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
            feature: 'song',
            modelKey: 'E2E_STUB',
            title: STUB_ASSET_TITLE,
            url: `${E2E_WEB_ORIGIN}/e2e-media/sample.mp3`,
            durationSec: 1,
            creditsCharged: SONG_COST,
            saved: true,
            createdAt: new Date().toISOString(),
          },
        ],
        nextCursor: null,
      },
    });
  });
}

test.describe('song studio', () => {
  test.beforeEach(async ({ page }) => {
    await openSongStudio(page);
  });

  test('@critical generate a song and the balance drops by the per-file cost', async ({
    page,
    mediaGenerationStub,
    snap,
  }) => {
    const before = await readCredits(E2E_USER_ID);
    const total = before.credits + before.dailyCredits;
    await expect(chipTotal(page)).toContainText(String(total));
    const remaining = before.credits - SONG_COST;
    mediaGenerationStub.setVariant('slow', {
      credits: SONG_COST,
      userCreditsRemaining: remaining,
    });

    await fillSong(page);
    await expect(page.getByTestId('studio-cost')).toContainText(String(SONG_COST));
    await page.getByTestId('studio-generate').click();

    await expect(page.getByTestId('job-progress')).toBeVisible();
    const card = page.getByTestId('result-card');
    await expect(card).toBeVisible();
    await expect(card.getByRole('button', { name: `Play ${STUB_ASSET_TITLE}` })).toBeFocused();
    await expect(chipTotal(page)).toContainText(String(remaining + before.dailyCredits));

    expect(mediaGenerationStub.acceptedRequestCount()).toBe(1);
    expect(mediaGenerationStub.interceptedPosts()).toHaveLength(1);
    // The stub answers the POST, so the real API never ran: the stored balance cannot have moved.
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
    await snap('song-success');
    await page.screenshot({ path: shotPath('success') });
  });

  test.describe('insufficient credits', () => {
    // The browser logs the deliberate 402 as a failed resource load.
    test.use({ expectedConsoleErrors: [/status of 402|→ 402/] });

    test('@critical insufficient credits opens the low-credits dialog and queues nothing', async ({
      page,
      mediaGenerationStub,
    }) => {
      mediaGenerationStub.setVariant('insufficient', { required: SONG_COST, available: 7 });
      const before = await readCredits(E2E_USER_ID);

      await fillSong(page);
      await page.getByTestId('studio-generate').click();

      const dialog = page.getByRole('dialog', { name: 'Low credits' });
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(`${SONG_COST} credits are required`);
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
    await expect(chipTotal(page)).toContainText(String(before.credits + before.dailyCredits));

    await fillSong(page);
    await page.getByTestId('studio-generate').click();

    const error = page.getByTestId('studio-error-state');
    await expect(error).toBeVisible();
    await expect(error).toContainText(NO_CREDITS_USED);
    await expect(page.getByTestId('result-card')).toHaveCount(0);
    await expect(chipTotal(page)).toContainText(String(before.credits + before.dailyCredits));
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
    await page.screenshot({ path: shotPath('failure-no-charge') });
  });

  test('@high result appears in History and plays', async ({ page, mediaGenerationStub }) => {
    mediaGenerationStub.setVariant('success', { credits: SONG_COST });
    await fillSong(page);
    await page.getByTestId('studio-generate').click();
    await expect(page.getByTestId('result-card')).toBeVisible();

    // The History fetch is answered with the saved asset the stubbed job produced, so the list is stable.
    await stubSavedAsset(page);
    await page.getByTestId('nav-tab-assets').click();
    await expect(page).toHaveURL(/\/assets$/);
    const play = page.getByRole('button', { name: `Play ${STUB_ASSET_TITLE}`, exact: true });
    await expect(play).toBeVisible();

    await play.click();
    const miniPlayer = page.getByTestId('mini-player');
    await expect(miniPlayer).toBeVisible();
    await expect(page.getByTestId('mini-player-title')).toHaveText(STUB_ASSET_TITLE);
    await expect(miniPlayer.getByTestId('play-button')).toHaveAttribute('aria-pressed', 'true');
    await page.screenshot({ path: shotPath('history-plays') });
  });

  test('@high empty state example fills the form', async ({ page }) => {
    await expect(page.getByTestId('studio-empty-state')).toContainText(
      'Describe a style and paste or write lyrics to make your first song.',
    );
    await expect(page.getByTestId('song-example-idea')).toHaveCount(3);
    await expect(page.getByTestId('studio-generate')).toBeDisabled();
    await expect(page.getByTestId('studio-reason')).toContainText('Describe the style');

    await page.getByTestId('studio-empty-example').click();
    await expect(page.getByLabel('Style', { exact: true })).toHaveValue(EXAMPLE_ROAD_TRIP.style);
    await expect(page.getByLabel('Lyrics', { exact: true })).toHaveValue(
      new RegExp(`^${EXAMPLE_ROAD_TRIP.lyrics.replace(/[[\]]/g, '\\$&')}`),
    );
    await expect(page.getByTestId('studio-generate')).toBeEnabled();

    await page.getByTestId('song-example-idea').nth(1).click();
    await expect(page.getByLabel('Style', { exact: true })).toHaveValue(EXAMPLE_LULLABY.style);
    await expect(page.getByLabel('Lyrics', { exact: true })).toHaveValue(
      new RegExp(`^${EXAMPLE_LULLABY.lyrics.replace(/[[\]]/g, '\\$&')}`),
    );
    await page.screenshot({ path: shotPath('example-filled') });
  });

  test('@high keyboard-only compose and submit', async ({ page, mediaGenerationStub }) => {
    mediaGenerationStub.setVariant('success', { credits: SONG_COST });
    const draft = songDraft();
    const style = page.getByLabel('Style', { exact: true });
    const lyrics = page.getByLabel('Lyrics', { exact: true });

    await style.focus();
    await expect(style).toHaveCSS('outline-style', 'solid');
    await page.keyboard.type(draft.style);
    await tabUntilFocused(page, page.getByTestId('lyrics-input'));
    await page.keyboard.type(draft.lyrics);
    await expect(style).toHaveValue(draft.style);
    await expect(lyrics).toHaveValue(draft.lyrics);

    const generate = page.getByTestId('studio-generate');
    await tabUntilFocused(page, generate);
    await expect(generate).toBeEnabled();
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('result-card')).toBeVisible();
    await expect(
      page.getByTestId('result-card').getByRole('button', { name: `Play ${STUB_ASSET_TITLE}` }),
    ).toBeFocused();
    expect(mediaGenerationStub.acceptedRequestCount()).toBe(1);
  });

  test('@high 375px layout', async ({ page }) => {
    await page.setViewportSize({ width: WIDTH_PHONE, height: HEIGHT_PHONE });
    await openSongStudio(page);
    await fillSong(page);

    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);

    const targets = [
      page.getByTestId('studio-generate'),
      ...(await page.getByTestId('style-chip').all()),
      ...(await page.getByTestId('lyrics-tag').all()),
      ...(await page.getByTestId('song-example-idea').all()),
    ];
    expect(targets.length).toBeGreaterThan(10);
    for (const target of targets) {
      const box = await target.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(MIN_TAP_PX);
    }
    await page.screenshot({ path: shotPath('mobile-375') });
  });

  test('@medium draft survives reload', async ({ page }) => {
    const draft = songDraft();
    await fillSong(page, draft);
    await expect(page.getByTestId('style-counter')).toHaveText(`${draft.style.length}/300`);
    // The draft is written by a deep watcher; wait for it to reach storage before reloading.
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('visual-ai-media-draft')))
      .toContain(draft.style);

    await openSongStudio(page);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Song studio' })).toBeVisible();

    await expect(page.getByLabel('Style', { exact: true })).toHaveValue(draft.style);
    await expect(page.getByLabel('Lyrics', { exact: true })).toHaveValue(draft.lyrics);
    await expect(page.getByTestId('studio-generate')).toBeEnabled();
  });
});
