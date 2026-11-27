import type { Locator, Page } from '@playwright/test';

import {
  DAILY_CREDITS,
  HISTORY_CAP,
  MODEL_REGISTRY,
  PLAN,
  PREMIUM_MODEL_KEYS,
} from '@visual-ai/shared';

import pricingFAQ from '../../src/utils/pricingFAQ.json';
import { expect, test } from '../fixtures/qa';
import { API_URL, E2E_WEB_ORIGIN, requireEnv } from '../support/env';
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

const PRICES_URL = `${API_URL}/payments/prices`;
const PHONE_VIEWPORT = { width: 390, height: 800 };
const FAQ_HEADING = 'Before you buy.';
// The FAQ renders straight from this JSON, so the spec follows the data rather than a copy of it.
const FAQ_QUESTIONS = pricingFAQ.map((faq) => faq.question);
const MOCK_PRICES = {
  country: 'US',
  currency: 'USD',
  pro: { amountMinor: 500, currency: 'USD' },
  packs: [
    { id: 'pack-1', amountMinor: 160, currency: 'USD' },
    { id: 'pack-2', amountMinor: 350, currency: 'USD' },
    { id: 'pack-3', amountMinor: 600, currency: 'USD' },
    { id: 'pack-4', amountMinor: 1100, currency: 'USD' },
  ],
};

const pricingDialog = (page: Page) => page.getByRole('dialog', { name: /Unlock the full power/ });

test.beforeEach(async ({ page }) => {
  await resetToFree(E2E_USER_ID);
  // Prices are mocked so the suite never depends on Dodo or FX data.
  await page.route(PRICES_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'access-control-allow-origin': E2E_WEB_ORIGIN,
        'access-control-allow-credentials': 'true',
      },
      body: JSON.stringify(MOCK_PRICES),
    }),
  );
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
  await page.getByTestId('upgrade-button').click();
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

test('@high Pro perks list the Pro models', async ({ page, snap }) => {
  expect(PREMIUM_MODEL_KEYS.length).toBeGreaterThan(0);
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

const opacityOf = (locator: Locator) =>
  locator.evaluate((el) => Number(getComputedStyle(el).opacity));

/** Every ancestor-compounded reveal must have settled: the element itself reads opacity 1. */
async function expectRevealed(locator: Locator) {
  await expect(locator).toBeVisible();
  await expect.poll(() => opacityOf(locator)).toBe(1);
  await expect(locator).toBeInViewport();
}

/** Re-scrolls on retry: lazy content above can shift layout and push the target out of view. */
async function expectRevealedAfterScroll(locator: Locator) {
  await expect(async () => {
    await locator.scrollIntoViewIfNeeded();
    await expectRevealed(locator);
  }).toPass();
}

/** v-reveal sits on the list item, and opacity is not inherited, so read the item, not the button. */
async function expectFaqItemsRevealed(faq: Locator) {
  const items = faq.getByRole('listitem');
  await expect(items).toHaveCount(FAQ_QUESTIONS.length);
  for (let i = 0; i < FAQ_QUESTIONS.length; i++) {
    const item = items.nth(i);
    await expect(item.getByRole('button', { name: FAQ_QUESTIONS[i] })).toBeVisible();
    await expectRevealed(item);
  }
}

async function scrollDialogToBottom(dialog: Locator) {
  await dialog.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
}

async function expectDialogFaqRevealed(
  page: Page,
  name: string,
  snap: (n: string) => Promise<void>,
) {
  const dialog = await openPricingModal(page);
  await scrollDialogToBottom(dialog);
  const faq = dialog.locator('#faq');
  await expectRevealed(faq.getByRole('heading', { name: FAQ_HEADING }));
  await expectFaqItemsRevealed(faq);
  await snap(name);
  await page.screenshot({ path: shotPath(name) });
  return dialog;
}

test('@critical Upgrade dialog FAQ is fully revealed after scrolling to the bottom', async ({
  page,
  snap,
}) => {
  await expectDialogFaqRevealed(page, 'dialog-faq-revealed', snap);
});

test('@high Upgrade dialog FAQ answer expands on click', async ({ page }) => {
  const dialog = await openPricingModal(page);
  await scrollDialogToBottom(dialog);
  const question = dialog.locator('#faq').getByRole('button', { name: FAQ_QUESTIONS[2] });
  await expect(question).toHaveAttribute('aria-expanded', 'false');
  await question.click();
  await expect(question).toHaveAttribute('aria-expanded', 'true');
  await expect(dialog.locator(`#${await question.getAttribute('aria-controls')}`)).toBeVisible();
});

test('@high Upgrade dialog FAQ is revealed and expands at 390 wide', async ({ page, snap }) => {
  await page.setViewportSize(PHONE_VIEWPORT);
  const dialog = await openPricingModal(page);
  await scrollDialogToBottom(dialog);
  const faq = dialog.locator('#faq');
  await expectRevealed(faq.getByRole('heading', { name: FAQ_HEADING }));
  await expectFaqItemsRevealed(faq);
  const question = faq.getByRole('button', { name: FAQ_QUESTIONS[4] });
  await question.click();
  await expect(question).toHaveAttribute('aria-expanded', 'true');
  await expect(dialog.locator(`#${await question.getAttribute('aria-controls')}`)).toBeVisible();
  await snap('dialog-faq-390');
  await page.screenshot({ path: shotPath('dialog-faq-390') });
});

test('@medium /pricing page FAQ still reveals', async ({ page, snap }) => {
  const layout = await openPricingPage(page);
  const faq = layout.locator('#faq');
  await faq.scrollIntoViewIfNeeded();
  await expectRevealedAfterScroll(faq.getByRole('heading', { name: FAQ_HEADING }));
  await expect(faq.getByRole('listitem')).toHaveCount(FAQ_QUESTIONS.length);
  await expectRevealedAfterScroll(faq.getByRole('listitem').first());
  await snap('page-faq-revealed');
});

test.describe('landing reveals (signed out)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('@medium landing v-reveal sections reach opacity 1 after scrolling', async ({
    page,
    snap,
  }) => {
    await page.goto('/');
    const tools = page.getByRole('heading', {
      name: 'See what each one does.',
    });
    const faq = page.locator('#faq');
    await expectRevealedAfterScroll(tools);
    await expectRevealedAfterScroll(faq.getByRole('heading', { name: 'Good to know.' }));
    await expectRevealedAfterScroll(faq.getByRole('button').first());
    await snap('landing-reveals');
  });
});
