import type { Page, Route } from '@playwright/test';

import { expect, test } from './fixtures/generation';
import { WEB_URL } from './support/env';

const USER_PROFILE_URL = /\/users\/user_/;
const UPSCALE_PATH = '/create/upscale';
const COLORIZE_PATH = '/create/colorize';
const REVIVE_PATH = '/create/revive';
const REMOVE_BG_PATH = '/create/remove_bg';
const RESULT_PROMPT = 'e2e transform result';
const FIXTURE_IMAGE_URL = `${WEB_URL}/e2e-fixture.png`;

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

const API_CORS = {
  'Access-Control-Allow-Origin': WEB_URL,
  'Access-Control-Allow-Credentials': 'true',
};

const TRANSFORM_ENDPOINTS = [
  /\/generate\/upscale\/image$/,
  /\/generate\/colorize\/image$/,
  /\/generate\/revive\/image$/,
  /\/generate\/remove-bg\/image$/,
];

async function gotoSignedIn(page: Page, path: string) {
  await Promise.all([page.waitForResponse(USER_PROFILE_URL), page.goto(path)]);
}

async function stubUserProfile(
  page: Page,
  options: { credits: number; dailyCredits?: number; history?: unknown[] },
) {
  await page.route(USER_PROFILE_URL, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    const user = (await response.json()) as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      headers: { ...API_CORS, 'Content-Type': 'application/json' },
      json: {
        ...user,
        credits: options.credits,
        dailyCredits: options.dailyCredits ?? 0,
        ...(options.history !== undefined ? { history: options.history } : {}),
      },
    });
  });
}

function progressBody(prompt: string, userCreditsRemaining: number | null) {
  const image = {
    _id: 'e2e-transform-job',
    userId: process.env.E2E_CLERK_USER_ID ?? '',
    prompt,
    featureType: 'image',
    createdAt: new Date().toISOString(),
    modelName: 'E2E Stub',
    imageType: 'horizontal',
    images: [
      {
        name: 'e2e-fixture',
        aiImageUrl: FIXTURE_IMAGE_URL,
        resolution: '1x1',
        aspectRatio: '1:1',
        width: 1,
        height: 1,
        format: 'png',
        bytes: 70,
      },
    ],
  };
  const processing = {
    status: 'processing',
    image,
    ...(userCreditsRemaining !== null ? { userCreditsRemaining } : {}),
  };
  const completed = { status: 'completed', image };
  return `data: ${JSON.stringify(processing)}\n\ndata: ${JSON.stringify(completed)}\n\n`;
}

async function stubTransforms(page: Page, prompt: string, creditsAfter: number | null) {
  let requestCount = 0;
  const fulfillSse = (route: Route) =>
    route.fulfill({
      status: 200,
      headers: {
        ...API_CORS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      body: progressBody(prompt, creditsAfter),
    });

  for (const pattern of TRANSFORM_ENDPOINTS) {
    await page.route(pattern, async (route) => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: API_CORS });
      }
      requestCount += 1;
      return route.fulfill({
        status: 200,
        headers: { ...API_CORS, 'Content-Type': 'application/json' },
        json: { jobId: 'e2e-transform-job' },
      });
    });
  }

  await page.route(/\/progress\?/, (route) => fulfillSse(route));
  await page.route('**/e2e-fixture.png**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: TINY_PNG }),
  );

  return { requestCount: () => requestCount };
}

async function uploadImage(page: Page, file: { name: string; mimeType: string; buffer: Buffer }) {
  await page.getByTestId('image-upload-input').setInputFiles(file);
}

async function uploadTinyPng(page: Page) {
  await uploadImage(page, { name: 'photo.png', mimeType: 'image/png', buffer: TINY_PNG });
  await expect(page.getByAltText('Upload preview')).toBeVisible();
}

async function readCreditTotal(page: Page) {
  const title = (await page.getByTestId('credits-chip').getAttribute('title')) ?? '';
  const daily = Number.parseInt(title.match(/^(\d+)\s+daily/m)?.[1] ?? '0', 10);
  const paid = Number.parseInt(title.match(/(\d+)\s+credits\s*$/m)?.[1] ?? '0', 10);
  return daily + paid;
}

async function readCtaCost(page: Page, testId: string) {
  const label = await page.getByTestId(testId).getByLabel(/credits/).getAttribute('aria-label');
  const match = label?.match(/\d+/);
  if (!match) throw new Error(`Could not parse cost from ${testId}`);
  return Number.parseInt(match[0], 10);
}

test.describe('image transforms', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await stubUserProfile(page, { credits: 500, dailyCredits: 0, history: [] });
  });

  test('upscale an uploaded image shows the result and decreases credits', async ({ page }) => {
    const transforms = await stubTransforms(page, RESULT_PROMPT, null);
    await gotoSignedIn(page, UPSCALE_PATH);
    const before = await readCreditTotal(page);
    const cost = await readCtaCost(page, 'upscale-cta');
    await page.unroute(/\/progress\?/);
    await page.route(/\/progress\?/, (route) =>
      route.fulfill({
        status: 200,
        headers: {
          ...API_CORS,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: progressBody(RESULT_PROMPT, before - cost),
      }),
    );

    await uploadTinyPng(page);
    await page.getByTestId('upscale-cta').dispatchEvent('click');

    await expect(page.getByAltText(RESULT_PROMPT).first()).toBeVisible();
    expect(transforms.requestCount()).toBe(1);
    await expect(page.getByTestId('credits-chip')).toContainText(String(before - cost));
  });

  test('upscale model from the address is selected', async ({ page }) => {
    await gotoSignedIn(page, `${UPSCALE_PATH}?model=UPSCALE_PRUNA`);
    await expect(page.getByTestId('model-picker-trigger')).toContainText('Pruna');
  });

  test('colorize an uploaded image shows a result', async ({ page }) => {
    const transforms = await stubTransforms(page, RESULT_PROMPT, null);
    await gotoSignedIn(page, COLORIZE_PATH);
    await uploadTinyPng(page);
    await page.getByTestId('colorize-cta').dispatchEvent('click');
    await expect(page.getByAltText(RESULT_PROMPT).first()).toBeVisible();
    expect(transforms.requestCount()).toBe(1);
  });

  test('revive an uploaded image shows a restored result', async ({ page }) => {
    const transforms = await stubTransforms(page, RESULT_PROMPT, null);
    await gotoSignedIn(page, REVIVE_PATH);
    await uploadTinyPng(page);
    await page.getByTestId('revive-cta').dispatchEvent('click');
    await expect(page.getByAltText(RESULT_PROMPT).first()).toBeVisible();
    expect(transforms.requestCount()).toBe(1);
  });

  test('remove background shows a result', async ({ page }) => {
    const transforms = await stubTransforms(page, RESULT_PROMPT, null);
    await gotoSignedIn(page, REMOVE_BG_PATH);
    await uploadTinyPng(page);
    await page.getByTestId('remove-bg-cta').dispatchEvent('click');
    await expect(page.getByAltText(RESULT_PROMPT).first()).toBeVisible();
    expect(transforms.requestCount()).toBe(1);
  });

  test('upscale without an image does not run', async ({ page }) => {
    const transforms = await stubTransforms(page, RESULT_PROMPT, null);
    await gotoSignedIn(page, UPSCALE_PATH);
    await expect(page.getByTestId('upscale-cta')).toBeDisabled();
    await page.getByTestId('upscale-cta').dispatchEvent('click');
    expect(transforms.requestCount()).toBe(0);
  });

  test('a file that is not an image is rejected', async ({ page }) => {
    const transforms = await stubTransforms(page, RESULT_PROMPT, null);
    await gotoSignedIn(page, UPSCALE_PATH);
    await uploadImage(page, {
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not an image'),
    });
    await expect(page.getByRole('alert')).toContainText('JPG, PNG, or WEBP');
    await expect(page.getByAltText('Upload preview')).toHaveCount(0);
    expect(transforms.requestCount()).toBe(0);
  });

  test('an image over 5MB is rejected', async ({ page }) => {
    const transforms = await stubTransforms(page, RESULT_PROMPT, null);
    await gotoSignedIn(page, UPSCALE_PATH);
    await uploadImage(page, {
      name: 'huge.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1, 1),
    });
    await expect(page.getByRole('alert')).toContainText('5MB');
    expect(transforms.requestCount()).toBe(0);
  });

  test('an unreadable image file is rejected', async ({ page }) => {
    const transforms = await stubTransforms(page, RESULT_PROMPT, null);
    await gotoSignedIn(page, UPSCALE_PATH);
    await page.evaluate(() => {
      const original = FileReader.prototype.readAsDataURL;
      FileReader.prototype.readAsDataURL = function readAsDataURL(this: FileReader, blob: Blob) {
        const file = blob as File;
        if (file.name === 'unreadable.png') {
          queueMicrotask(() => this.dispatchEvent(new ProgressEvent('error')));
          return;
        }
        return original.call(this, blob);
      };
    });
    await uploadImage(page, { name: 'unreadable.png', mimeType: 'image/png', buffer: TINY_PNG });
    await expect(page.getByRole('alert')).toContainText('Could not read that file');
    expect(transforms.requestCount()).toBe(0);
  });

  test('low credits blocks a transform', async ({ page }) => {
    const transforms = await stubTransforms(page, RESULT_PROMPT, null);
    await stubUserProfile(page, { credits: 0, dailyCredits: 0, history: [] });
    await gotoSignedIn(page, COLORIZE_PATH);
    await uploadTinyPng(page);
    await page.getByTestId('colorize-cta').dispatchEvent('click');
    await expect(page.getByRole('heading', { name: 'Low credits' })).toBeVisible();
    expect(transforms.requestCount()).toBe(0);
  });

  test('an in-progress upscale stays visible after reload', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('upscaleInProgress', 'true');
      localStorage.setItem('upscaleJobId', JSON.stringify('job-restore'));
    });
    // Leave the progress stream open. A finished body fires an error event and clears the in-progress flag.
    await page.route(/\/progress\?/, () => new Promise(() => {}));
    await gotoSignedIn(page, UPSCALE_PATH);
    await expect(page.getByTestId('upscale-cta')).toHaveAttribute('aria-busy', 'true');
  });

  test('uploaded source images are not restored after reload', async ({ page }) => {
    await gotoSignedIn(page, UPSCALE_PATH);
    await uploadTinyPng(page);
    await page.reload();
    await expect(page.getByTestId('upscale-aside')).toBeVisible();
    await expect(page.getByAltText('Upload preview')).toHaveCount(0);
    await expect(page.getByTestId('image-upload-trigger')).toBeVisible();
  });
});

test('signed-out visitor is asked to sign up before a transform @guest', async ({ page }) => {
  let requests = 0;
  await page.route(/\/generate\/upscale\/image$/, async (route) => {
    requests += 1;
    await route.fulfill({ status: 500, body: 'unexpected' });
  });
  await page.goto(UPSCALE_PATH);
  await uploadTinyPng(page);
  await page.getByTestId('upscale-cta').dispatchEvent('click');
  await expect(page.getByRole('heading', { name: 'Sign up for free' })).toBeVisible();
  expect(requests).toBe(0);
});
