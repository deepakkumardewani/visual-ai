/**
 * Shared stubs for the README capture specs (e2e/readme/*): invented demo user and data, local
 * repo images, and API fixtures so nothing paid or real ever reaches the network.
 */
import fs from 'node:fs';
import path from 'node:path';

import type { Page, Route } from '@playwright/test';

import type { CollectionListItem, ExploreFeedItem } from '@visual-ai/shared';
import { CURRENT_INTRO_VERSION } from '@visual-ai/shared';

import { E2E_WEB_ORIGIN } from './env';

export const LANDING_DIR = path.join(__dirname, '..', '..', 'public', 'landing');
export const THEME_KEY = 'visual-ai-theme';
export const E2E_USER_ID = process.env.E2E_CLERK_USER_ID ?? 'user_e2e';
export const USER_PROFILE_URL = /\/users\/user_/;

export const DEMO_CREDITS = 420;
export const DEMO_DAILY_CREDITS = 10;

export const API_CORS = {
  'Access-Control-Allow-Origin': E2E_WEB_ORIGIN,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

// --- Local image pool (repo assets in apps/web/public/landing) ------------------------------

/** Landing assets carry a content hash (`name.<hash>.webp`); resolve by the stable prefix. */
export function landingUrl(prefix: string): string {
  const file = fs
    .readdirSync(LANDING_DIR)
    .find((name) => name.startsWith(`${prefix}.`) && name.endsWith('.webp'));
  if (!file) throw new Error(`No landing asset starting with "${prefix}."`);
  return `${E2E_WEB_ORIGIN}/landing/${file}`;
}

export interface Artwork {
  url: string;
  prompt: string;
  width: number;
  height: number;
}

export function artwork(prefix: string, prompt: string, width: number, height: number): Artwork {
  return { url: landingUrl(prefix), prompt, width, height };
}

export const HERO_ART = artwork(
  'gallery-fvclzne36p3dnbgfeyzm',
  'Enchanted mushroom forest at dusk, glowing fireflies, a hooded wanderer, cinematic light',
  1216,
  832,
);

export const HISTORY_ART: Artwork[] = [
  HERO_ART,
  artwork(
    'gallery-auy5gemiugqeziapttgk',
    'A tiger beside a jungle waterfall, parrots overhead',
    1024,
    1024,
  ),
  artwork(
    'gallery-ccscxseguy3lzzhx3mcg',
    'Paris street at golden hour, Eiffel Tower in the distance',
    832,
    1216,
  ),
  artwork('gallery-d8bgsvaothoiymhhyhts', 'Mossy waterfall in an ancient green valley', 896, 1088),
  artwork('gallery-dxbflm2qra0izhovlsnu', 'Steampunk dragon perched on a clock tower', 1024, 1024),
  artwork('gallery-fcbhir6r9pblzefex4bw', 'Sunken glass city glowing underwater', 1536, 640),
  artwork('gallery-fgmpzqm9lqypkjzqlc6c', 'Sunflowers with a bee, macro photography', 896, 1088),
  artwork('gallery-fwjzna0pyfebsn8xpyqi', 'Floating moss islands under a full moon', 1216, 832),
  artwork('gallery-fy1hn3ehfgbhiuz6c0ns', 'Overgrown jungle temple, soft morning mist', 800, 800),
  artwork(
    'gallery-g7xw0kdnuuiigo7vtx7m',
    'Golden eagle over a river valley, aerial view',
    1216,
    832,
  ),
  artwork('gallery-ildtvu0nidlzggkyuqn1', 'Alpine lake at sunrise, mirror reflection', 1344, 768),
  artwork('gallery-kjxxw77baeguw1k3arz2', 'Phoenix rising from embers, ink and fire', 768, 1344),
  artwork('gallery-lovxpemmg00ogtddfp8w', 'Neon mandala, intricate rainbow geometry', 1024, 1024),
  artwork(
    'gallery-m4szqcgxf3yon95g7mry',
    'Bamboo forest path leading to a red torii gate',
    768,
    1344,
  ),
  artwork('gallery-mafdtqfixrg5y3ji9zw0', 'Wild horses at sunset on the open plain', 1216, 832),
  artwork('gallery-m1p8bsc8tkdjzcvqrlpd', 'Autumn forest stream in golden light', 640, 777),
];

export function toHistoryItem(
  art: Artwork,
  index: number,
  overrides: Record<string, unknown> = {},
) {
  const ageHours = index * 7 + 2;
  return {
    _id: `readme-img-${index}`,
    userId: E2E_USER_ID,
    prompt: art.prompt,
    featureType: 'image',
    modelName: index % 3 === 0 ? 'FLUX 1.1 Pro' : index % 3 === 1 ? 'Imagen 4' : 'Seedream 4',
    imageType: art.width >= art.height ? 'horizontal' : 'vertical',
    isFavorite: index % 4 === 0,
    createdAt: new Date(Date.now() - ageHours * 3_600_000).toISOString(),
    images: [
      {
        name: `readme-${index}`,
        aiImageUrl: art.url,
        resolution: `${art.width}x${art.height}`,
        aspectRatio: art.width >= art.height ? '3:2' : '2:3',
        width: art.width,
        height: art.height,
        format: 'webp',
        bytes: 180_000,
      },
    ],
    ...overrides,
  };
}

/** Real profile response with display data and history swapped for invented demo values. */
export async function stubProfile(page: Page, history: unknown[] = []) {
  await page.route(USER_PROFILE_URL, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: API_CORS });
    }
    if (route.request().method() !== 'GET') return route.continue();
    const user = (await (await route.fetch()).json()) as Record<string, unknown>;
    return route.fulfill({
      status: 200,
      headers: { ...API_CORS, 'Content-Type': 'application/json' },
      json: {
        ...user,
        userName: 'mara_vale',
        firstName: 'Mara',
        lastName: 'Vale',
        fullName: 'Mara Vale',
        email: 'mara.vale@example.com',
        credits: DEMO_CREDITS,
        dailyCredits: DEMO_DAILY_CREDITS,
        seenIntroVersion: CURRENT_INTRO_VERSION,
        referrals: [],
        payments: [],
        favorites: [],
        activities: [],
        history,
      },
    });
  });
}

/** Feedback endpoints never reach the API: no real rows, no real email. */
export async function stubFeedbackApi(page: Page, options: { eligible: boolean }) {
  await page.route(/\/feedback\/eligibility$/, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: API_CORS });
    }
    return route.fulfill({ status: 200, headers: API_CORS, json: { eligible: options.eligible } });
  });
  await page.route(/^https:\/\/api\.[^/]+\/feedback$/, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: API_CORS });
    }
    return route.fulfill({ status: 201, headers: API_CORS, json: { id: 'readme-feedback' } });
  });
}

export async function useTheme(page: Page, theme: 'light' | 'dark') {
  const isDark = theme === 'dark';
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [THEME_KEY, String(isDark)] as const,
  );
}

export async function gotoSignedIn(page: Page, route: string) {
  await Promise.all([
    page.waitForResponse((res) => USER_PROFILE_URL.test(res.url()) && res.ok(), {
      timeout: 30_000,
    }),
    page.goto(route),
  ]);
}

export function jsonCors(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    headers: { ...API_CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function completedImage(art: Artwork) {
  return toHistoryItem(art, 0, { _id: 'readme-result', createdAt: new Date().toISOString() });
}

/** Overrides the generation fixture's SSE so the result is a real repo image, not a 1x1 stub. */
export async function stubProgress(
  page: Page,
  art: Artwork,
  options: { modelName?: string; delayMs?: number } = {},
) {
  const { modelName = 'Flux Lightning', delayMs = 0 } = options;
  await page.route(/\/progress\?/, async (route) => {
    if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
    const image = { ...completedImage(art), modelName };
    const body = `data: ${JSON.stringify({ status: 'completed', image, userCreditsRemaining: null })}\n\n`;
    return route.fulfill({
      status: 200,
      headers: { ...API_CORS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      body,
    });
  });
}

export const MODEL_NAMES = ['Flux Lightning', 'Imagen 4', 'Seedream 4'];

/** Collections strip for /assets; covers point at history ids. */
export function demoCollections(): CollectionListItem[] {
  const names: Array<[string, number[]]> = [
    ['Fantasy worlds', [1, 7, 4, 6]],
    ['Landscapes', [3, 9, 10, 13]],
    ['Wildlife', [2, 8, 12]],
    ['Moodboard', [5, 11, 14, 15]],
  ];
  return names.map(([name, ids], index) => ({
    id: `readme-col-${index}`,
    userId: E2E_USER_ID,
    name,
    imageIds: ids.map((id) => `readme-img-${id}`),
    coverImageIds: ids.slice(0, 4).map((id) => `readme-img-${id}`),
    count: ids.length * 3 + index,
  }));
}

export function demoExploreFeed(): ExploreFeedItem[] {
  const authors = [
    'Nova Lindqvist',
    'Kai Moreau',
    'Ines Okafor',
    'Theo Marlow',
    'Suri Anand',
    'Lena Voss',
  ];
  return HISTORY_ART.map((art, index) => ({
    id: `readme-exp-${index}`,
    imageUrl: art.url,
    aspectRatio: art.width >= art.height ? '3:2' : '2:3',
    prompt: art.prompt,
    modelName: MODEL_NAMES[index % MODEL_NAMES.length],
    author: authors[index % authors.length],
    authorUserId: `user_demo_${index % authors.length}`,
    createdAt: new Date(Date.now() - index * 5 * 3_600_000).toISOString(),
  }));
}

export async function stubCollections(page: Page) {
  await page.route('**/collections**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: API_CORS });
    }
    if (route.request().method() === 'GET' && route.request().url().includes('/collections?')) {
      return jsonCors(route, { success: true, collections: demoCollections() });
    }
    return route.continue();
  });
}

export function landingFile(prefix: string): string {
  const file = fs.readdirSync(LANDING_DIR).find((name) => name.startsWith(`${prefix}.`));
  if (!file) throw new Error(`No landing asset starting with "${prefix}."`);
  return path.join(LANDING_DIR, file);
}

export const TRANSFORM_ENDPOINTS = [
  /\/generate\/upscale\/image$/,
  /\/generate\/colorize\/image$/,
  /\/generate\/revive\/image$/,
  /\/generate\/remove-bg\/image$/,
];

/** Photo tools return a job id, then the SSE stream completes with a repo image as the result. */
export async function stubTransform(page: Page, resultUrl: string) {
  for (const pattern of TRANSFORM_ENDPOINTS) {
    await page.route(pattern, async (route) => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: API_CORS });
      }
      return jsonCors(route, { jobId: 'readme-transform-job' });
    });
  }
  await stubProgress(page, { url: resultUrl, prompt: 'Colorized photo', width: 1280, height: 853 });
}
