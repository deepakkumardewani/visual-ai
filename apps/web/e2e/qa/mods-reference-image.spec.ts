import { randomUUID } from 'node:crypto';

import type { Page } from '@playwright/test';

import { MAX_IMAGE_BYTES } from '@visual-ai/shared';

import { expect } from '@playwright/test';

import { test as qaTest } from '../fixtures/qa';
import { E2E_WEB_ORIGIN } from '../support/env';
import { gotoStudio } from '../support/studio';

const ALT_PREFIX_LENGTH = 60;
const REFERENCE_UPLOAD_ERROR =
  'Could not upload reference images. Please try again or remove them.';
const FIXTURE_IMAGE_URL = `${E2E_WEB_ORIGIN}/e2e-fixture.png`;
const FIXTURE_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': E2E_WEB_ORIGIN,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': '*',
};

const ACCEPT_BODY = { message: 'Processing started', status: 'processing' };

function pngFile(name: string, content = 'e2e-bytes') {
  return { name, mimeType: 'image/png', buffer: Buffer.from(content) };
}

function imageGenerateAside(page: Page) {
  return page.getByTestId('image-generate-aside');
}

async function selectSidebarModel(
  page: Page,
  title: string,
  company: string | null = 'Black Forest Labs',
) {
  const aside = imageGenerateAside(page);
  await aside.getByTestId('model-chip').click();
  const listbox = page.getByRole('listbox', { name: 'Select a model' });
  await expect(listbox).toBeVisible();

  let option = listbox.getByRole('option', { name: new RegExp(title, 'i') });
  if ((await option.count()) === 0 && company) {
    await listbox.getByText(company, { exact: true }).hover();
    option = page.getByRole('option', { name: new RegExp(title, 'i') });
  }
  await expect(option).toBeVisible({ timeout: 15_000 });
  await option.click();
  await expect(aside.getByTestId('model-chip')).toContainText(title);
}

async function openReferencePopover(page: Page) {
  await page.locator('[data-testid="reference-image-trigger"]:not([disabled])').click();
  await expect(page.getByTestId('reference-image-info')).toBeVisible();
}

function referenceFileInput(page: Page) {
  return page.getByTestId('reference-image-control').locator('input[type="file"]');
}

async function addReferenceFiles(
  page: Page,
  files: { name: string; mimeType: string; buffer: Buffer }[],
) {
  await openReferencePopover(page);
  await referenceFileInput(page).setInputFiles(files);
}

async function clickGenerate(page: Page) {
  await page.getByTestId('generate-cta').dispatchEvent('click');
}

type GenerationMocks = {
  setPrompt: (prompt: string) => void;
  setFailReferenceUpload: (fail: boolean) => void;
  generateCount: () => number;
  referenceUploadCount: () => number;
  lastGenerateBody: () => Record<string, unknown> | null;
};

async function installGenerationMocks(page: Page): Promise<GenerationMocks> {
  let prompt = 'e2e reference stub';
  let generateCount = 0;
  let referenceUploadCount = 0;
  let lastGenerateBody: Record<string, unknown> | null = null;
  let failReferenceUpload = false;

  await page.route('**/generate/reference-images**', async (route) => {
    if (route.request().method() === 'GET') return route.continue();
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    referenceUploadCount += 1;
    if (failReferenceUpload) {
      return route.fulfill({
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        json: { urls: [] },
      });
    }
    const post = route.request().postData() ?? '';
    const fileCount = Math.max(
      1,
      (post.match(/name="images"/g) ?? []).length || (post.match(/filename="/g) ?? []).length,
    );
    const urls = Array.from({ length: fileCount }, (_, i) => `https://cdn/e2e-${i}.png`);
    return route.fulfill({
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      json: { urls: urls.length ? urls : ['https://cdn/e2e-0.png'] },
    });
  });

  await page.route('**/generate/image**', async (route) => {
    if (!route.request().url().endsWith('/generate/image')) return route.continue();
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    generateCount += 1;
    lastGenerateBody = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({ status: 202, headers: CORS_HEADERS, json: ACCEPT_BODY });
  });

  await page.route(/\/progress\?jobId=/, (route) =>
    route.fulfill({
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      body: `data: ${JSON.stringify({
        status: 'completed',
        image: {
          _id: 'e2e-ref',
          prompt,
          featureType: 'image',
          createdAt: new Date().toISOString(),
          modelName: 'E2E',
          imageType: 'horizontal',
          images: [
            {
              name: 'e2e',
              aiImageUrl: FIXTURE_IMAGE_URL,
              resolution: '1x1',
              aspectRatio: '16:9',
              width: 1,
              height: 1,
              format: 'png',
            },
          ],
        },
        userCreditsRemaining: null,
      })}\n\n`,
    }),
  );

  await page.route('**/e2e-fixture.png**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from(FIXTURE_IMAGE_BASE64, 'base64'),
    }),
  );

  return {
    setPrompt: (value) => {
      prompt = value;
    },
    setFailReferenceUpload: (fail) => {
      failReferenceUpload = fail;
    },
    generateCount: () => generateCount,
    referenceUploadCount: () => referenceUploadCount,
    lastGenerateBody: () => lastGenerateBody,
  };
}

function expectToast(page: Page, text: RegExp | string) {
  return expect(page.getByRole('status').filter({ hasText: text })).toBeVisible();
}

qaTest(
  '@critical Selecting a model with imageInput from the sidebar enables the control (MOD-3.0 root cause).',
  async ({ page }) => {
    await gotoStudio(page);
    await expect(page.getByTestId('reference-image-disabled')).toBeVisible();
    await expect(page.getByTestId('reference-image-trigger')).toBeDisabled();

    await selectSidebarModel(page, 'Flux 2 Pro');
    await expect(page.getByTestId('reference-image-disabled')).toHaveCount(0);
    await openReferencePopover(page);
    await expect(page.getByTestId('reference-image-add')).toBeVisible();
  },
);

qaTest(
  '@critical Max-8 model accepts 8 images and blocks a 9th with the inline message.',
  async ({ page }) => {
    await gotoStudio(page);
    await selectSidebarModel(page, 'Flux 2 Pro');

    const batch = Array.from({ length: 8 }, (_, i) => pngFile(`ref-${i}.png`, String(i)));
    await addReferenceFiles(page, batch);
    await expect(page.getByTestId('reference-image-remove')).toHaveCount(8);

    await referenceFileInput(page).setInputFiles([pngFile('ref-9.png', 'nine')]);
    await expect(page.getByTestId('reference-image-inline-error')).toContainText('up to 8 images');
    await expect(page.getByTestId('reference-image-remove')).toHaveCount(8);
  },
);

qaTest(
  '@critical Generate request carries `referenceImageUrls`; zero-image generation still works.',
  async ({ page }) => {
    const mocks = await installGenerationMocks(page);
    await gotoStudio(page);
    await selectSidebarModel(page, 'Flux 2 Pro');

    const withRefsPrompt = `e2e refs ${randomUUID()}`;
    mocks.setPrompt(withRefsPrompt);
    await page.getByTestId('composer-textarea-input').fill(withRefsPrompt);
    await addReferenceFiles(page, [pngFile('guide.png')]);

    const withRefsGenerate = page.waitForResponse(
      (res) => res.url().includes('/generate/image') && res.request().method() === 'POST',
    );
    await clickGenerate(page);
    await withRefsGenerate;
    await expect(page.getByAltText(withRefsPrompt.slice(0, ALT_PREFIX_LENGTH)).first()).toBeVisible(
      {
        timeout: 20_000,
      },
    );
    expect(mocks.referenceUploadCount()).toBe(1);
    expect(mocks.generateCount()).toBe(1);
    expect(mocks.lastGenerateBody()?.referenceImageUrls).toEqual(['https://cdn/e2e-0.png']);

    await gotoStudio(page);
    await selectSidebarModel(page, 'Flux 2 Pro');
    const zeroPrompt = `e2e zero ${randomUUID()}`;
    mocks.setPrompt(zeroPrompt);
    await page.getByTestId('composer-textarea-input').fill(zeroPrompt);
    const zeroGenerate = page.waitForResponse(
      (res) => res.url().includes('/generate/image') && res.request().method() === 'POST',
    );
    await clickGenerate(page);
    await zeroGenerate;
    await expect(page.getByAltText(zeroPrompt.slice(0, ALT_PREFIX_LENGTH)).first()).toBeVisible({
      timeout: 20_000,
    });
    expect(mocks.referenceUploadCount()).toBe(1);
    expect(mocks.generateCount()).toBe(2);
    expect(mocks.lastGenerateBody()?.referenceImageUrls).toBeUndefined();
  },
);

qaTest(
  '@high Switch to a lower-max model trims with a toast naming the count; to a no-imageInput model clears with a toast; to equal/higher keeps all with no toast.',
  async ({ page }, testInfo) => {
    testInfo.setTimeout(90_000);
    await gotoStudio(page);
    await selectSidebarModel(page, 'Flux 2 Pro');
    await addReferenceFiles(page, [
      pngFile('one.png', '1'),
      pngFile('two.png', '2'),
      pngFile('three.png', '3'),
    ]);
    await expect(page.getByTestId('reference-image-remove')).toHaveCount(3);

    await selectSidebarModel(page, 'Flux 2 Max');
    await expectToast(page, /Removed 2 reference images/);
    await expect(page.getByTestId('reference-image-remove')).toHaveCount(1);

    await selectSidebarModel(page, 'Flux 2 Pro');
    await addReferenceFiles(page, [pngFile('four.png', '4'), pngFile('five.png', '5')]);
    await expect(page.getByTestId('reference-image-remove')).toHaveCount(3);

    await selectSidebarModel(page, 'Flux Lightning');
    await expectToast(page, /does not support them/);
    await expect(page.getByTestId('reference-image-thumbnails')).toHaveCount(0);

    await gotoStudio(page);
    await selectSidebarModel(page, 'Flux 2 Pro');
    await addReferenceFiles(page, [pngFile('keep-a.png'), pngFile('keep-b.png')]);
    await expect(page.getByTestId('reference-image-remove')).toHaveCount(2);
    await selectSidebarModel(page, 'Flux 2 Pro');
    await expect(page.getByRole('status').filter({ hasText: /Removed|support them/ })).toHaveCount(
      0,
    );
    await expect(page.getByTestId('reference-image-remove')).toHaveCount(2);

    await selectSidebarModel(page, 'Flux 2 Dev');
    await expectToast(page, /Removed 1 reference image/);
    await expect(page.getByTestId('reference-image-remove')).toHaveCount(1);
  },
);

qaTest(
  '@high Upload failure shows an error toast, sends no generate request.',
  async ({ page }) => {
    const mocks = await installGenerationMocks(page);
    mocks.setFailReferenceUpload(true);
    await gotoStudio(page);
    await selectSidebarModel(page, 'Flux 2 Pro');

    const prompt = `e2e upload-fail ${randomUUID()}`;
    mocks.setPrompt(prompt);
    await page.getByTestId('composer-textarea-input').fill(prompt);
    await addReferenceFiles(page, [pngFile('fail.png')]);
    await clickGenerate(page);

    await expectToast(page, REFERENCE_UPLOAD_ERROR);
    expect(mocks.referenceUploadCount()).toBe(1);
    expect(mocks.generateCount()).toBe(0);
    await expect(page.getByTestId('generate-cta')).not.toHaveAttribute('aria-busy', 'true');
  },
);

qaTest(
  '@medium Disabled + tooltip state on a no-imageInput model; wrong type and oversize messages; remove button removes one image.',
  async ({ page }) => {
    await gotoStudio(page);
    await expect(page.getByTestId('reference-image-disabled')).toBeVisible();
    const disabled = page.getByTestId('reference-image-disabled');
    await disabled.hover();
    await expect(page.getByTestId('reference-image-tooltip')).toContainText(
      'doesn’t support reference images',
    );
    await disabled.hover({ position: { x: 0, y: 0 } });
    await page.mouse.move(0, 0);

    await selectSidebarModel(page, 'Flux 2 Pro');
    await openReferencePopover(page);

    await referenceFileInput(page).setInputFiles([
      { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('nope') },
    ]);
    await expect(page.getByTestId('reference-image-inline-error')).toContainText(
      'JPG, PNG, or WEBP',
    );

    await referenceFileInput(page).setInputFiles([
      {
        name: 'big.png',
        mimeType: 'image/png',
        buffer: Buffer.alloc(MAX_IMAGE_BYTES + 1),
      },
    ]);
    await expect(page.getByTestId('reference-image-inline-error')).toContainText('5MB');

    await referenceFileInput(page).setInputFiles([pngFile('remove-me.png')]);
    await expect(page.getByTestId('reference-image-remove')).toHaveCount(1);
    await page
      .getByRole('dialog', { name: 'Image reference' })
      .getByRole('button', { name: 'Close' })
      .click();
    await page.getByTestId('reference-image-preview').hover();
    await page.getByTestId('reference-image-remove').click();
    await expect(page.getByTestId('reference-image-remove')).toHaveCount(0);
  },
);
