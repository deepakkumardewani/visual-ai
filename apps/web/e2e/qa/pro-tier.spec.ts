import { randomUUID } from 'node:crypto';

import { clerk } from '@clerk/testing/playwright';
import { mergeTests, type Locator, type Page } from '@playwright/test';

import type { IImageObject } from '@visual-ai/shared';

import { test as generationTest } from '../fixtures/generation';
import { expect, test as qaTest } from '../fixtures/qa';
import { API_URL, E2E_WEB_ORIGIN, requireEnv } from '../support/env';
import { activateProViaWebhook } from '../support/proWebhook';
import { deleteUsers, readPlan, seedExploreUsers, uniqueToken } from '../support/proPerksSeed';
import { gotoStudio } from '../support/studio';
import { resetToFree } from '../support/subscriptionState';

const test = mergeTests(qaTest, generationTest);

const E2E_USER_ID = requireEnv('E2E_CLERK_USER_ID');
const RUN = randomUUID().slice(0, 8);
const USER_PROFILE_URL = /\/users\/user_/;
const PRICES_URL = /\/payments\/prices$/;
const PROGRESS_URL = /\/progress\?jobId=/;
const GEO_HEADER = 'cf-ipcountry';
const HTTP_OK = 200;
const HTTP_CONFLICT = 409;
const PREMIUM_TITLE = 'Nano Banana Pro';
const STUDIO_CREDITS = 500;
const ALT_PREFIX_LENGTH = 60;
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
// Evidence PNGs land in the repo-level agent_docs/qa tree (playwright runs from apps/web).
const shotPath = (name: string) => `../../agent_docs/qa/pro-tier/${name}.png`;

async function activatePro(page: Page, label: string) {
  const res = await activateProViaWebhook(page, E2E_USER_ID, `sub_e2e_${RUN}_${label}`);
  expect(res.status()).toBe(HTTP_OK);
}

async function openModelPicker(page: Page) {
  await page.getByTestId('model-chip').click();
  await expect(page.getByRole('listbox')).toBeVisible();
}

/** Premium options may sit inside a provider group; expand until the option is reachable. */
async function premiumOption(page: Page): Promise<Locator> {
  const option = page.getByTestId('model-option').filter({ hasText: PREMIUM_TITLE });
  await expect(option.first()).toBeVisible();
  return option.first();
}

const pricingDialog = (page: Page) => page.getByRole('dialog', { name: /Unlock the full power/ });

async function openUserMenu(page: Page) {
  await page.getByTestId('user-menu-trigger').click();
  await expect(page.getByTestId('user-menu-panel')).toBeVisible();
}

async function clerkBearerToken(page: Page): Promise<string> {
  await clerk.loaded({ page });
  return page.evaluate(async () => {
    const token = await window.Clerk.session?.getToken();
    if (!token) throw new Error('[e2e] Clerk session token unavailable');
    return token;
  });
}

/** Stubs an at-cap generation: the API's completed payload with no _id and savedToHistory false. */
async function stubUnsavedGeneration(page: Page, prompt: string) {
  const replicateUrl = `https://replicate.delivery/e2e/${uniqueToken()}/out.png`;
  await page.route(USER_PROFILE_URL, async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const response = await route.fetch();
    const user = (await response.json()) as Record<string, unknown>;
    return route.fulfill({
      response,
      json: { ...user, credits: STUDIO_CREDITS, dailyCredits: 0 },
    });
  });
  await page.route('https://replicate.delivery/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/png',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: Buffer.from(PNG_BASE64, 'base64'),
    }),
  );
  await page.route(PROGRESS_URL, (route) => {
    const image: Omit<IImageObject, '_id' | 'createdAt' | 'featureType'> & {
      featureType: string;
      createdAt: string;
    } = {
      userId: E2E_USER_ID,
      prompt,
      featureType: 'image',
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
}

async function generateUnsaved(page: Page, prompt: string) {
  await page.getByTestId('composer-textarea-input').fill(prompt);
  await page.getByTestId('generate-cta').dispatchEvent('click');
  await expect(page.getByTestId('unsaved-result-notice')).toBeVisible();
  await expect(page.getByAltText(prompt.slice(0, ALT_PREFIX_LENGTH)).first()).toBeVisible();
}

/** Re-issues GET /payments/prices with a country header (browsers cannot set cf-ipcountry). */
async function mockGeoCountry(page: Page, country: string) {
  await page.route(PRICES_URL, async (route) => {
    const response = await route.fetch({
      headers: { ...route.request().headers(), [GEO_HEADER]: country },
    });
    await route.fulfill({ response });
  });
}

async function openPricingDialogFromLock(page: Page) {
  await openModelPicker(page);
  await (await premiumOption(page)).click();
  const dialog = pricingDialog(page);
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe('Pro tier UI', () => {
  // One shared Clerk user whose plan is mutated: tests run one at a time.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async () => {
    await resetToFree(E2E_USER_ID);
  });

  test.afterAll(async () => {
    await resetToFree(E2E_USER_ID);
  });

  test('@critical free user sees locked premium model and upsell', async ({ page, snap }) => {
    await gotoStudio(page);
    const before = await page.getByTestId('model-chip').innerText();
    await openModelPicker(page);
    const option = await premiumOption(page);
    await expect(option.getByTestId('premium-lock-badge')).toBeVisible();
    await snap('free-premium-locked');
    await page.screenshot({ path: shotPath('free-premium-locked'), fullPage: true });

    await option.click();

    const dialog = pricingDialog(page);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId('pro-subscribe')).toBeEnabled();
    await expect(dialog.getByTestId('pro-subscribe')).toHaveText('Upgrade to Pro');
    await page.screenshot({ path: shotPath('free-upsell-dialog'), fullPage: true });
    // The lock never selected the model.
    await page.getByRole('button', { name: 'Close pricing' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId('model-chip')).not.toContainText(PREMIUM_TITLE);
    expect(before).not.toContain(PREMIUM_TITLE);
  });

  test('@critical webhook-simulated Pro can select a premium model', async ({ page, snap }) => {
    await gotoStudio(page);
    await activatePro(page, 'select');
    await gotoStudio(page);

    await openModelPicker(page);
    const option = await premiumOption(page);
    await expect(page.getByTestId('premium-lock-badge')).toHaveCount(0);
    await option.click();

    await expect(pricingDialog(page)).toHaveCount(0);
    await expect(page.getByTestId('model-chip')).toContainText(PREMIUM_TITLE);
    await snap('pro-premium-selected');
    await page.screenshot({ path: shotPath('pro-premium-selected'), fullPage: true });
  });

  test('@high not-saved notice has Download and the correct CTA per plan', async ({
    page,
    snap,
  }) => {
    const prompt = `unsaved plan cta ${uniqueToken()}`;
    await stubUnsavedGeneration(page, prompt);

    await gotoStudio(page);
    await generateUnsaved(page, prompt);
    const notice = page.getByTestId('unsaved-result-notice');
    await expect(notice.getByRole('button', { name: 'Download' })).toBeVisible();
    await expect(notice.getByTestId('unsaved-upgrade')).toContainText('Upgrade to Pro');
    await expect(notice.getByTestId('unsaved-free-space')).toHaveCount(0);
    await snap('unsaved-notice-free');
    await page.screenshot({ path: shotPath('unsaved-notice-free'), fullPage: true });

    await activatePro(page, 'notice');
    await gotoStudio(page);
    await generateUnsaved(page, prompt);
    await expect(notice.getByRole('button', { name: 'Download' })).toBeVisible();
    await expect(notice.getByTestId('unsaved-free-space')).toBeVisible();
    await expect(notice.getByTestId('unsaved-upgrade')).toHaveCount(0);
    await page.screenshot({ path: shotPath('unsaved-notice-pro'), fullPage: true });
  });

  test.describe('Explore privacy', () => {
    test('@high Pro generation is hidden from Explore', async ({ page, snap }) => {
      const seed = await seedExploreUsers(uniqueToken());
      try {
        // Real Pro generation needs the paid provider (generation is stubbed in e2e), so only
        // the history document is seeded; the owner becomes Pro through the signed webhook.
        await gotoStudio(page);
        expect(await readPlan(seed.userIds[0])).toBe('free');
        const activation = await activateProViaWebhook(
          page,
          seed.userIds[0],
          `sub_e2e_${RUN}_explore`,
        );
        expect(activation.status()).toBe(HTTP_OK);
        await expect.poll(() => readPlan(seed.userIds[0])).toBe('pro');
        const token = await clerkBearerToken(page);
        const res = await page.request.get(
          `${API_URL}/explore/feed?excludeUserId=${E2E_USER_ID}&limit=48`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        expect(res.ok()).toBeTruthy();
        const prompts = ((await res.json()) as { items: { prompt: string }[] }).items.map(
          (item) => item.prompt,
        );
        expect(prompts).toContain(seed.publicItem.prompt);
        expect(prompts).not.toContain(seed.privateItem.prompt);

        await page.goto('/explore');
        await expect(page.getByRole('img', { name: seed.publicItem.prompt }).first()).toBeVisible();
        await expect(page.getByRole('img', { name: seed.privateItem.prompt })).toHaveCount(0);
        await snap('explore-private-hidden');
      } finally {
        await deleteUsers(seed.userIds);
      }
    });
  });

  test('@high mocked geo header shows local currency, no header shows USD', async ({
    page,
    snap,
  }) => {
    await gotoStudio(page);
    const dialog = await openPricingDialogFromLock(page);
    await expect(dialog.getByTestId('pro-price')).toContainText('$');
    await expect(dialog.getByTestId('pro-price')).not.toContainText('₹');
    await page.screenshot({ path: shotPath('pricing-usd'), fullPage: true });

    await mockGeoCountry(page, 'IN');
    await gotoStudio(page);
    const indiaDialog = await openPricingDialogFromLock(page);
    await expect(indiaDialog.getByTestId('pro-price')).toContainText('₹');
    await expect(indiaDialog.getByTestId('pro-price-note')).toContainText('Approx.');
    await snap('pricing-inr');
    await page.screenshot({ path: shotPath('pricing-inr'), fullPage: true });
  });

  test('@medium subscribing while already Pro returns 409', async ({ page }) => {
    await gotoStudio(page);
    await activatePro(page, 'conflict');
    const token = await clerkBearerToken(page);

    // API-level only: a browser-issued 409 trips the console guard, and Pro users have no
    // in-app Subscribe button to click (the UI message is covered by the PricingProCard test).
    const res = await page.request.post(`${API_URL}/payments/subscribe`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBe(HTTP_CONFLICT);
    expect(await res.json()).toHaveProperty('message');
    const profile = await page.request.get(`${API_URL}/users/${E2E_USER_ID}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(((await profile.json()) as { plan: string }).plan).toBe('pro');
  });

  test('@medium Pro badge persists after reload', async ({ page, snap }) => {
    await gotoStudio(page);
    await activatePro(page, 'badge');
    await gotoStudio(page);
    await openUserMenu(page);
    await expect(page.getByTestId('pro-badge')).toBeVisible();
    await page.getByTestId('user-menu-panel').screenshot({ path: shotPath('pro-badge') });

    await page.reload();
    await expect(page.getByTestId('composer-textarea-input')).toBeVisible();
    await openUserMenu(page);
    await expect(page.getByTestId('pro-badge')).toBeVisible();
    await snap('pro-badge-after-reload');
    await page
      .getByTestId('user-menu-panel')
      .screenshot({ path: shotPath('pro-badge-after-reload') });
  });
});
