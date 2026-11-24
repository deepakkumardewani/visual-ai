import { randomUUID } from 'node:crypto';

import { mergeTests, type Page, type Route } from '@playwright/test';

import { test as mediaTest } from '../fixtures/media';
import { expect, test as qaTest } from '../fixtures/qa';
import { E2E_WEB_ORIGIN } from '../support/env';
import { gotoStudio } from '../support/studio';

const test = mergeTests(qaTest, mediaTest);

const RUN = randomUUID().slice(0, 8);
const HEIGHT = 900;
const WIDTH_PHONE = 375;
const MIN_TAP_PX = 44;
const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const MEDIA_ASSETS_ROUTE = '**/media/assets**';
// Served from e2e/fixtures/assets/sample.mp3 by the media stub; never Cloudinary or Replicate.
const SAMPLE_MP3_URL = `${E2E_WEB_ORIGIN}/e2e-media/sample.mp3`;
// Evidence PNGs land in the repo-level agent_docs/qa tree (playwright runs from apps/web).
const shotPath = (name: string) => `../../agent_docs/qa/media-nav-player/${name}.png`;

// Independent literals, not derived from the app's route table.
const MENU_ITEMS = [
  { menu: 'audio', routeName: 'audio-song', path: '/audio/song' },
  { menu: 'audio', routeName: 'audio-music', path: '/audio/music' },
  { menu: 'audio', routeName: 'audio-speech', path: '/audio/speech' },
  {
    menu: 'tools',
    routeName: 'tools-image-watermark',
    path: '/tools/image-watermark',
  },
  {
    menu: 'tools',
    routeName: 'tools-video-watermark',
    path: '/tools/video-watermark',
  },
  { menu: 'tools', routeName: 'tools-autocaption', path: '/tools/autocaption' },
  { menu: 'tools', routeName: 'tools-sketch', path: '/tools/sketch' },
] as const;

interface FakeAsset {
  id: string;
  title: string;
  feature: 'song' | 'music';
}

function fakeAsset(feature: FakeAsset['feature'], index: number): FakeAsset {
  return {
    id: `e2e-nav-${RUN}-${feature}-${index}`,
    title: `e2e ${feature} ${RUN} ${index}`,
    feature,
  };
}

function corsHeaders(route: Route) {
  const request = route.request();
  return {
    'Access-Control-Allow-Origin': E2E_WEB_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    // Authorization must be listed by name: a wildcard is ignored for credentialed requests.
    'Access-Control-Allow-Headers':
      request.headers()['access-control-request-headers'] ?? 'authorization, content-type',
  };
}

/** Answers GET /media/assets with the given fake audio assets; nothing reaches the real API. */
async function stubMediaAssets(page: Page, assets: FakeAsset[]) {
  await page.route(MEDIA_ASSETS_ROUTE, async (route) => {
    const method = route.request().method();
    if (method === 'OPTIONS') {
      return route.fulfill({
        status: HTTP_NO_CONTENT,
        headers: corsHeaders(route),
      });
    }
    if (method !== 'GET') return route.fallback();
    const items = assets.map((asset) => ({
      id: asset.id,
      type: 'audio',
      feature: asset.feature,
      modelKey: 'E2E_STUB',
      title: asset.title,
      url: SAMPLE_MP3_URL,
      durationSec: 1,
      prompt: asset.title,
      creditsCharged: 0,
      saved: true,
      createdAt: new Date().toISOString(),
    }));
    return route.fulfill({
      status: HTTP_OK,
      headers: corsHeaders(route),
      json: { items, nextCursor: null },
    });
  });
}

/**
 * Records every audio element the app plays. The store keeps its Audio detached from the DOM, so
 * this is the only way to assert on real playback (paused state, how many elements exist).
 */
async function trackAudioElements(page: Page) {
  await page.addInitScript(() => {
    const seen = new Set<HTMLMediaElement>();
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function play(this: HTMLMediaElement) {
      seen.add(this);
      return originalPlay.call(this);
    };
    (window as unknown as { __e2eAudio: Set<HTMLMediaElement> }).__e2eAudio = seen;
  });
}

async function audioState(page: Page) {
  return page.evaluate(() => {
    const seen = (window as unknown as { __e2eAudio?: Set<HTMLMediaElement> }).__e2eAudio;
    const elements = [...(seen ?? [])];
    return {
      count: elements.length,
      playing: elements.filter((el) => !el.paused).length,
    };
  });
}

async function openAssets(page: Page) {
  await page.getByTestId('nav-tab-assets').click();
  await expect(page).toHaveURL(/\/assets$/);
}

function playCard(page: Page, asset: FakeAsset) {
  return page.getByRole('button', { name: `Play ${asset.title}`, exact: true });
}

/** Single audio element, so loop keeps the 1 s sample playing for the whole assertion window. */
async function enableLoop(page: Page) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('l');
}

async function openMenuAndGo(page: Page, item: (typeof MENU_ITEMS)[number]) {
  await page.getByTestId(`nav-menu-${item.menu}`).click();
  await page.getByTestId(`nav-menu-item-${item.routeName}`).click();
  await expect(page).toHaveURL(new RegExp(`${item.path}$`));
}

// Audio studios are real pages; Tools routes stay placeholders until phase 5 builds them.
function studioMarker(item: { menu: string }) {
  return item.menu === 'audio' ? 'studio-shell' : 'studio-placeholder';
}

test.describe('header menus and studio routes', () => {
  test(
    'Each Audio and Tools menu item navigates to its route',
    { tag: ['@critical'] },
    async ({ page }) => {
      await gotoStudio(page);
      expect(MENU_ITEMS).toHaveLength(7);

      for (const item of MENU_ITEMS) {
        await openMenuAndGo(page, item);
        await expect(page.getByTestId(studioMarker(item))).toBeVisible();
        await expect(page.getByTestId(`nav-menu-${item.menu}`)).toBeVisible();
      }
      await page.screenshot({ path: shotPath('tools-route') });
    },
  );

  test(
    'Keyboard-only run opens Audio, moves, activates and Escape returns focus',
    { tag: ['@critical'] },
    async ({ page }) => {
      await gotoStudio(page);
      const trigger = page.getByTestId('nav-menu-audio');
      // Late page-load focus (composer autofocus) can steal focus once, so retry until it sticks.
      await expect(async () => {
        await trigger.focus();
        await expect(trigger).toBeFocused({ timeout: 1000 });
      }).toPass();

      await page.keyboard.press('Enter');
      await expect(page.getByTestId('nav-menu-panel-audio')).toBeVisible();
      await expect(page.getByTestId('nav-menu-item-audio-song')).toBeFocused();
      await page.screenshot({ path: shotPath('audio-menu-open') });

      await page.keyboard.press('ArrowDown');
      await expect(page.getByTestId('nav-menu-item-audio-music')).toBeFocused();

      await page.keyboard.press('Escape');
      await expect(page.getByTestId('nav-menu-panel-audio')).toBeHidden();
      await expect(trigger).toBeFocused();
      await expect(page).toHaveURL(/\/create/);

      await page.keyboard.press('Enter');
      // Focus moves into the panel after it opens; arrowing before that lands on the trigger.
      await expect(page.getByTestId('nav-menu-item-audio-song')).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(page.getByTestId('nav-menu-item-audio-music')).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/audio\/music$/);
    },
  );

  test.describe('signed out', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test(
      'Signed-out visit to /audio/song redirects to sign-in',
      { tag: ['@critical'] },
      async ({ page }) => {
        await page.goto('/audio/song');

        await expect(page).toHaveURL(/\/signin/);
        const redirect = new URL(page.url()).searchParams.get('redirect');
        expect(redirect).toBe('/audio/song');
        await expect(page.getByTestId('studio-placeholder')).toHaveCount(0);
      },
    );
  });

  test('Image tab still opens create', { tag: ['@medium'] }, async ({ page }) => {
    await gotoStudio(page);
    await openMenuAndGo(page, MENU_ITEMS[0]);

    const imageTab = page.getByTestId('nav-tab-create');
    await imageTab.click();

    await expect(page).toHaveURL(/\/create(\/image)?$/);
    await expect(page.getByTestId('composer-textarea-input')).toBeVisible();
    await expect(imageTab).toHaveAttribute('aria-selected', 'true');
  });
});

test.describe('mini-player and History', () => {
  test(
    'A track started from a History card keeps playing across navigation and a second track pauses the first',
    { tag: ['@critical'] },
    async ({ page, mediaGenerationStub }) => {
      const first = fakeAsset('song', 1);
      const second = fakeAsset('song', 2);
      await trackAudioElements(page);
      await stubMediaAssets(page, [first, second]);
      await gotoStudio(page);
      await openAssets(page);

      await playCard(page, first).click();
      const miniPlayer = page.getByTestId('mini-player');
      await expect(miniPlayer).toBeVisible();
      await expect(page.getByTestId('mini-player-title')).toHaveText(first.title);
      await expect(miniPlayer.getByTestId('play-button')).toHaveAttribute('aria-pressed', 'true');
      await enableLoop(page);

      // Navigating away unmounts the History card; the global player must keep going.
      await openMenuAndGo(page, MENU_ITEMS[0]);
      await expect(page.getByTestId(studioMarker(MENU_ITEMS[0]))).toBeVisible();
      await expect(page.getByTestId('mini-player-title')).toHaveText(first.title);
      await expect(miniPlayer.getByTestId('play-button')).toHaveAttribute('aria-pressed', 'true');
      expect(await audioState(page)).toEqual({ count: 1, playing: 1 });
      await page.screenshot({ path: shotPath('player-persists-across-route') });

      await openAssets(page);
      await playCard(page, second).click();
      await expect(page.getByTestId('mini-player-title')).toHaveText(second.title);
      await expect(miniPlayer.getByTestId('play-button')).toHaveAttribute('aria-pressed', 'true');
      // The first card is no longer active; only one element exists and it is playing the second.
      await expect(playCard(page, first)).toHaveAttribute('aria-pressed', 'false');
      await expect(playCard(page, second)).toHaveAttribute('aria-pressed', 'true');
      expect(await audioState(page)).toEqual({ count: 1, playing: 1 });
      await page.screenshot({ path: shotPath('second-track-replaces-first') });

      expect(mediaGenerationStub.interceptedPosts()).toEqual([]);
    },
  );

  test(
    'Space toggles the active player and ? opens the shortcuts popover',
    { tag: ['@high'] },
    async ({ page, mediaGenerationStub }) => {
      const asset = fakeAsset('song', 3);
      await trackAudioElements(page);
      await stubMediaAssets(page, [asset]);
      await gotoStudio(page);
      await openAssets(page);

      await playCard(page, asset).click();
      const miniPlay = page.getByTestId('mini-player').getByTestId('play-button');
      await expect(miniPlay).toHaveAttribute('aria-pressed', 'true');
      await enableLoop(page);
      expect(await audioState(page)).toEqual({ count: 1, playing: 1 });

      // Focus is on the page body, so this is the global shortcut and not a button activation.
      await page.keyboard.press('Space');
      await expect(miniPlay).toHaveAttribute('aria-pressed', 'false');
      expect(await audioState(page)).toEqual({ count: 1, playing: 0 });

      await page.keyboard.press('Space');
      await expect(miniPlay).toHaveAttribute('aria-pressed', 'true');
      expect(await audioState(page)).toEqual({ count: 1, playing: 1 });

      await expect(page.getByTestId('shortcuts-popover')).toHaveCount(0);
      await page.keyboard.press('?');
      const popover = page.getByTestId('shortcuts-popover');
      await expect(popover).toBeVisible();
      await expect(popover.getByRole('heading', { name: 'Keyboard shortcuts' })).toBeVisible();
      await expect(popover.getByText('Play or pause')).toBeVisible();
      await page.screenshot({ path: shotPath('shortcuts-popover') });

      expect(mediaGenerationStub.interceptedPosts()).toEqual([]);
    },
  );

  test(
    'History shows a stubbed fake asset with the Song filter',
    { tag: ['@high'] },
    async ({ page, mediaGenerationStub }) => {
      const song = fakeAsset('song', 4);
      const music = fakeAsset('music', 5);
      await stubMediaAssets(page, [song, music]);
      await gotoStudio(page);
      await openAssets(page);

      await expect(page.getByTestId('history-audio-item')).toHaveCount(2);
      await expect(playCard(page, song)).toBeVisible();
      await expect(playCard(page, music)).toBeVisible();

      await page.getByTestId('history-chip-song').click();

      await expect(page.getByTestId('history-chip-song')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByTestId('history-audio-item')).toHaveCount(1);
      await expect(playCard(page, song)).toBeVisible();
      await expect(playCard(page, music)).toHaveCount(0);
      await page.screenshot({ path: shotPath('history-song-filter') });

      expect(mediaGenerationStub.interceptedPosts()).toEqual([]);
    },
  );
});

test.describe('mobile accordion', () => {
  test(
    '375px accordion items are at least 44px and there is no horizontal scroll',
    { tag: ['@high'] },
    async ({ page }) => {
      await page.setViewportSize({ width: WIDTH_PHONE, height: HEIGHT });
      await gotoStudio(page);
      await expect(page.getByTestId('nav-mobile-accordion')).toBeVisible();

      const groups = [
        {
          id: 'audio',
          items: MENU_ITEMS.filter((item) => item.menu === 'audio'),
        },
        {
          id: 'tools',
          items: MENU_ITEMS.filter((item) => item.menu === 'tools'),
        },
      ];
      expect(groups.map((group) => group.items.length)).toEqual([3, 4]);

      for (const group of groups) {
        const trigger = page.getByTestId(`nav-accordion-${group.id}`);
        await trigger.click();
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        await expect(page.getByTestId(`nav-accordion-panel-${group.id}`)).toBeVisible();

        const triggerBox = await trigger.boundingBox();
        expect(triggerBox?.height).toBeGreaterThanOrEqual(MIN_TAP_PX);
        for (const item of group.items) {
          const box = await page.getByTestId(`nav-accordion-item-${item.routeName}`).boundingBox();
          expect(box, `${item.routeName} is rendered`).not.toBeNull();
          expect(box!.height, `${item.routeName} height`).toBeGreaterThanOrEqual(MIN_TAP_PX);
        }

        const overflow = await page.evaluate(() => ({
          page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          body: document.body.scrollWidth - document.documentElement.clientWidth,
        }));
        expect(overflow).toEqual({ page: 0, body: 0 });
        await page.screenshot({ path: shotPath(`accordion-${group.id}-375`) });
      }
    },
  );
});
