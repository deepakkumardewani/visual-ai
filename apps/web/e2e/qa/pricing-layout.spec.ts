import type { Locator, Page } from '@playwright/test';

import {
  DAILY_CREDITS,
  HISTORY_CAP,
  MODEL_REGISTRY,
  PLAN,
  PREMIUM_MODEL_KEYS,
} from '@visual-ai/shared';

import { expect, test } from '../fixtures/qa';
import { requireEnv } from '../support/env';
import { gotoStudio } from '../support/studio';
import { resetToFree } from '../support/subscriptionState';

const E2E_USER_ID = requireEnv('E2E_CLERK_USER_ID');
const CHECKOUT_URL = /\/payments\/(checkout|subscribe)(\/|$|\?)/;
const API_ORIGIN_PREFIX = /^https:\/\/api\./;
const MOBILE_VIEWPORT = { width: 375, height: 800 };
const OVERFLOW_TOLERANCE_PX = 1;
const SECTION_IDS = ['comparison', 'packs', 'model-costs', 'faq'] as const;
const RESET_TEXT = /Resets daily at \d{1,2}:\d{2}\s?(AM|PM)?/i;
// Evidence PNGs land in the repo-level agent_docs/qa tree (playwright runs from apps/web).
const shotPath = (name: string) => `../../agent_docs/qa/pricing-layout/${name}.png`;

const pricingDialog = (page: Page) => page.getByRole('dialog', { name: /Unlock the full power/ });

test.beforeEach(async ({ page }) => {
  await resetToFree(E2E_USER_ID);
  // Checkout must never reach the real API or Dodo; nothing here should call it.
  await page.route(
    (url) => API_ORIGIN_PREFIX.test(url.toString()) && CHECKOUT_URL.test(url.pathname),
    (route) => route.fulfill({ status: 500, body: '{}' }),
  );
});

test.afterEach(async () => {
  await resetToFree(E2E_USER_ID);
});

async function openPricingModal(page: Page): Promise<Locator> {
  await gotoStudio(page);
  await page.getByTestId('upgrade-pill').click();
  const dialog = pricingDialog(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId('pricing-layout')).toBeVisible();
  return dialog;
}

async function openPricingPage(page: Page): Promise<Locator> {
  await page.goto('/pricing');
  const layout = page.getByTestId('pricing-layout');
  await expect(layout).toBeVisible();
  return layout;
}

/** Top offsets (document order proxy) of the four sections inside a pricing layout. */
async function sectionTops(layout: Locator) {
  const tops: number[] = [];
  for (const id of SECTION_IDS) {
    const section = layout.locator(`#${id}`);
    await expect(section).toBeVisible();
    tops.push((await section.boundingBox())!.y);
  }
  return tops;
}

function expectAscending(tops: number[]) {
  expect(tops).toEqual([...tops].sort((a, b) => a - b));
  expect(new Set(tops).size).toBe(tops.length);
}

async function expectComparisonValues(layout: Locator) {
  const free = layout.getByTestId(`plan-${PLAN.FREE}`);
  const pro = layout.getByTestId(`plan-${PLAN.PRO}`);
  await expect(free).toContainText(`${DAILY_CREDITS.free} per day`);
  await expect(pro).toContainText(`${DAILY_CREDITS.pro} per day`);
  await expect(free).toContainText(`${HISTORY_CAP[PLAN.FREE]} images`);
  await expect(pro).toContainText(`${HISTORY_CAP[PLAN.PRO]} images`);
  expect([DAILY_CREDITS.free, DAILY_CREDITS.pro]).toEqual([30, 50]);
  expect([HISTORY_CAP[PLAN.FREE], HISTORY_CAP[PLAN.PRO]]).toEqual([100, 500]);
}

test('@critical modal and /pricing show comparison, packs, model costs, FAQ in that order', async ({
  page,
  snap,
}) => {
  const dialog = await openPricingModal(page);
  expectAscending(await sectionTops(dialog.getByTestId('pricing-layout')));
  await snap('modal-order');
  await page.screenshot({ path: shotPath('modal-order'), fullPage: true });

  const layout = await openPricingPage(page);
  expectAscending(await sectionTops(layout));
  await snap('page-order');
  await page.screenshot({ path: shotPath('page-order'), fullPage: true });
});

test('@critical modal has no site footer, page has it after the FAQ', async ({ page, snap }) => {
  const dialog = await openPricingModal(page);
  await expect(dialog.locator('footer')).toHaveCount(0);
  await expect(dialog.getByRole('contentinfo')).toHaveCount(0);
  await snap('modal-no-footer');

  const layout = await openPricingPage(page);
  const footer = page.locator('footer');
  await expect(footer).toHaveCount(1);
  await footer.scrollIntoViewIfNeeded();
  const faqBox = (await layout.locator('#faq').boundingBox())!;
  const footerBox = (await footer.boundingBox())!;
  expect(footerBox.y).toBeGreaterThanOrEqual(faqBox.y + faqBox.height - OVERFLOW_TOLERANCE_PX);
  await snap('page-footer-after-faq');
  await page.screenshot({ path: shotPath('page-footer-after-faq') });
});

test('@high comparison shows 30 vs 50 daily credits and 100 vs 500 history', async ({
  page,
  snap,
}) => {
  const layout = await openPricingPage(page);
  await expectComparisonValues(layout);
  await layout.locator('#comparison').scrollIntoViewIfNeeded();
  await snap('comparison-values');
  await page.screenshot({ path: shotPath('comparison-values') });

  const dialog = await openPricingModal(page);
  await expectComparisonValues(dialog.getByTestId('pricing-layout'));
});

test('@high "Approx. price" note and "Free Forever, Always" absent', async ({ page }) => {
  const layout = await openPricingPage(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Start free. Go further with Pro.',
  );
  await expect(layout).not.toContainText('Approx. price');
  await expect(page.getByText('Free Forever, Always')).toHaveCount(0);

  const dialog = await openPricingModal(page);
  await expect(dialog).not.toContainText('Approx. price');
  await expect(dialog.getByText('Free Forever, Always')).toHaveCount(0);
});

test('@high Pro perks list the six Pro models', async ({ page, snap }) => {
  expect(PREMIUM_MODEL_KEYS).toHaveLength(6);
  const layout = await openPricingPage(page);
  const proCard = layout.getByTestId('pricing-pro-card');
  await expect(proCard).toBeVisible();
  const perk = proCard.getByRole('listitem').filter({ hasText: 'Premium models:' });
  for (const key of PREMIUM_MODEL_KEYS) {
    await expect(perk).toContainText(MODEL_REGISTRY[key].label);
  }
  await proCard.scrollIntoViewIfNeeded();
  await snap('pro-perks-models');
  await page.screenshot({ path: shotPath('pro-perks-models') });
});

test('@medium mobile stacks the comparison without overflow', async ({ page, snap }) => {
  await page.setViewportSize(MOBILE_VIEWPORT);
  const layout = await openPricingPage(page);
  const free = (await layout.getByTestId(`plan-${PLAN.FREE}`).boundingBox())!;
  const pro = (await layout.getByTestId(`plan-${PLAN.PRO}`).boundingBox())!;
  expect(pro.y).toBeGreaterThanOrEqual(free.y + free.height - OVERFLOW_TOLERANCE_PX);
  expect(Math.abs(pro.x - free.x)).toBeLessThanOrEqual(OVERFLOW_TOLERANCE_PX);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(OVERFLOW_TOLERANCE_PX);
  await layout.locator('#comparison').scrollIntoViewIfNeeded();
  await snap('mobile-comparison');
  await page.screenshot({ path: shotPath('mobile-comparison') });
});

test('@medium local-time reset text visible', async ({ page, snap }) => {
  const layout = await openPricingPage(page);
  const story = layout.getByText(RESET_TEXT);
  await expect(story).toBeVisible();
  await expect(story).toContainText('in your local time');
  await snap('local-reset');

  const dialog = await openPricingModal(page);
  await expect(dialog.getByText(RESET_TEXT)).toBeVisible();
});
