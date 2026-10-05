import type { Page } from '@playwright/test';

import { expect, test } from './fixtures/generation';
import { WEB_URL } from './support/env';

const CREATE_PATH = '/create/image';
const PROMPT = 'e2e create-image: misty harbor at dawn';
const IMPROVED_PROMPT = 'e2e improved: cinematic misty harbor at dawn with golden light';
const SAVED_PROMPT_TEXT = 'e2e saved prompt: ceramic vase on stone';
const SAVED_PROMPT_ID = 'e2e-saved-prompt-1';
const USER_PROFILE_URL = /\/users\/user_/;
const GENERIC_ERROR = 'Sorry, there was an error processing your request. Please try again.';
const ALT_PREFIX_LENGTH = 60;
const FIXTURE_IMAGE_URL = `${WEB_URL}/e2e-fixture.png`;

const API_CORS = {
  'Access-Control-Allow-Origin': WEB_URL,
  'Access-Control-Allow-Credentials': 'true',
};

async function gotoSignedIn(page: Page, path: string) {
  await Promise.all([page.waitForResponse(USER_PROFILE_URL), page.goto(path)]);
}

async function readCreditBreakdown(page: Page): Promise<{ daily: number; paid: number; total: number }> {
  const title = (await page.getByTestId('credits-chip').getAttribute('title')) ?? '';
  const dailyMatch = title.match(/^(\d+)\s+daily/m);
  const paidMatch = title.match(/(\d+)\s+credits\s*$/m);
  const daily = Number.parseInt(dailyMatch?.[1] ?? '0', 10);
  const paid = Number.parseInt(paidMatch?.[1] ?? '0', 10);
  return { daily, paid, total: daily + paid };
}

async function readGenerationCost(page: Page): Promise<number> {
  const text = await page.getByTestId('generate-cta-credits').innerText();
  const match = text.match(/\d+/);
  if (!match) throw new Error(`Could not parse generation cost: ${text}`);
  return Number.parseInt(match[0], 10);
}

async function clickGenerate(page: Page) {
  await page.getByTestId('generate-cta').dispatchEvent('click');
}

async function fillAndGenerate(page: Page, prompt: string) {
  await page.getByTestId('composer-textarea-input').fill(prompt);
  await clickGenerate(page);
}

async function expectStubbedResult(page: Page, prompt: string) {
  await expect(page.getByAltText(prompt.slice(0, ALT_PREFIX_LENGTH)).first()).toBeVisible();
  await expect(page.getByTestId('result-next-actions')).toBeVisible();
}

function seedHistoryItem(user: Record<string, unknown>) {
  return {
    _id: 'e2e-profile-seed',
    userId: user.userId,
    prompt: 'seed history item',
    featureType: 'image',
    createdAt: new Date().toISOString(),
    modelName: 'Seed',
    imageType: 'horizontal',
    images: [
      {
        name: 'seed',
        aiImageUrl: FIXTURE_IMAGE_URL,
        resolution: '1x1',
        aspectRatio: '16:9',
        width: 1,
        height: 1,
        format: 'png',
      },
    ],
  };
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

async function confirmChainAction(page: Page, actionName: string) {
  const dialog = page.getByRole('dialog').filter({ hasText: actionName });
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await dialog.getByRole('button', { name: 'Continue' }).click();
}

async function clickChainAction(page: Page, label: string) {
  await resultActions(page).getByRole('button', { name: label }).dispatchEvent('click');
}

function resultActions(page: Page) {
  return page.getByTestId('result-next-actions');
}

async function openStylePicker(page: Page) {
  await page.getByTestId('style-picker').locator('button, [role="button"]').first().click();
}

async function openEnhancePicker(page: Page) {
  await page.getByTestId('prompt-enhance-picker').getByRole('button').first().click();
}

test.describe('create image scenarios', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await stubUserProfile(page, { credits: 500, dailyCredits: 30, history: [] });
  });

  test('generate from prompt shows result and decreases credits', async ({ page, generationStub }) => {
    generationStub.setPrompt(PROMPT);
    await gotoSignedIn(page, CREATE_PATH);

    const before = await readCreditBreakdown(page);
    const cost = await readGenerationCost(page);
    generationStub.setUserCreditsRemaining(before.paid - cost);

    await fillAndGenerate(page, PROMPT);
    await expectStubbedResult(page, PROMPT);
    expect(generationStub.generateRequestCount()).toBe(1);
    await expect(page.getByTestId('credits-chip')).toContainText(String(before.total - cost));
  });

  test('empty prompt does not start generation', async ({ page, generationStub }) => {
    await gotoSignedIn(page, CREATE_PATH);
    await expect(page.getByTestId('generate-cta')).toBeDisabled();
    await page.getByTestId('generate-cta').dispatchEvent('click');
    expect(generationStub.generateRequestCount()).toBe(0);
    await expect(page).toHaveURL(new RegExp(`${CREATE_PATH.replace('/', '\\/')}$`));
  });

  test('keyboard shortcut submits the current prompt', async ({ page, generationStub }) => {
    generationStub.setPrompt(PROMPT);
    await gotoSignedIn(page, CREATE_PATH);
    const composer = page.getByTestId('composer-textarea-input');
    await composer.fill(PROMPT);
    await composer.press('Control+Enter');
    await expectStubbedResult(page, PROMPT);
    expect(generationStub.generateRequestCount()).toBe(1);
  });

  test('low credits shows dialog instead of generating', async ({ page, generationStub }) => {
    await stubUserProfile(page, { credits: 0, dailyCredits: 0, history: [] });
    await gotoSignedIn(page, CREATE_PATH);
    await fillAndGenerate(page, PROMPT);
    await expect(page.getByRole('heading', { name: 'Low credits' })).toBeVisible();
    expect(generationStub.generateRequestCount()).toBe(0);
  });

  test('low credits dialog opens buy-credits packs', async ({ page }) => {
    await stubUserProfile(page, { credits: 0, dailyCredits: 0, history: [] });
    await gotoSignedIn(page, CREATE_PATH);
    await fillAndGenerate(page, PROMPT);
    await page.getByRole('button', { name: 'Buy Credits' }).click();
    await expect(page.getByRole('heading', { name: 'Buy more credits' }).first()).toBeVisible();
    const buyDialog = page.getByRole('dialog').filter({ hasText: 'Buy more credits' }).first();
    await expect(buyDialog.locator('.buy__pkg')).toHaveCount(4);
  });

  test('failed generation can be retried', async ({ page, generationStub }) => {
    generationStub.setPrompt(PROMPT);
    generationStub.setNextProgressError(GENERIC_ERROR);
    await page.route(USER_PROFILE_URL, async (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      const response = await route.fetch();
      const user = (await response.json()) as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        headers: { ...API_CORS, 'Content-Type': 'application/json' },
        json: { ...user, credits: 500, dailyCredits: 30, history: [seedHistoryItem(user)] },
      });
    });
    await gotoSignedIn(page, CREATE_PATH);
    await fillAndGenerate(page, PROMPT);
    await expect(page.getByTestId('generation-error')).toContainText(GENERIC_ERROR);
    expect(generationStub.generateRequestCount()).toBe(1);
    await expect(page.getByTestId('generate-cta')).not.toHaveAttribute('aria-busy', 'true');

    const secondGenerate = page.waitForResponse(
      (res) => res.url().includes('/generate/image') && res.request().method() === 'POST',
    );
    await page.getByTestId('generation-error-retry').dispatchEvent('click');
    await secondGenerate;
    expect(generationStub.generateRequestCount()).toBe(2);
    await expectStubbedResult(page, PROMPT);
  });

  test('starter prompt fills the composer', async ({ page }) => {
    await gotoSignedIn(page, CREATE_PATH);
    await expect(page.getByTestId('starter-prompts-grid')).toBeVisible();
    await page.getByTestId('starter-prompt-workshop').click();
    const composer = page.getByTestId('composer-textarea-input');
    await expect(composer).toHaveValue(/wood workshop/i);
  });

  test('model and output options persist after reload', async ({ page }) => {
    await gotoSignedIn(page, CREATE_PATH);
    await page.getByTestId('composer-textarea-input').fill(PROMPT);
    await page.getByTestId('aspect-1:1').click();
    await page.getByRole('button', { name: 'HD', exact: true }).click();
    await page.getByRole('group', { name: 'Number of images' }).getByRole('button', { name: '3' }).click();
    await page.getByRole('group', { name: 'Output format' }).getByRole('button', { name: 'PNG' }).click();

    await page.reload();
    await page.waitForResponse(USER_PROFILE_URL);

    await expect(page.getByTestId('composer-textarea-input')).toHaveValue(PROMPT);
    await expect(page.getByTestId('model-picker')).toContainText('Flux');
    await expect(page.getByTestId('aspect-1:1')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'HD', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByRole('group', { name: 'Number of images' }).getByRole('button', { name: '3' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByRole('group', { name: 'Output format' }).getByRole('button', { name: 'PNG' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('style and enhance choices persist after reload', async ({ page }) => {
    await gotoSignedIn(page, CREATE_PATH);
    await openStylePicker(page);
    await page.getByTestId('style-cinematic').click();
    await openEnhancePicker(page);
    await page.getByTestId('enhance-off').click();

    await page.reload();
    await page.waitForResponse(USER_PROFILE_URL);

    await expect(page.getByTestId('style-picker')).toContainText('Cinematic');
    await expect(page.getByTestId('prompt-enhance-picker')).toContainText('Off');
  });

  test('improve rewrites the prompt', async ({ page }) => {
    await gotoSignedIn(page, CREATE_PATH);
    await page.locator('[data-testid="prompt-ai-trigger"]:visible').first().click();
    await expect(page.getByTestId('prompt-ai-panel')).toBeVisible();

    await page.route(/\/prompt\/improve/, async (route) => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: API_CORS });
      }
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      return route.fulfill({
        status: 200,
        headers: { ...API_CORS, 'Content-Type': 'application/json' },
        json: { text: IMPROVED_PROMPT },
      });
    });

    await page.getByTestId('prompt-ai-improve').click();
    await expect(page.getByTestId('composer-textarea-input')).toHaveValue(IMPROVED_PROMPT, {
      timeout: 15_000,
    });
  });

  test('saved prompt can be inserted', async ({ page }) => {
    await page.route(/\/saved-prompts$/, async (route) => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: API_CORS });
      }
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          headers: { ...API_CORS, 'Content-Type': 'application/json' },
          json: {
            prompts: [
              { id: SAVED_PROMPT_ID, name: 'E2E saved', prompt: SAVED_PROMPT_TEXT, modelId: 'FLUX_BASIC' },
            ],
          },
        });
      }
      await route.continue();
    });

    await gotoSignedIn(page, CREATE_PATH);
    await page.locator('[data-testid="prompt-ai-trigger"]:visible').first().click();
    await page.locator('[data-testid="prompt-ai-saved"]:visible').click();
    await page.getByTestId(`saved-prompt-item-${SAVED_PROMPT_ID}`).click();
    await expect(page.getByTestId('composer-textarea-input')).toHaveValue(SAVED_PROMPT_TEXT);
  });

  test('result can be downloaded', async ({ page, generationStub }) => {
    generationStub.setPrompt(PROMPT);
    await gotoSignedIn(page, CREATE_PATH);
    await fillAndGenerate(page, PROMPT);
    await expectStubbedResult(page, PROMPT);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      resultActions(page).getByRole('button', { name: 'Download' }).dispatchEvent('click'),
    ]);
    expect(download.suggestedFilename()).toMatch(/^image-\d+\.(png|jpg)$/);
  });

  test('copy prompt copies result prompt to clipboard', async ({ page, generationStub, context }) => {
    generationStub.setPrompt(PROMPT);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await gotoSignedIn(page, CREATE_PATH);
    await fillAndGenerate(page, PROMPT);
    await expectStubbedResult(page, PROMPT);

    await resultActions(page).getByRole('button', { name: 'Copy prompt' }).dispatchEvent('click');
    await expect(page.getByRole('status')).toContainText('Prompt copied');
    await expect
      .poll(async () => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(PROMPT);
  });

  test('more like this starts a related generation', async ({ page, generationStub }) => {
    generationStub.setPrompt(PROMPT);
    await gotoSignedIn(page, CREATE_PATH);
    await fillAndGenerate(page, PROMPT);
    await expectStubbedResult(page, PROMPT);

    await clickChainAction(page, 'More like this');
    await confirmChainAction(page, 'More like this');
    await expect(page.getByTestId('generation-error')).toHaveCount(0);
    expect(generationStub.generateRequestCount()).toBe(2);
  });

  test('upscale this opens upscaler with the result image', async ({ page, generationStub }) => {
    generationStub.setPrompt(PROMPT);
    await gotoSignedIn(page, CREATE_PATH);
    await fillAndGenerate(page, PROMPT);
    await expectStubbedResult(page, PROMPT);

    await expect(
      page.getByAltText(PROMPT.slice(0, ALT_PREFIX_LENGTH)).first(),
    ).toHaveAttribute('src', /e2e-fixture\.png/);

    await clickChainAction(page, 'Upscale this');
    await confirmChainAction(page, 'Upscale');
    await expect(page).toHaveURL(/\/create\/upscale/, { timeout: 20_000 });
    await expect(page.getByTestId('upscale-aside')).toBeVisible();
    await expect(page.getByRole('img', { name: 'Upload preview' })).toBeVisible();
  });

  test('remove background opens remove-bg with the result image', async ({ page, generationStub }) => {
    generationStub.setPrompt(PROMPT);
    await gotoSignedIn(page, CREATE_PATH);
    await fillAndGenerate(page, PROMPT);
    await expectStubbedResult(page, PROMPT);

    await clickChainAction(page, 'Remove background');
    await confirmChainAction(page, 'Remove background');
    await expect(page).toHaveURL(/\/create\/remove_bg/, { timeout: 20_000 });
    await expect(page.getByTestId('remove-bg-aside')).toBeVisible();
    await expect(page.getByRole('img', { name: 'Upload preview' })).toBeVisible();
  });

  test('unknown create tool slug returns to image generator', async ({ page }) => {
    await gotoSignedIn(page, '/create/not-a-real-tool');
    await expect(page).toHaveURL(/\/create$/);
    await expect(page.getByTestId('image-generate-aside')).toBeVisible();
  });
});
