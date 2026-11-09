import { randomUUID } from 'node:crypto';

import { clerk } from '@clerk/testing/playwright';
import { mergeTests, type Locator, type Page } from '@playwright/test';

import { test as generationTest } from '../fixtures/generation';
import { expect, test as qaTest } from '../fixtures/qa';
import { API_URL, E2E_WEB_ORIGIN, requireEnv } from '../support/env';
import { activateProViaWebhook } from '../support/proWebhook';
import {
  deleteUsers,
  readPlan,
  seedExploreUsers,
  stubUnsavedGeneration,
  uniqueToken,
} from '../support/proPerksSeed';
import { gotoStudio } from '../support/studio';
import { resetToFree } from '../support/subscriptionState';

const test = mergeTests(qaTest, generationTest);

const E2E_USER_ID = requireEnv('E2E_CLERK_USER_ID');
const RUN = randomUUID().slice(0, 8);
const PRICES_URL = /\/payments\/prices$/;
const GEO_HEADER = 'cf-ipcountry';
const HTTP_OK = 200;
const HTTP_CONFLICT = 409;
const PREMIUM_TITLE = 'Nano Banana Pro';
const ALT_PREFIX_LENGTH = 60;
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

  test.describe('model tiers and gating', () => {
    const PRO_ONLY_MODELS = [
      { title: 'Flux Realism', company: 'Black Forest Labs' },
      { title: 'Flux Kontext Pro', company: 'Black Forest Labs' },
      { title: 'Flux Kontext Max', company: 'Black Forest Labs' },
      { title: 'Imagen 4 Ultra', company: 'Google' },
      { title: 'Nano Banana Pro', company: 'Google' },
      { title: 'GPT Image 2', company: 'OpenAI' },
    ];
    const FREE_MAX_MODEL = { title: 'Flux 2 Max', company: 'Black Forest Labs' };
    const PREMIUM_CREDIT_COST = 5;

    /** Opens the picker if needed; the flat list scrolls, so bring the model's row into view. */
    async function modelOption(page: Page, model: { title: string; company: string }) {
      if (!(await page.getByRole('listbox').isVisible())) await openModelPicker(page);
      const option = page
        .getByTestId('model-option')
        .filter({ has: page.getByText(model.title, { exact: true }) })
        .last();
      await option.scrollIntoViewIfNeeded();
      await expect(option).toBeVisible();
      return option;
    }

    test('@critical free sees lock and PRO badge on the six Pro-only models and clicking opens pricing', async ({
      page,
      snap,
    }) => {
      await gotoStudio(page);
      for (const model of PRO_ONLY_MODELS) {
        const option = await modelOption(page, model);
        await expect(option.getByTestId('premium-lock-badge')).toHaveText(/Pro/);
        await expect(option).toHaveAttribute('data-locked', 'true');
        await option.click();
        const dialog = pricingDialog(page);
        await expect(dialog).toBeVisible();
        await page.getByRole('button', { name: 'Close pricing' }).click();
        await expect(dialog).toBeHidden();
        await expect(page.getByTestId('model-chip')).not.toContainText(model.title);
      }
      await modelOption(page, PRO_ONLY_MODELS[0]);
      await snap('free-six-locked');
      await page.screenshot({ path: shotPath('free-six-locked'), fullPage: true });
    });

    test('@critical free can select FLUX.2 Max with no lock and cost shows 5', async ({
      page,
      snap,
    }) => {
      await gotoStudio(page);
      const option = await modelOption(page, FREE_MAX_MODEL);
      await expect(option.getByTestId('premium-lock-badge')).toHaveCount(0);
      await expect(option).not.toHaveAttribute('data-locked', 'true');
      await expect(option.getByLabel(`${PREMIUM_CREDIT_COST} credits`)).toBeVisible();
      await option.scrollIntoViewIfNeeded(); // the submenu scrolls: Flux 2 Max must be in the shot
      await snap('free-flux-2-max-unlocked');
      await page.screenshot({ path: shotPath('free-flux-2-max-unlocked'), fullPage: true });

      await option.click();

      await expect(pricingDialog(page)).toHaveCount(0);
      await expect(page.getByTestId('model-chip')).toContainText(FREE_MAX_MODEL.title);
    });

    test('@critical pro sees no locks', async ({ page, snap }) => {
      await gotoStudio(page);
      await activatePro(page, 'no-locks');
      await gotoStudio(page);

      for (const model of [...PRO_ONLY_MODELS, FREE_MAX_MODEL]) {
        const option = await modelOption(page, model);
        await expect(option.getByTestId('premium-lock-badge')).toHaveCount(0);
      }
      await expect(page.getByTestId('premium-lock-badge')).toHaveCount(0);
      await snap('pro-no-locks');
      await page.screenshot({ path: shotPath('pro-no-locks'), fullPage: true });
    });

    test.describe('stale selection', () => {
      // The browser logs every non-2xx response as a console error, so the stubbed 403 is expected
      // (one combined regex: a 2-element array in test.use is read as a [value, options] fixture tuple).
      test.use({ expectedConsoleErrors: [/status of 403|ERROR api GET .* 403 /] });

      test('@high stale Pro-only selection for Free shows the upsell, not a raw error', async ({
        page,
        snap,
      }) => {
        const prompt = `stale premium ${uniqueToken()}`;
        let generateRequests = 0;
        // The API would answer 403 + code; stubbing it keeps the paid endpoint off the network.
        await page.route(/\/generate\/image$/, (route) => {
          const headers = {
            'Access-Control-Allow-Origin': E2E_WEB_ORIGIN,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Headers': '*',
          };
          if (route.request().method() === 'OPTIONS')
            return route.fulfill({ status: 204, headers });
          generateRequests += 1;
          return route.fulfill({
            status: 403,
            headers,
            json: {
              message: 'This model requires a Pro plan',
              code: 'PREMIUM_MODEL_REQUIRES_PRO',
            },
          });
        });
        await page.addInitScript(
          ([key, modelId]) =>
            window.localStorage.setItem(
              key,
              JSON.stringify({ modelId, prompt: '', noOfOutputs: 1 }),
            ),
          ['visual-ai-composer-state', 'FLUX_REALISM'],
        );

        await gotoStudio(page);
        await expect(page.getByTestId('model-chip')).toContainText('Flux Realism');
        await page.getByTestId('composer-textarea-input').fill(prompt);
        await page.getByTestId('generate-cta').dispatchEvent('click');

        await expect(pricingDialog(page)).toBeVisible();
        expect(generateRequests).toBe(1);
        await expect(page.getByText(/error processing your request/)).toHaveCount(0);
        await snap('stale-selection-upsell');
        await page.screenshot({ path: shotPath('stale-selection-upsell'), fullPage: true });
      });
    });

    test('@medium cost table shows the 5-credit group', async ({ page, snap }) => {
      await page.goto('/pricing');
      const costs = page.locator('#model-costs');
      await expect(costs).toBeVisible();
      const premium = costs.locator('.band').filter({ hasText: 'Premium generation' });
      await expect(premium).toBeVisible();
      for (const title of [...PRO_ONLY_MODELS.map((m) => m.title), FREE_MAX_MODEL.title]) {
        await expect(premium).toContainText(title);
      }
      await expect(premium).toContainText('Flux 2 Pro');
      // One flat rate for the whole band: every premium model costs 5, so no 3-5 style range.
      await expect(premium.getByLabel(`${PREMIUM_CREDIT_COST} credits`).first()).toBeVisible();
      await expect(premium.getByLabel(/\d+–\d+ credits/)).toHaveCount(0);
      await costs.scrollIntoViewIfNeeded();
      await snap('cost-table-five');
      await costs.screenshot({ path: shotPath('cost-table-five') });
    });
  });

  test('@high not-saved notice has icon Download and the correct CTA per plan', async ({
    page,
    generationStub, // stubs POST /generate/image so no real Replicate job is billed
    snap,
  }) => {
    const prompt = `unsaved plan cta ${uniqueToken()}`;
    await stubUnsavedGeneration(page, prompt);

    await gotoStudio(page);
    await generateUnsaved(page, prompt);
    const notice = page.getByTestId('unsaved-result-notice');
    await expect(notice.getByRole('button', { name: 'Download image' })).toBeVisible();
    await expect(notice.getByTestId('unsaved-upgrade')).toContainText('Upgrade to Pro');
    await expect(notice.getByRole('button', { name: 'Dismiss' })).toBeVisible();
    await expect(notice.getByText('Delete images to free space')).toHaveCount(0);
    await snap('unsaved-notice-free');
    await page.screenshot({ path: shotPath('unsaved-notice-free'), fullPage: true });

    await activatePro(page, 'notice');
    await gotoStudio(page);
    await generateUnsaved(page, prompt);
    await expect(notice.getByRole('button', { name: 'Download image' })).toBeVisible();
    await expect(notice.getByText('Delete images to free space')).toHaveCount(0);
    await expect(notice.getByTestId('unsaved-upgrade')).toHaveCount(0);
    await page.screenshot({ path: shotPath('unsaved-notice-pro'), fullPage: true });
    expect(generationStub.generateRequestCount()).toBe(2);
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
    await expect(indiaDialog.getByTestId('pro-price-note')).toHaveCount(0);
    await expect(indiaDialog.getByText('Approx. price')).toHaveCount(0);
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
