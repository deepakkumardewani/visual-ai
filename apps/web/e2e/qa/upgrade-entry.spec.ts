import { randomUUID } from 'node:crypto';

import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures/qa';
import { activateProViaWebhook } from '../support/proWebhook';
import { requireEnv } from '../support/env';
import { gotoStudio } from '../support/studio';
import { resetToFree } from '../support/subscriptionState';

const E2E_USER_ID = requireEnv('E2E_CLERK_USER_ID');
const RUN = randomUUID().slice(0, 8);
const USER_PROFILE_URL = /\/users\/user_/;
const CHECKOUT_URL = /\/payments\/(checkout|subscribe)(\/|$|\?)/;
const API_ORIGIN_PREFIX = /^https:\/\/api\./;
const HTTP_OK = 200;
const MOBILE_VIEWPORT = { width: 375, height: 800 };
const HEIGHT_TOLERANCE_PX = 1;
// AppModal backdrop is rgba(8, 6, 4, 0.6) + blur(10px); the old look was 0.72 / blur(8px).
const BACKDROP_MIN_ALPHA = 0.55;
const BACKDROP_MAX_ALPHA = 0.65;
const BACKDROP_BLUR = 'blur(10px)';
// Largest allowed vertical gap between stacked rows inside a pack card (a hole is ~40px).
const CARD_MAX_ROW_GAP_PX = 14;
// Evidence PNGs land in the repo-level agent_docs/qa tree (playwright runs from apps/web).
const shotPath = (name: string) => `../../agent_docs/qa/upgrade-entry/${name}.png`;

const pricingDialog = (page: Page) => page.getByRole('dialog', { name: /Unlock the full power/ });
// BuyMoreCreditsDialog is mounted by both AppHeader and Dashboard (pre-existing), so two
// identical dialogs render; the later one stacks on top and receives the pointer.
const buyDialog = (page: Page) => page.getByRole('dialog', { name: 'Buy more credits' }).last();

test.beforeEach(async ({ page }) => {
  await resetToFree(E2E_USER_ID);
  // Checkout endpoints must never reach the real API or Dodo; none should be called here.
  await page.route(
    (url) => API_ORIGIN_PREFIX.test(url.toString()) && CHECKOUT_URL.test(url.pathname),
    (route) => route.fulfill({ status: 500, body: '{}' }),
  );
});

test.afterEach(async () => {
  await resetToFree(E2E_USER_ID);
});

async function openBuyDialog(page: Page) {
  await page.getByTestId('credits-chip').click();
  await page.getByRole('button', { name: 'Buy Credits' }).click();
  await expect(buyDialog(page)).toBeVisible();
}

test('@critical Free shows the pill and click opens pricing', async ({ page, snap }) => {
  await gotoStudio(page);
  const pill = page.getByTestId('upgrade-pill');
  await expect(pill).toBeVisible();
  await expect(page.getByTestId('pro-badge-header')).toHaveCount(0);
  await snap('free-pill');
  await page.screenshot({ path: shotPath('free-pill') });

  await pill.click();
  await expect(pricingDialog(page)).toBeVisible();
});

test('@critical Pro (activated by signed test webhook) shows the badge and no pill', async ({
  page,
  snap,
}) => {
  const res = await activateProViaWebhook(page, E2E_USER_ID, `sub_e2e_${RUN}_entry`);
  expect(res.status()).toBe(HTTP_OK);

  await gotoStudio(page);
  await expect(page.getByTestId('pro-badge-header')).toBeVisible();
  await expect(page.getByTestId('upgrade-pill')).toHaveCount(0);
  await snap('pro-badge');
  await page.screenshot({ path: shotPath('pro-badge') });

  await openBuyDialog(page);
  await expect(page.getByTestId('buy-credits-upgrade-link')).toHaveCount(0);
});

test('@high buy dialog has Upgrade link for Free, cards equal height, no "$0.00", per-100 text', async ({
  page,
  snap,
}) => {
  await gotoStudio(page);
  await openBuyDialog(page);
  const dialog = buyDialog(page);

  const link = dialog.getByTestId('buy-credits-upgrade-link');
  await expect(link).toBeVisible();

  const cards = dialog.getByRole('radio');
  await expect(cards).toHaveCount(4);
  const heights = await cards.evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect().height),
  );
  for (const height of heights) {
    expect(Math.abs(height - heights[0])).toBeLessThanOrEqual(HEIGHT_TOLERANCE_PX);
  }

  const maxGaps = await cards.evaluateAll((els) =>
    els.map((el) => {
      const rows = [...el.children]
        .map((child) => child.getBoundingClientRect())
        .filter((rect) => rect.height > 0)
        .sort((a, b) => a.top - b.top);
      return Math.max(...rows.slice(1).map((rect, i) => rect.top - rows[i].bottom));
    }),
  );
  for (const gap of maxGaps) expect(gap).toBeLessThanOrEqual(CARD_MAX_ROW_GAP_PX);

  await expect(dialog).not.toContainText('$0.00');
  await expect(dialog.getByText(/per 100 credits/)).toHaveCount(4);
  await expect(dialog.getByText(/≈ \d+ images at 1 credit \/ \d+ at \d+ credits/)).toHaveCount(4);
  await snap('buy-dialog-free');
  await page.screenshot({ path: shotPath('buy-dialog-free') });

  await link.click();
  await expect(pricingDialog(page)).toBeVisible();
  await expect(buyDialog(page)).toHaveCount(0);
});

test('@high backdrop is blurred and dim', async ({ page, snap }) => {
  await gotoStudio(page);
  await openBuyDialog(page);

  const overlay = buyDialog(page).locator(
    'xpath=ancestor::*[contains(@class,"app-modal")][last()]',
  );
  const style = await overlay.evaluate((el) => {
    const computed = getComputedStyle(el);
    return { filter: computed.backdropFilter, background: computed.backgroundColor };
  });
  expect(style.filter).toBe(BACKDROP_BLUR);
  const alpha = Number(/rgba\([^)]*,\s*([\d.]+)\)/.exec(style.background)?.[1]);
  expect(alpha).toBeGreaterThanOrEqual(BACKDROP_MIN_ALPHA);
  expect(alpha).toBeLessThanOrEqual(BACKDROP_MAX_ALPHA);
  await snap('backdrop');
});

test('@medium mobile width has no horizontal overflow', async ({ page, snap }) => {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await gotoStudio(page);
  await expect(page.getByTestId('upgrade-pill')).toBeVisible();

  const hasOverflow = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
  expect(await hasOverflow()).toBe(false);
  await snap('mobile-header');
  await page.screenshot({ path: shotPath('mobile-header') });

  await openBuyDialog(page);
  expect(await hasOverflow()).toBe(false);
  const panel = await buyDialog(page).boundingBox();
  expect(panel!.x + panel!.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);
});

test('@medium no pill flash while loading', async ({ page }) => {
  const res = await activateProViaWebhook(page, E2E_USER_ID, `sub_e2e_${RUN}_flash`);
  expect(res.status()).toBe(HTTP_OK);

  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(USER_PROFILE_URL, async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    await gate;
    return route.continue();
  });

  const profileRequested = page.waitForRequest(USER_PROFILE_URL);
  await page.goto('/create/image', { waitUntil: 'domcontentloaded' });
  await profileRequested;
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByTestId('upgrade-pill')).toHaveCount(0);
  await expect(page.getByTestId('pro-badge-header')).toHaveCount(0);

  release();
  await expect(page.getByTestId('pro-badge-header')).toBeVisible();
  await expect(page.getByTestId('upgrade-pill')).toHaveCount(0);
});

test('@medium desktop pill does not overlap the user menu', async ({ page }) => {
  await gotoStudio(page);
  const pill = await page.getByTestId('upgrade-pill').boundingBox();
  const avatar = await page.getByTestId('user-menu-trigger').boundingBox();
  expect(pill!.x + pill!.width).toBeLessThanOrEqual(avatar!.x);
});
