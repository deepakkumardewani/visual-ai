import { randomUUID } from 'node:crypto';

import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures/qa';
import { requireEnv } from '../support/env';
import { headerPlanChip } from '../support/planPill';
import { activateProViaWebhook } from '../support/proWebhook';
import { gotoStudio } from '../support/studio';
import { resetToFree } from '../support/subscriptionState';

const E2E_USER_ID = requireEnv('E2E_CLERK_USER_ID');
const RUN = randomUUID().slice(0, 8);
const USER_PROFILE_URL = /\/users\/user_/;
const CHECKOUT_URL = /\/payments\/(checkout|subscribe)(\/|$|\?)/;
const API_ORIGIN_PREFIX = /^https:\/\/api\./;
const HTTP_OK = 200;
const WIDTHS = [360, 1440] as const;
const VIEWPORT_HEIGHT = 900;
const THEMES = ['light', 'dark'] as const;
// useStorage boolean in the app store: 'true' is dark.
const THEME_KEY = 'visual-ai-theme';
// Evidence PNGs land in the repo-level agent_docs/qa tree (playwright runs from apps/web).
const shotPath = (name: string) => `../../agent_docs/qa/plan-pill/${name}.png`;

const pricingDialog = (page: Page) => page.getByRole('dialog', { name: /Unlock the full power/ });
const perksDialog = (page: Page) => page.getByTestId('pro-perks-dialog');
const trigger = (page: Page) => page.getByTestId('user-menu-trigger');
const pill = (page: Page) => page.getByTestId('plan-pill');

async function openMenu(page: Page) {
  await trigger(page).click();
  await expect(page.getByTestId('user-menu-panel')).toBeVisible();
}

// Finite enter/leave transitions must be done before a shot; infinite loops (skeleton pulse) are ignored.
async function settleAnimations(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter(
              (a) =>
                a.effect?.getComputedTiming().iterations !== Infinity && a.playState === 'running',
            ).length,
      ),
    )
    .toBe(0);
}

async function goPro(page: Page, label: string) {
  const res = await activateProViaWebhook(page, E2E_USER_ID, `sub_e2e_${RUN}_${label}`);
  expect(res.status()).toBe(HTTP_OK);
}

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

test('@critical Free clicks FREE and the pricing dialog opens', async ({ page, snap }) => {
  await gotoStudio(page);
  await openMenu(page);
  await expect(pill(page)).toHaveText('Free');

  await pill(page).click();

  await expect(pricingDialog(page)).toBeVisible();
  await expect(perksDialog(page)).toHaveCount(0);
  await expect(page.getByTestId('user-menu-panel')).toHaveCount(0);
  await snap('free-pricing-dialog');
});

test('@critical Pro clicks PRO and the perks dialog opens with no buy button', async ({
  page,
  snap,
}) => {
  await goPro(page, 'perks');
  await gotoStudio(page);
  await openMenu(page);
  await expect(pill(page)).toHaveText('Pro');

  await pill(page).click();

  const dialog = perksDialog(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Your Pro perks' })).toBeVisible();
  await expect(dialog.getByRole('listitem').first()).toBeVisible();
  await expect(pricingDialog(page)).toHaveCount(0);
  // The only control in the dialog is Close.
  await expect(dialog.getByRole('button')).toHaveCount(1);
  await expect(dialog.getByRole('button', { name: 'Close dialog' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: /subscribe|upgrade|buy|checkout/i })).toHaveCount(
    0,
  );
  await settleAnimations(page);
  await snap('pro-perks-dialog');
  await page.screenshot({ path: shotPath('pro-perks-dialog') });
});

test('@high Escape closes and focus returns to the avatar button', async ({ page }) => {
  await goPro(page, 'escape');
  await gotoStudio(page);
  await openMenu(page);
  await pill(page).click();
  await expect(perksDialog(page)).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(perksDialog(page)).toHaveCount(0);
  await expect(trigger(page)).toBeFocused();
});

test('@high no PRO chip in the header', async ({ page }) => {
  await goPro(page, 'nochip');
  await gotoStudio(page);

  await expect(trigger(page)).toBeVisible();
  await expect(headerPlanChip(page)).toHaveCount(0);
  await expect(page.getByRole('banner').getByText(/\bPro\b/i)).toHaveCount(0);
  await expect(page.getByTestId('upgrade-button')).toHaveCount(0);
  await openMenu(page);
  await expect(pill(page)).toHaveText('Pro');
});

test('@medium pill absent until user data ready', async ({ page }) => {
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
  await expect(page.getByTestId('header-end-skeleton')).toBeVisible();
  await expect(trigger(page)).toBeHidden();
  await expect(pill(page)).toHaveCount(0);

  release();
  await expect(page.getByTestId('header-end-skeleton')).toHaveCount(0);
  await expect(trigger(page)).toBeVisible();
  await openMenu(page);
  await expect(pill(page)).toHaveText('Free');
});

const PLANS = ['Free', 'Pro'] as const;

for (const plan of PLANS) {
  for (const width of WIDTHS) {
    for (const theme of THEMES) {
      test(`@medium ${plan} open menu at ${width} ${theme}`, async ({ page, snap }) => {
        await page.addInitScript(
          ([key, value]) => window.localStorage.setItem(key, value),
          [THEME_KEY, String(theme === 'dark')],
        );
        await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
        if (plan === 'Pro') await goPro(page, `menu_${width}_${theme}`);
        await gotoStudio(page);
        await openMenu(page);
        await expect(pill(page)).toHaveText(plan);
        await expect(page.locator('html')).toHaveClass(
          theme === 'dark' ? /tw-dark/ : /^((?!tw-dark).)*$/,
        );
        await expect(pill(page)).toBeInViewport();
        await settleAnimations(page);
        const name = `menu-${plan.toLowerCase()}-${width}-${theme}`;
        await snap(name);
        await page.screenshot({ path: shotPath(name) });
      });
    }
  }
}
