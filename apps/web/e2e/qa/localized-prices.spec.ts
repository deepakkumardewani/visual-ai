import type { APIResponse, Page } from '@playwright/test';

import { CREDIT_PACKS } from '@visual-ai/shared';

import { expect, test } from '../fixtures/qa';
import { isCloudinaryUrl } from '../support/cloudinaryMock';
import { API_URL } from '../support/env';

// GET /payments/prices is free (no provider call). Opt out of the global Cloudinary mock so any
// attempted request is visible and counted.
test.use({ allowRealCloudinary: true });

const PRICES_URL = `${API_URL}/payments/prices`;
const GEO_HEADER = 'cf-ipcountry';
const PRO_USD = { amountMinor: 500, currency: 'USD' };
const USD_PACK_MINORS = CREDIT_PACKS.map((pack) => pack.prices.USD);
const INR_PACK_MINORS = CREDIT_PACKS.map((pack) => pack.prices.INR);

type Price = { amountMinor: number; currency: string };
type PricesBody = {
  country: string | null;
  currency: string;
  pro: Price;
  packs: Array<Price & { id: string }>;
};

async function readPrices(response: APIResponse): Promise<PricesBody> {
  expect(response.ok(), `GET /payments/prices failed: ${response.status()}`).toBeTruthy();
  return (await response.json()) as PricesBody;
}

/** Records every attempted Cloudinary request made by a page, aborting them. */
async function trackCloudinary(page: Page): Promise<string[]> {
  const attempted: string[] = [];
  page.on('request', (req) => {
    if (isCloudinaryUrl(req.url())) attempted.push(req.url());
  });
  await page.route(
    (url) => isCloudinaryUrl(url.toString()),
    (route) => route.abort(),
  );
  return attempted;
}

/** Loads the pricing page so the zero-Cloudinary assertion covers a real browsing session. */
async function visitPricingPage(page: Page, attempted: string[]) {
  await page.goto('/pricing');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(attempted).toEqual([]);
}

function expectUsdOnly(body: PricesBody) {
  expect(body.currency).toBe('USD');
  expect(body.pro).toEqual(PRO_USD);
  expect(body.packs.map((p) => p.amountMinor)).toEqual(USD_PACK_MINORS);
  for (const pack of body.packs) expect(pack.currency).toBe('USD');
}

test('@high India pays exact INR pack prices; Pro stays $5', async ({ page, request, snap }) => {
  const attempted = await trackCloudinary(page);

  const india = await readPrices(
    await request.get(PRICES_URL, { headers: { [GEO_HEADER]: 'IN' } }),
  );
  expect(india.country).toBe('IN');
  expect(india.currency).toBe('INR');
  expect(india.pro).toEqual(PRO_USD);
  expect(india.packs.map((p) => p.amountMinor)).toEqual(INR_PACK_MINORS);
  for (const pack of india.packs) expect(pack.currency).toBe('INR');

  await visitPricingPage(page, attempted);
  await snap('localized-prices-pricing-page');
});

test('@high every other country sees plain USD', async ({ page, request }) => {
  const attempted = await trackCloudinary(page);

  expectUsdOnly(await readPrices(await request.get(PRICES_URL)));
  for (const country of ['DE', 'US', 'XX']) {
    const body = await readPrices(
      await request.get(PRICES_URL, { headers: { [GEO_HEADER]: country } }),
    );
    expectUsdOnly(body);
  }

  await visitPricingPage(page, attempted);
});

// ---- T4.5: browser-visible localized currency (pricing page + buy dialog) ----

const PRICES_ROUTE = `${API_URL}/payments/prices**`;
const RUPEE_PRICE = /^₹[\d,]+(\.\d{2})?$/;
const USD_PRICE = /^\$[\d,]+(\.\d{2})?$/;
const USER_PROFILE_URL = /\/users\/user_/;

/** Makes the page's own /payments/prices call carry the geo header (and optional query). */
async function routePrices(page: Page, opts: { header?: string; query?: string }) {
  await page.route(PRICES_ROUTE, async (route) => {
    const request = route.request();
    const headers = { ...request.headers() };
    delete headers[GEO_HEADER];
    if (opts.header) headers[GEO_HEADER] = opts.header;
    const url = new URL(request.url());
    if (opts.query) url.search = opts.query;
    await route.continue({ url: url.toString(), headers });
  });
}

function buyCreditsDialog(page: Page) {
  // Dashboard + AppHeader each mount BuyMoreCreditsDialog; both open from the shared store.
  return page.getByRole('dialog', { name: 'Buy more credits' }).last();
}

async function openBuyDialog(page: Page) {
  await Promise.all([page.waitForResponse(USER_PROFILE_URL), page.goto('/create/image')]);
  await page.getByTestId('credits-chip').click();
  await page.getByRole('button', { name: 'Buy Credits' }).click();
  await expect(buyCreditsDialog(page)).toBeVisible();
}

async function expectDialogPackPrices(page: Page, pattern: RegExp) {
  const radios = buyCreditsDialog(page)
    .getByRole('radiogroup', { name: 'Credit packages' })
    .getByRole('radio');
  await expect(radios).toHaveCount(CREDIT_PACKS.length);
  for (let i = 0; i < CREDIT_PACKS.length; i++) {
    await expect(radios.nth(i).locator('.pkg-price')).toHaveText(pattern);
  }
}

async function expectPagePackPrices(page: Page, pattern: RegExp) {
  await expect(page.getByRole('button', { name: 'Buy this pack' })).toHaveCount(
    CREDIT_PACKS.length,
  );
  // Scoped to the packs section: the Pro card on the same page also shows a price.
  await expect(page.locator('#packs').locator('.pack__price')).toHaveText(
    Array(CREDIT_PACKS.length).fill(pattern),
  );
}

async function gotoPricing(page: Page) {
  const prices = page.waitForResponse((r) => r.url().includes('/payments/prices'));
  await page.goto('/pricing');
  const body = (await (await prices).json()) as PricesBody;
  return body;
}

test.describe('browser currency', () => {
  test('@critical cf-ipcountry IN shows rupee prices on pricing and in the buy dialog', async ({
    page,
    snap,
  }) => {
    await routePrices(page, { header: 'IN' });

    const body = await gotoPricing(page);
    expect(body.country).toBe('IN');
    expect(body.currency).toBe('INR');
    await expectPagePackPrices(page, RUPEE_PRICE);
    await snap('localized-prices-inr-pricing');

    await openBuyDialog(page);
    await expectDialogPackPrices(page, RUPEE_PRICE);
    await snap('localized-prices-inr-buy-dialog');
  });

  test('@high no header shows USD on pricing and in the buy dialog', async ({ page, snap }) => {
    await routePrices(page, {});

    const body = await gotoPricing(page);
    expect(body.currency).toBe('USD');
    await expectPagePackPrices(page, USD_PRICE);
    await snap('localized-prices-usd-pricing');

    await openBuyDialog(page);
    await expectDialogPackPrices(page, USD_PRICE);
  });

  test('@high ?country=ZZ is ignored and falls back to the header', async ({ page, request }) => {
    const ignored = await readPrices(
      await request.get(`${PRICES_URL}?country=ZZ`, { headers: { [GEO_HEADER]: 'IN' } }),
    );
    expect(ignored.country).toBe('IN');
    expect(ignored.currency).toBe('INR');

    await routePrices(page, { header: 'IN', query: '?country=ZZ' });
    const body = await gotoPricing(page);
    expect(body.currency).toBe('INR');
    await expectPagePackPrices(page, RUPEE_PRICE);
  });

  test('@high ?country=ZZ with no header falls back to USD', async ({ request }) => {
    expectUsdOnly(await readPrices(await request.get(`${PRICES_URL}?country=ZZ`)));
  });

  test('@medium dev ?country=IN returns INR amounts', async ({ request }) => {
    const body = await readPrices(await request.get(`${PRICES_URL}?country=IN`));
    expect(body.country).toBe('IN');
    expect(body.currency).toBe('INR');
    expect(body.packs.map((p) => p.amountMinor)).toEqual(INR_PACK_MINORS);
    for (const pack of body.packs) expect(pack.currency).toBe('INR');
  });
});
