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
const LYRICS_URL = '**/prompt/lyrics**';
const WIDTH_PHONE = 375;
const HEIGHT_PHONE = 812;
const MIN_TAP_PX = 44;
const LYRICS_MAX = 3000;
const DAILY_LIMIT_COPY = 'Daily lyrics limit reached. Try again tomorrow.';
const shotPath = (name: string) => `../../agent_docs/qa/lyrics-help/${name}.png`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': E2E_WEB_ORIGIN,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': '*',
};

const ORIGINAL = `[Verse]\nOriginal line ${RUN}`;
const SUGGESTED = `[Verse]\nSuggested line ${RUN}\n[Chorus]\nSuggested chorus ${RUN}`;
const CONDENSED = `[Verse]\nShort ${RUN}`;

interface LyricsStub {
  bodies: () => Array<Record<string, unknown>>;
}

/**
 * Answers POST /prompt/lyrics (the paid, outbound-LLM route) with the real `{ lyrics }` shape.
 * Registered after the mediaGenerationStub so it takes precedence; nothing reaches the network.
 */
async function stubLyrics(
  page: Page,
  reply: { status: number; json: unknown },
): Promise<LyricsStub> {
  const bodies: Array<Record<string, unknown>> = [];
  await page.route(LYRICS_URL, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS')
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    bodies.push(request.postDataJSON() as Record<string, unknown>);
    return route.fulfill({ status: reply.status, headers: CORS_HEADERS, json: reply.json });
  });
  return { bodies: () => bodies };
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

const lyricsField = (page: Page) => page.getByLabel('Lyrics', { exact: true });
const trigger = (page: Page) => page.getByTestId('lyrics-ai-trigger');

async function writeFromTheme(page: Page, theme: string) {
  await trigger(page).click();
  await page.getByTestId('lyrics-ai-write').click();
  await page.getByTestId('lyrics-ai-theme').fill(theme);
  await page.getByRole('button', { name: 'Write', exact: true }).click();
}

/** Sets lyrics past the song limit (as a paste would) and syncs v-model. */
async function setOverLimitLyrics(page: Page) {
  const text = `[Verse]\n${'la '.repeat(LYRICS_MAX)}`;
  await page.getByTestId('lyrics-input').evaluate((el, value) => {
    const area = el as HTMLTextAreaElement;
    area.value = value;
    area.dispatchEvent(new Event('input', { bubbles: true }));
  }, text);
  await expect(page.getByTestId('lyrics-counter')).toContainText(`${text.length}/${LYRICS_MAX}`);
}

test.describe('lyrics help', () => {
  test.beforeEach(async ({ page }) => {
    await openSongStudio(page);
  });

  test('@critical Write from a theme fills a suggestion that Accept applies with no credit change', async ({
    page,
    snap,
  }) => {
    const stub = await stubLyrics(page, { status: 200, json: { lyrics: SUGGESTED } });
    const before = await readCredits(E2E_USER_ID);
    await lyricsField(page).fill(ORIGINAL);

    await writeFromTheme(page, `road trip ${RUN}`);

    const suggestion = page.getByTestId('lyrics-ai-suggestion');
    await expect(suggestion).toContainText(`Suggested line ${RUN}`);
    await expect(lyricsField(page)).toHaveValue(ORIGINAL);
    expect(stub.bodies()).toEqual([{ mode: 'full', theme: `road trip ${RUN}` }]);

    await snap('lyrics-suggestion');
    await page.screenshot({ path: shotPath('suggestion') });
    await page.getByTestId('lyrics-ai-accept').click();

    await expect(lyricsField(page)).toHaveValue(SUGGESTED);
    await expect(suggestion).toHaveCount(0);
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
    await page.screenshot({ path: shotPath('accepted') });
  });

  test('@high Fit to limit appears only over the limit', async ({ page }) => {
    const stub = await stubLyrics(page, { status: 200, json: { lyrics: CONDENSED } });
    const before = await readCredits(E2E_USER_ID);
    await lyricsField(page).fill(ORIGINAL);

    await trigger(page).click();
    await expect(page.getByTestId('lyrics-ai-rewrite')).toBeVisible();
    await expect(page.getByTestId('lyrics-ai-fit')).toHaveCount(0);
    await page.keyboard.press('Escape');

    await setOverLimitLyrics(page);
    await trigger(page).click();
    const fit = page.getByTestId('lyrics-ai-fit');
    await expect(fit).toBeVisible();
    await page.screenshot({ path: shotPath('fit-visible') });
    await fit.click();

    await expect(page.getByTestId('lyrics-ai-suggestion')).toContainText(CONDENSED);
    expect(stub.bodies()).toHaveLength(1);
    expect(stub.bodies()[0].mode).toBe('condense');
    expect(await readCredits(E2E_USER_ID)).toEqual(before);
  });

  test('@high Undo restores text', async ({ page }) => {
    await stubLyrics(page, { status: 200, json: { lyrics: SUGGESTED } });
    await lyricsField(page).fill(ORIGINAL);

    await writeFromTheme(page, `undo ${RUN}`);
    await page.getByTestId('lyrics-ai-accept').click();
    await expect(lyricsField(page)).toHaveValue(SUGGESTED);

    await page.getByTestId('lyrics-ai-undo').click();
    await expect(lyricsField(page)).toHaveValue(ORIGINAL);
    await expect(page.getByTestId('lyrics-ai-undo')).toHaveCount(0);
  });

  test.describe('rate limited', () => {
    // The browser logs the deliberate 429 as a failed resource load.
    test.use({ expectedConsoleErrors: [/status of 429|→ 429/] });

    test('@high 429 shows the daily-limit copy', async ({ page }) => {
      await stubLyrics(page, { status: 429, json: { message: 'rate limited' } });
      const before = await readCredits(E2E_USER_ID);
      await lyricsField(page).fill(ORIGINAL);

      await writeFromTheme(page, `limit ${RUN}`);

      await expect(page.getByText(DAILY_LIMIT_COPY)).toBeVisible();
      await expect(lyricsField(page)).toHaveValue(ORIGINAL);
      await expect(page.getByTestId('lyrics-ai-suggestion')).toHaveCount(0);
      expect(await readCredits(E2E_USER_ID)).toEqual(before);
      await page.screenshot({ path: shotPath('daily-limit') });
    });
  });

  test('@medium keyboard-only use of the menu', async ({ page }) => {
    await stubLyrics(page, { status: 200, json: { lyrics: SUGGESTED } });
    await lyricsField(page).fill(ORIGINAL);

    await trigger(page).focus();
    await expect(trigger(page)).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Enter');
    const write = page.getByTestId('lyrics-ai-write');
    await expect(write).toBeVisible();
    await expect(write).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(write).toHaveCount(0);
    await expect(trigger(page)).toBeFocused();

    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    const theme = page.getByTestId('lyrics-ai-theme');
    await expect(theme).toBeVisible();
    await theme.focus();
    await page.keyboard.type(`keys ${RUN}`);
    await page.keyboard.press('Enter');

    const accept = page.getByTestId('lyrics-ai-accept');
    await expect(accept).toBeVisible();
    await accept.focus();
    await page.keyboard.press('Enter');
    await expect(lyricsField(page)).toHaveValue(SUGGESTED);
  });

  test('@medium 375px layout', async ({ page }) => {
    await stubLyrics(page, { status: 200, json: { lyrics: SUGGESTED } });
    await page.setViewportSize({ width: WIDTH_PHONE, height: HEIGHT_PHONE });
    await openSongStudio(page);
    await lyricsField(page).fill(ORIGINAL);
    await writeFromTheme(page, `phone ${RUN}`);
    await expect(page.getByTestId('lyrics-ai-suggestion')).toBeVisible();

    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);

    const targets = [
      trigger(page),
      page.getByTestId('lyrics-ai-accept'),
      page.getByTestId('lyrics-ai-discard'),
    ];
    for (const target of targets) {
      const box = await target.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(MIN_TAP_PX);
    }
    await page.screenshot({ path: shotPath('mobile-375') });
  });
});
