import type { Page } from '@playwright/test';

import { mergeTests } from '@playwright/test';

import { test as generationTest } from '../fixtures/generation';
import { expect, test as qaTest } from '../fixtures/qa';
import { requireEnv } from '../support/env';
import { resetToFree } from '../support/subscriptionState';
import { gotoStudio } from '../support/studio';

import { CURRENT_INTRO_VERSION } from '@visual-ai/shared';

const test = mergeTests(qaTest, generationTest);

const E2E_USER_ID = requireEnv('E2E_CLERK_USER_ID');
const USER_PROFILE_URL = /\/users\/user_/;
const FREE_DAILY = 30;
const PERSISTENT = 12;
// Evidence PNGs land in the repo-level agent_docs/qa tree (playwright runs from apps/web).
const shotPath = (name: string) => `../../agent_docs/qa/daily-credits-copy/${name}.png`;

/** Overrides the credit balances (and marks the intro seen so its modal cannot cover the UI) on the real profile response; GET only, never a paid call. */
async function stubBalances(page: Page, balances: { credits: number; dailyCredits: number }) {
  await page.route(USER_PROFILE_URL, async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const response = await route.fetch();
    const user = (await response.json()) as Record<string, unknown>;
    return route.fulfill({
      response,
      json: { ...user, ...balances, seenIntroVersion: CURRENT_INTRO_VERSION },
    });
  });
}

test.describe('daily credits copy (Free = 30)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async () => {
    await resetToFree(E2E_USER_ID);
  });

  test('@critical Free dashboard credit chip and profile card show 30 daily credits', async ({
    page,
    snap,
  }) => {
    await stubBalances(page, { credits: PERSISTENT, dailyCredits: FREE_DAILY });
    await gotoStudio(page);

    const chip = page.getByTestId('credits-chip');
    await expect(chip).toHaveAttribute('title', new RegExp(`^${FREE_DAILY} daily`));
    await chip.click();
    await expect(page.getByTestId('credits-chip-menu')).toContainText(`${FREE_DAILY} daily`);
    await expect(page.getByTestId('credits-chip-menu')).toContainText(`${FREE_DAILY + PERSISTENT}`);

    await page.goto('/profile');
    const card = page.getByRole('region', { name: 'Credits' });
    await expect(card).toContainText(`${FREE_DAILY}/${FREE_DAILY} daily`);
    await expect(card).toContainText(`${PERSISTENT} persistent`);
    await snap('profile-card');
    await page.screenshot({ path: shotPath('profile-card'), fullPage: true });
  });

  test('@high landing and /pricing copy mention 30 daily credits', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();
    try {
      await page.goto('/pricing');
      await expect(page.getByText(`earn ${FREE_DAILY} more every day`)).toBeVisible();
      await expect(
        page.getByText('Premium upscalers are 4 and premium generation is 5'),
      ).toBeVisible();
      await expect(page.getByText(/Budget generation is 1 credit/)).toBeVisible();
      await page.screenshot({ path: shotPath('pricing'), fullPage: true });

      await page.goto('/');
      await expect(page.getByText(`${FREE_DAILY} daily credits (unused reset)`)).toBeVisible();
      await expect(page.getByText(`and ${FREE_DAILY} more every day.`)).toBeVisible();
      await page.screenshot({ path: shotPath('landing'), fullPage: true });
    } finally {
      await context.close();
    }
  });

  test('@high low-credits dialog shows the Free amount', async ({ page, snap }) => {
    await stubBalances(page, { credits: 0, dailyCredits: 0 });
    await gotoStudio(page);

    await page.getByTestId('composer-textarea-input').fill('A lighthouse on a cliff at sunrise');
    await expect(page.getByTestId('generate-cta')).toHaveAttribute(
      'aria-label',
      'Not enough credits to generate',
    );
    // Blur first: the composer reflows on blur, which would move the button between mousedown and mouseup and swallow the click.
    await page.getByTestId('composer-textarea-input').blur();
    await page.getByTestId('generate-cta').click();

    const dialog = page.getByRole('dialog', { name: 'Low credits' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(`Your plan refreshes ${FREE_DAILY} credits every day.`);
    await snap('low-credits-dialog');
    await page.screenshot({
      path: shotPath('low-credits-dialog'),
      fullPage: true,
    });
  });

  test('@medium the app still loads with the migrated constants after reload', async ({ page }) => {
    await stubBalances(page, { credits: PERSISTENT, dailyCredits: FREE_DAILY });
    await page.goto('/profile');
    const card = page.getByRole('region', { name: 'Credits' });
    await expect(card).toContainText(`${FREE_DAILY}/${FREE_DAILY} daily`);

    await page.reload();
    await expect(card).toContainText(`${FREE_DAILY}/${FREE_DAILY} daily`);
    await expect(page.getByText(/NaN|undefined/)).toHaveCount(0);
  });
});
