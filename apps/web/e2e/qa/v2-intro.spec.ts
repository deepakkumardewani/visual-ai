import type { Page, Route } from '@playwright/test';

import { expect, test } from '../fixtures/qa';
import { E2E_WEB_ORIGIN } from '../support/env';
import { gotoStudio } from '../support/studio';
import { INTRO_SLIDES, INTRO_SLIDE_COUNT } from '../../src/components/Intro/slides';

const PROFILE_URL = /\/users\/user_[^/?]+$/;
const INTRO_SEEN_URL = /\/users\/intro-seen$/;
const INTRO_VERSION = 'v2';
const SIZE_TOLERANCE_PX = 3;
const STAGE_RATIO = 0.62;
const STAGE_RATIO_TOLERANCE = 0.02;
const MOBILE_VIEWPORT = { width: 375, height: 812 };
const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

const CORS = {
  'Access-Control-Allow-Origin': E2E_WEB_ORIGIN,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
};

/** Seeded profile: `route.fetch()` is Node-side and rejects the portless self-signed cert in prod. */
function seededProfile(userId: string, seenIntroVersion: string | null) {
  return {
    userId,
    userName: 'qa-intro',
    firstName: 'QA',
    lastName: 'Intro',
    fullName: 'QA Intro',
    email: 'qa-intro@example.com',
    credits: 100,
    dailyCredits: 10,
    referralCode: 'QAINTRO',
    seenIntroVersion,
    referrals: [],
    payments: [],
    history: [],
    favorites: [],
    activities: [],
  };
}

interface IntroApi {
  /** Bodies of every PUT /users/intro-seen the app sent. */
  puts: unknown[];
}

/**
 * Serves a seeded profile with `seenIntroVersion` set (null = new account) and stubs the
 * intro-seen PUT so the shared QA user's DB row is never mutated. `putFails` answers 200 with a non-JSON body: the app treats it as a failed save, and unlike a 5xx it does not trip the console-error guard.
 */
async function mockIntroState(
  page: Page,
  { seenIntroVersion, putFails = false }: { seenIntroVersion: string | null; putFails?: boolean },
): Promise<IntroApi> {
  const api: IntroApi = { puts: [] };
  let seen = seenIntroVersion;

  await page.route(PROFILE_URL, async (route: Route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    const userId = new URL(route.request().url()).pathname.split('/').pop() ?? '';
    await route.fulfill({
      status: 200,
      headers: CORS,
      json: seededProfile(userId, seen),
    });
  });

  await page.route(INTRO_SEEN_URL, async (route: Route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    api.puts.push(request.postDataJSON());
    if (putFails) {
      return route.fulfill({
        status: 200,
        headers: CORS,
        contentType: 'text/plain',
        body: 'nope',
      });
    }
    seen = INTRO_VERSION;
    await route.fulfill({
      status: 200,
      headers: CORS,
      json: { seenIntroVersion: INTRO_VERSION },
    });
  });

  return api;
}

const modal = (page: Page) => page.getByTestId('whats-new-modal');

async function openNewAccountIntro(page: Page, options?: Parameters<typeof mockIntroState>[1]) {
  const api = await mockIntroState(page, options ?? { seenIntroVersion: null });
  await gotoStudio(page);
  await expect(modal(page)).toBeVisible();
  return api;
}

async function goToLastSlide(page: Page) {
  await page.getByTestId(`intro-feature-${INTRO_SLIDE_COUNT}`).click();
  await expect(page.getByTestId('whats-new-counter')).toHaveText(
    `${INTRO_SLIDE_COUNT} / ${INTRO_SLIDE_COUNT}`,
  );
}

test.describe('v2 intro', () => {
  test('@critical New account sees the modal once; after dismiss and reload it does not show', async ({
    page,
    snap,
  }) => {
    const api = await openNewAccountIntro(page);
    await snap('intro-modal-desktop');

    await page.getByTestId('whats-new-skip').click();
    await expect(modal(page)).toBeHidden();
    await expect.poll(() => api.puts).toEqual([{ version: INTRO_VERSION }]);

    await gotoStudio(page);
    await expect(page.getByTestId('user-menu-trigger')).toBeVisible();
    await expect(modal(page)).toBeHidden();
    expect(api.puts).toHaveLength(1);
  });

  test('@critical Account with seenIntroVersion v2 never sees it', async ({ page }) => {
    const api = await mockIntroState(page, { seenIntroVersion: INTRO_VERSION });
    const profile = page.waitForResponse((res) => PROFILE_URL.test(res.url()) && res.ok());
    await gotoStudio(page);
    const body = (await (await profile).json()) as {
      seenIntroVersion?: string | null;
    };
    expect(body.seenIntroVersion).toBe(INTRO_VERSION);

    await expect(page.getByTestId('user-menu-trigger')).toBeVisible();
    await expect(modal(page)).toBeHidden();
    expect(api.puts).toHaveLength(0);
  });

  test('@critical The feature list shows exactly 10 items; clicking an item jumps to that slide and updates the title and counter', async ({
    page,
  }) => {
    await openNewAccountIntro(page);

    await expect(page.getByTestId('intro-feature-list').getByRole('button')).toHaveCount(10);
    await expect(page.getByTestId('whats-new-counter')).toHaveText('1 / 10');

    const target = 7;
    await page.getByTestId(`intro-feature-${target}`).click();

    await expect(page.getByTestId('whats-new-slide-title')).toHaveText(
      INTRO_SLIDES[target - 1].title,
    );
    await expect(page.getByTestId('whats-new-counter')).toHaveText('7 / 10');
    await expect(page.getByTestId(`intro-feature-${target}`)).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  test('@high Icon prev/next, arrow keys and Esc skip work with no neighbouring slide visible', async ({
    page,
  }) => {
    await openNewAccountIntro(page);
    const title = page.getByTestId('whats-new-slide-title');
    const counter = page.getByTestId('whats-new-counter');
    const visibleSlides = page.getByTestId('intro-slide').locator('visible=true');

    await expect(page.getByRole('button', { name: 'Previous feature' })).toBeDisabled();
    await expect(visibleSlides).toHaveCount(1);

    await page.getByRole('button', { name: 'Next feature' }).click();
    await expect(counter).toHaveText('2 / 10');
    await expect(title).toHaveText(INTRO_SLIDES[1].title);
    await expect(visibleSlides).toHaveCount(1);

    await page.getByRole('button', { name: 'Previous feature' }).click();
    await expect(counter).toHaveText('1 / 10');
    await expect(visibleSlides).toHaveCount(1);

    await modal(page).focus();
    await page.keyboard.press('ArrowRight');
    await expect(counter).toHaveText('2 / 10');
    await page.keyboard.press('ArrowLeft');
    await expect(counter).toHaveText('1 / 10');

    await page.keyboard.press('Escape');
    await expect(modal(page)).toBeHidden();
  });

  test('@high "What\'s new" in the user menu reopens it and does not call the intro-seen PUT', async ({
    page,
  }) => {
    const api = await mockIntroState(page, { seenIntroVersion: INTRO_VERSION });
    await gotoStudio(page);
    await expect(page.getByTestId('user-menu-trigger')).toBeVisible();
    await expect(modal(page)).toBeHidden();

    await page.getByTestId('user-menu-trigger').click();
    await page.getByTestId('user-menu-item-whats-new').click();
    await expect(modal(page)).toBeVisible();

    await page.getByTestId('whats-new-close').click();
    await expect(modal(page)).toBeHidden();
    // Give a stray PUT time to surface before asserting its absence.
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve(null))));
    expect(api.puts).toHaveLength(0);
  });

  test('@high "Show me around" starts the tour with the custom popover (x / y and progress) and marks seen', async ({
    page,
    snap,
  }) => {
    const api = await openNewAccountIntro(page);
    await goToLastSlide(page);

    await page.getByTestId('whats-new-tour').click();
    await expect(modal(page)).toBeHidden();
    await expect(page.getByTestId('tour-popover')).toBeVisible();
    await expect(page.getByTestId('tour-step-counter')).toHaveText(/^1 \/ \d+$/);
    await expect(page.getByTestId('tour-progress')).toBeVisible();
    await expect(page.getByTestId('tour-prev')).toBeDisabled();
    await snap('tour-step-1');
    await expect.poll(() => api.puts).toEqual([{ version: INTRO_VERSION }]);
  });
  test('@high The tour advances through steps keeping the custom popover (x / y, progress)', async ({
    page,
  }) => {
    await openNewAccountIntro(page);
    await goToLastSlide(page);
    await page.getByTestId('whats-new-tour').click();
    await expect(page.getByTestId('tour-popover')).toBeVisible();

    await page.getByTestId('tour-next').click();
    await expect(page.getByTestId('tour-step-counter')).toHaveText(/^2 \/ \d+$/);
    await expect(page.getByTestId('tour-progress')).toBeVisible();
  });

  test('@high "Done" marks seen', async ({ page }) => {
    const api = await openNewAccountIntro(page);
    await goToLastSlide(page);

    await page.getByTestId('whats-new-done').click();
    await expect(modal(page)).toBeHidden();
    await expect.poll(() => api.puts).toEqual([{ version: INTRO_VERSION }]);
  });

  test('@high PUT failure: localStorage still prevents a repeat on reload', async ({ page }) => {
    const api = await openNewAccountIntro(page, {
      seenIntroVersion: null,
      putFails: true,
    });

    await page.getByTestId('whats-new-skip').click();
    await expect(modal(page)).toBeHidden();
    await expect.poll(() => api.puts.length).toBeGreaterThanOrEqual(1);

    await gotoStudio(page);
    await expect(page.getByTestId('user-menu-trigger')).toBeVisible();
    await expect(modal(page)).toBeHidden();
  });

  test('@medium Layout at 1440x900: modal about 1040x620 and the video stage about 62% of its width', async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await openNewAccountIntro(page);

    const box = await modal(page).boundingBox();
    const stage = await page.getByTestId('whats-new-stage').boundingBox();
    expect(box).not.toBeNull();
    expect(stage).not.toBeNull();
    expect(Math.abs(box!.width - 1040)).toBeLessThanOrEqual(SIZE_TOLERANCE_PX);
    expect(Math.abs(box!.height - 620)).toBeLessThanOrEqual(SIZE_TOLERANCE_PX);
    expect(Math.abs(stage!.width / box!.width - STAGE_RATIO)).toBeLessThanOrEqual(
      STAGE_RATIO_TOLERANCE,
    );
  });

  test('@medium Reduced motion: slides show the poster and no video autoplays', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openNewAccountIntro(page);

    await expect(modal(page).locator('video')).toHaveCount(0);
    const poster = page.getByTestId('whats-new-stage').getByRole('img', {
      name: INTRO_SLIDES[0].alt,
    });
    await expect(poster).toBeVisible();
    await expect(poster).toHaveAttribute('src', INTRO_SLIDES[0].poster);
  });

  test('@medium 375px renders a full-screen sheet', async ({ page, snap }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await openNewAccountIntro(page);

    const box = await modal(page).boundingBox();
    expect(box).not.toBeNull();
    expect(Math.abs(box!.width - MOBILE_VIEWPORT.width)).toBeLessThanOrEqual(SIZE_TOLERANCE_PX);
    expect(Math.abs(box!.height - MOBILE_VIEWPORT.height)).toBeLessThanOrEqual(SIZE_TOLERANCE_PX);
    await expect(page.getByTestId('whats-new-progress')).toBeVisible();
    await expect(page.getByTestId('intro-feature-list')).toBeHidden();
    await snap('intro-sheet-375');
  });

  test.describe('logged out', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('@medium logged-out visitor sees nothing', async ({ page }) => {
      await page.goto('/create');
      await expect(page.getByTestId('composer-textarea-input')).toBeVisible();
      await expect(page.getByTestId('header-sign-in')).toBeVisible();
      await expect(modal(page)).toBeHidden();
    });
  });
});
