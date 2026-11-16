import { randomUUID } from 'node:crypto';

import type { Page } from '@playwright/test';

import { test, expect } from '../fixtures/qa';
import { requireEnv } from '../support/env';
import { activateProViaWebhook } from '../support/proWebhook';
import { gotoStudio } from '../support/studio';
import { resetToFree } from '../support/subscriptionState';

const E2E_USER_ID = requireEnv('E2E_CLERK_USER_ID');
const RUN = randomUUID().slice(0, 8);
const HEIGHT = 900;
const HTTP_OK = 200;
const PRICES_ROUTE = '**/payments/prices**';
const MOCK_PRO_USD_MINOR = 700;
const MOCK_PACK_USD_MINOR = 1100;
const CHECKOUT_URL = /\/payments\/(checkout|subscribe)(\/|$|\?)/;
const API_ORIGIN_PREFIX = /^https:\/\/api\./;
const UPGRADE_LABEL = 'Upgrade to Pro';
const EARN_LABEL = 'Earn credits';
// Evidence PNGs land in the repo-level agent_docs/qa tree (playwright runs from apps/web).
const shotPath = (name: string) => `../../agent_docs/qa/header-responsive/${name}.png`;

type Price = { amountMinor: number; currency: string };
type PricesBody = { pro: Price; packs: Array<Price & { id: string }> } & Record<string, unknown>;

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

/** Keeps the real response (and its CORS headers) but pins every amount so the test owns the data. */
async function mockPrices(page: Page) {
  await page.route(PRICES_ROUTE, async (route) => {
    const response = await route.fetch();
    const body = (await response.json()) as PricesBody;
    body.pro = { amountMinor: MOCK_PRO_USD_MINOR, currency: 'USD' };
    body.packs = body.packs.map((pack) => ({
      ...pack,
      amountMinor: MOCK_PACK_USD_MINOR,
      currency: 'USD',
    }));
    await route.fulfill({ response, json: body });
  });
}

async function leftEdge(page: Page, testId: string) {
  const box = await page.getByTestId(testId).boundingBox();
  expect(box, `${testId} has a bounding box`).not.toBeNull();
  return box!.x;
}

async function openStudioAt(page: Page, width: number) {
  await page.setViewportSize({ width, height: HEIGHT });
  await gotoStudio(page);
}

test.describe('header responsive banner and Earn pill', () => {
  for (const width of [390, 700]) {
    test(
      `Banner visible at ${width}px and Earn pill absent`,
      { tag: ['@critical'] },
      async ({ page, snap }) => {
        await openStudioAt(page, width);

        await expect(page.getByTestId('referral-offer-mobile')).toBeVisible();
        await expect(page.getByTestId('referral-offer-desktop')).toHaveCount(0);
        await snap(`header-banner-${width}`);
      },
    );
  }

  for (const width of [768, 1024]) {
    test(
      `Banner absent and Earn pill present at ${width}px`,
      { tag: ['@critical'] },
      async ({ page, snap }) => {
        await openStudioAt(page, width);

        await expect(page.getByTestId('referral-offer-desktop')).toBeVisible();
        await expect(page.getByTestId('referral-offer-mobile')).toHaveCount(0);
        await snap(`header-earn-pill-${width}`);
      },
    );
  }

  test('No horizontal page scroll at 700px', { tag: ['@medium'] }, async ({ page }) => {
    await openStudioAt(page, 700);
    await expect(page.getByTestId('referral-offer-mobile')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  for (const height of [600, 900]) {
    test(
      `Shell fits under the in-flow header with nothing cut off at 700x${height}`,
      { tag: ['@critical'] },
      async ({ page, snap }) => {
        await page.setViewportSize({ width: 700, height });
        await gotoStudio(page);
        await expect(page.getByTestId('referral-offer-mobile')).toBeVisible();

        const layout = await page.evaluate(() => {
          const header = document.querySelector('header.header-v2');
          const shell = document.querySelector('[data-testid="dashboard-shell"]');
          const rail = document.querySelector('[data-testid="dashboard-rail"]');
          const box = shell?.parentElement;
          const bottoms = [...(rail?.children ?? [])].map((c) => c.getBoundingClientRect().bottom);
          rail?.scrollTo(0, rail.scrollHeight);
          const railEnd = Math.max(
            ...[...(rail?.children ?? [])].map((c) => c.getBoundingClientRect().bottom),
          );
          return {
            headerBottom: header?.getBoundingClientRect().bottom ?? -1,
            shellTop: shell?.getBoundingClientRect().top ?? -1,
            shellBottom: shell?.getBoundingClientRect().bottom ?? Infinity,
            boxScrollOverflow: box ? box.scrollHeight - box.clientHeight : Infinity,
            railChildren: bottoms.length,
            railEnd,
            railBottom: rail?.getBoundingClientRect().bottom ?? -1,
            docHeight: document.documentElement.scrollHeight,
          };
        });

        expect(Math.abs(layout.shellTop - layout.headerBottom)).toBeLessThanOrEqual(1);
        expect(layout.shellBottom).toBeLessThanOrEqual(height);
        expect(layout.boxScrollOverflow).toBeLessThanOrEqual(0);
        expect(layout.docHeight).toBeLessThanOrEqual(height);
        expect(layout.railChildren).toBeGreaterThan(0);
        expect(layout.railEnd).toBeLessThanOrEqual(Math.min(layout.railBottom, height) + 1);
        await snap(`header-band-700x${height}`);
      },
    );
  }

  for (const width of [1440, 1024]) {
    test(
      `Right cluster at ${width}px shows labels in order Earn, Upgrade, credits, avatar`,
      { tag: ['@critical'] },
      async ({ page, snap }) => {
        await openStudioAt(page, width);

        const earn = page.getByTestId('referral-offer-desktop');
        const upgrade = page.getByTestId('upgrade-button');
        await expect(earn).toBeVisible();
        await expect(earn).toContainText(EARN_LABEL);
        await expect(upgrade).toBeVisible();
        await expect(upgrade).toContainText(UPGRADE_LABEL);
        await expect(page.getByTestId('credits-chip')).toBeVisible();
        await expect(page.getByTestId('user-menu-trigger')).toBeVisible();

        const xs = [
          await leftEdge(page, 'referral-offer-desktop'),
          await leftEdge(page, 'upgrade-button'),
          await leftEdge(page, 'credits-chip'),
          await leftEdge(page, 'user-menu-trigger'),
        ];
        expect(xs).toEqual([...xs].sort((a, b) => a - b));
        expect(new Set(xs).size).toBe(xs.length);
        await snap(`header-cluster-${width}`);
        await page.screenshot({ path: shotPath(`cluster-${width}`) });
      },
    );
  }

  test(
    'Buttons are icon-only with aria-label and tooltip at 768px',
    { tag: ['@critical'] },
    async ({ page, snap }) => {
      await openStudioAt(page, 768);

      const earn = page.getByRole('button', { name: EARN_LABEL });
      const upgrade = page.getByRole('button', { name: UPGRADE_LABEL });
      await expect(earn).toBeVisible();
      await expect(upgrade).toBeVisible();
      await expect(earn).toHaveText('');
      await expect(upgrade).toHaveText('');
      await expect(earn).toHaveAttribute('aria-label', EARN_LABEL);
      await expect(upgrade).toHaveAttribute('aria-label', UPGRADE_LABEL);

      await upgrade.hover();
      await expect(page.getByRole('tooltip')).toHaveText(UPGRADE_LABEL);
      await page.screenshot({ path: shotPath('icon-only-768') });
      await earn.hover();
      await expect(page.getByRole('tooltip')).toHaveText(EARN_LABEL);
      await snap('header-icon-only-768');
    },
  );

  test('Pro user has no Upgrade button', { tag: ['@high'] }, async ({ page, snap }) => {
    const res = await activateProViaWebhook(page, E2E_USER_ID, `sub_e2e_${RUN}_hdr`);
    expect(res.status()).toBe(HTTP_OK);

    await openStudioAt(page, 1440);
    await expect(page.getByTestId('credits-chip')).toBeVisible();
    await expect(page.getByTestId('pro-badge-header')).toBeVisible();
    await expect(page.getByTestId('upgrade-button')).toHaveCount(0);
    await snap('header-pro-1440');
  });

  test(
    'Upgrade icon visible and Earn pill absent at 390px',
    { tag: ['@high'] },
    async ({ page, snap }) => {
      await openStudioAt(page, 390);

      const upgrade = page.getByTestId('upgrade-button');
      await expect(upgrade).toBeVisible();
      await expect(upgrade).toHaveAttribute('aria-label', UPGRADE_LABEL);
      await expect(upgrade).toHaveText('');
      await expect(page.getByTestId('referral-offer-desktop')).toHaveCount(0);
      await expect(page.getByTestId('referral-offer-mobile')).toBeVisible();
      await snap('header-icon-390');
      await page.screenshot({ path: shotPath('upgrade-icon-390') });
    },
  );

  test(
    'Upgrade click opens the pricing dialog with mocked prices',
    { tag: ['@medium'] },
    async ({ page, snap }) => {
      await mockPrices(page);
      await openStudioAt(page, 1440);

      await page.getByTestId('upgrade-button').click();
      const dialog = page.getByRole('dialog', { name: /Unlock the full power/ });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByTestId('pricing-layout')).toBeVisible();
      await expect(dialog).toContainText(`$${MOCK_PRO_USD_MINOR / 100}`);
      await snap('header-upgrade-dialog');
    },
  );
});
