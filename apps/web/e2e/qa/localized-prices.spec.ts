import type { APIResponse, Page } from '@playwright/test';
import IORedis from 'ioredis';

import { expect, test } from '../fixtures/qa';
import { isCloudinaryUrl } from '../support/cloudinaryMock';
import { API_URL } from '../support/env';

// Phase 9 UI does not exist yet, so the contract is exercised at the API (GET /payments/prices).
// Opt out of the global Cloudinary mock so any attempted request is visible and counted.
test.use({ allowRealCloudinary: true });

const PRICES_URL = `${API_URL}/payments/prices`;
const GEO_HEADER = 'cf-ipcountry';
const FX_CACHE_KEY = 'payments:fx:usd';
const REDIS_HOST = process.env.REDIS_HOST ?? '127.0.0.1';
const REDIS_PORT = Number(process.env.REDIS_PORT ?? 6379);
const PRO_USD_MINOR = 500;
const INR_PACK_MINORS = [13000, 29000, 50000, 90000];
// Without usable FX the API converts INR bases at its fixed fallback rate (83 INR per USD).
const FALLBACK_INR_PER_USD = 83;
const USD_FALLBACK_PACK_MINORS = INR_PACK_MINORS.map((m) => Math.round(m / FALLBACK_INR_PER_USD));

type Price = { amountMinor: number; currency: string };
type PricesBody = {
  country: string | null;
  currency: string;
  isEstimate: boolean;
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
  expect(body.isEstimate).toBe(true);
  expect(body.pro).toEqual({ amountMinor: PRO_USD_MINOR, currency: 'USD' });
  expect(body.packs.length).toBeGreaterThan(0);
  for (const pack of body.packs) expect(pack.currency).toBe('USD');
}

test('@high a mocked country header shows local currency with the approx. note', async ({
  page,
  request,
  snap,
}) => {
  const attempted = await trackCloudinary(page);

  const india = await readPrices(
    await request.get(PRICES_URL, { headers: { [GEO_HEADER]: 'IN' } }),
  );
  expect(india.country).toBe('IN');
  expect(india.currency).toBe('INR');
  expect(india.isEstimate).toBe(true); // drives the "approx." note in the UI
  expect(india.pro.currency).toBe('INR');
  expect(india.pro.amountMinor).toBeGreaterThan(PRO_USD_MINOR);
  expect(india.packs.map((p) => p.amountMinor)).toEqual(INR_PACK_MINORS);
  for (const pack of india.packs) expect(pack.currency).toBe('INR');

  const germany = await readPrices(
    await request.get(PRICES_URL, { headers: { [GEO_HEADER]: 'DE' } }),
  );
  expect(germany.country).toBe('DE');
  expect(germany.currency).toBe('EUR');
  expect(germany.isEstimate).toBe(true);
  expect(germany.pro.currency).toBe('EUR');
  expect(germany.pro.amountMinor).toBeGreaterThan(0);
  expect(germany.pro.amountMinor).not.toBe(PRO_USD_MINOR);

  await visitPricingPage(page, attempted);
  await snap('localized-prices-pricing-page');
});

test('@high no header shows USD', async ({ page, request }) => {
  const attempted = await trackCloudinary(page);

  const unknownCountry = await readPrices(await request.get(PRICES_URL));
  expectUsdOnly(unknownCountry);

  const unsupportedCountry = await readPrices(
    await request.get(PRICES_URL, { headers: { [GEO_HEADER]: 'XX' } }),
  );
  expectUsdOnly(unsupportedCountry);

  await visitPricingPage(page, attempted);
});

test.describe('FX unusable', () => {
  let redis: IORedis;
  let originalSnapshot: string | null;
  let originalTtlSeconds: number;

  test.beforeEach(async () => {
    redis = new IORedis({ host: REDIS_HOST, port: REDIS_PORT });
    originalSnapshot = await redis.get(FX_CACHE_KEY);
    originalTtlSeconds = await redis.ttl(FX_CACHE_KEY);
  });

  test.afterEach(async () => {
    // Restore the shared dev cache so other specs keep seeing real rates.
    if (originalSnapshot === null) {
      await redis.del(FX_CACHE_KEY);
    } else if (originalTtlSeconds > 0) {
      await redis.set(FX_CACHE_KEY, originalSnapshot, 'EX', originalTtlSeconds);
    } else {
      await redis.set(FX_CACHE_KEY, originalSnapshot);
    }
    redis.disconnect();
  });

  // The API cannot be made to see a >48h-old snapshot with a failing refresh from outside, so a
  // fresh snapshot with no usable rates stands in for "no usable FX": the same USD fallback path.
  test('@medium stale FX shows USD', async ({ page, request }) => {
    const attempted = await trackCloudinary(page);
    await redis.set(FX_CACHE_KEY, JSON.stringify({ rates: {}, fetchedAt: Date.now() }), 'EX', 60);

    const body = await readPrices(
      await request.get(PRICES_URL, { headers: { [GEO_HEADER]: 'IN' } }),
    );

    expect(body.country).toBe('IN');
    expect(body.currency).toBe('USD');
    expect(body.isEstimate).toBe(true);
    expect(body.pro).toEqual({ amountMinor: PRO_USD_MINOR, currency: 'USD' });
    // Without usable FX packs are converted INR->USD at the fallback rate: every entry is USD.
    expect(body.packs.map((p) => p.amountMinor)).toEqual(USD_FALLBACK_PACK_MINORS);
    for (const pack of body.packs) expect(pack.currency).toBe('USD');

    await visitPricingPage(page, attempted);
  });
});
