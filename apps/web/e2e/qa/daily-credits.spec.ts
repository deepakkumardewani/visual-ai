import { randomUUID } from 'node:crypto';

import { mergeTests, type Page } from '@playwright/test';

import { test as generationTest } from '../fixtures/generation';
import { expect, test as qaTest } from '../fixtures/qa';
import { requireEnv } from '../support/env';
import { readCredits, withUsers } from '../support/proPerksSeed';
import { freshEventTime, sendSubscriptionWebhook } from '../support/proWebhook';
import { resetToFree } from '../support/subscriptionState';
import { gotoStudio } from '../support/studio';

const test = mergeTests(qaTest, generationTest);

const E2E_USER_ID = requireEnv('E2E_CLERK_USER_ID');
const RUN = randomUUID().slice(0, 8);
const HTTP_OK = 200;
const FREE_DAILY = 30;
const PRO_DAILY = 50;
const LOW_DAILY = 7;
const HIGH_DAILY = 80;
const PERSISTENT = 12;
// Evidence PNGs land in the repo-level agent_docs/qa tree (playwright runs from apps/web).
const shotPath = (name: string) => `../../agent_docs/qa/daily-credits/${name}.png`;

/** Free plan with the given balances, written Mongo-direct (no paid call involved). */
async function seedFree(dailyCredits: number) {
  await resetToFree(E2E_USER_ID);
  await withUsers((users) =>
    users.updateOne({ userId: E2E_USER_ID }, { $set: { dailyCredits, credits: PERSISTENT } }),
  );
}

async function expectProfileDaily(page: Page, daily: number, allowance: number) {
  await page.goto('/profile');
  const card = page.getByRole('region', { name: 'Credits' });
  await expect(card).toContainText(`${daily}/${allowance} daily`);
  return card;
}

test.describe('daily credits: Free 30, Pro 50, mid-day top-up', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async () => {
    await resetToFree(E2E_USER_ID);
  });

  test('@critical Free account shows 30/day on the profile credits card', async ({
    page,
    snap,
  }) => {
    await seedFree(FREE_DAILY);
    await gotoStudio(page);
    await expectProfileDaily(page, FREE_DAILY, FREE_DAILY);
    await snap('free-profile');
    await page.screenshot({ path: shotPath('free-profile'), fullPage: true });
  });

  test('@critical signed ACTIVATED webhook raises a low balance to 50 and the chip updates', async ({
    page,
    snap,
  }) => {
    await seedFree(LOW_DAILY);
    await gotoStudio(page);
    const chip = page.getByTestId('credits-chip');
    await expect(chip).toHaveAttribute('title', new RegExp(`^${LOW_DAILY} daily`));

    const res = await sendSubscriptionWebhook(page, {
      type: 'subscription.active',
      userId: E2E_USER_ID,
      subscriptionId: `sub_e2e_${RUN}_topup`,
    });
    expect(res.status()).toBe(HTTP_OK);
    await expect.poll(async () => (await readCredits(E2E_USER_ID)).dailyCredits).toBe(PRO_DAILY);

    await gotoStudio(page);
    await expect(chip).toHaveAttribute('title', new RegExp(`^${PRO_DAILY} daily`));
    await chip.click();
    await expect(page.getByTestId('credits-chip-menu')).toContainText(`${PRO_DAILY} daily`);
    await snap('chip-after-activation');
    await page.screenshot({ path: shotPath('chip-after-activation'), fullPage: true });
  });

  test('@high a replayed or RENEWED webhook does not change the balance', async ({ page }) => {
    await seedFree(LOW_DAILY);
    const subscriptionId = `sub_e2e_${RUN}_replay`;
    const timestamp = freshEventTime();
    const activate = () =>
      sendSubscriptionWebhook(page, {
        type: 'subscription.active',
        userId: E2E_USER_ID,
        subscriptionId,
        timestamp,
      });

    expect((await activate()).status()).toBe(HTTP_OK);
    await expect.poll(async () => (await readCredits(E2E_USER_ID)).dailyCredits).toBe(PRO_DAILY);

    // Spend some credits, then replay the identical event and send a RENEWED one.
    const spent = 20;
    await withUsers((users) =>
      users.updateOne({ userId: E2E_USER_ID }, { $set: { dailyCredits: PRO_DAILY - spent } }),
    );
    expect((await activate()).status()).toBe(HTTP_OK);
    const renewed = await sendSubscriptionWebhook(page, {
      type: 'subscription.renewed',
      userId: E2E_USER_ID,
      subscriptionId,
    });
    expect(renewed.status()).toBe(HTTP_OK);

    await page.goto('/profile');
    await expect(page.getByRole('region', { name: 'Credits' })).toContainText(
      `${PRO_DAILY - spent}/${PRO_DAILY} daily`,
    );
    expect((await readCredits(E2E_USER_ID)).dailyCredits).toBe(PRO_DAILY - spent);
  });

  test('@high Pro profile shows 50/day', async ({ page, snap }) => {
    await seedFree(LOW_DAILY);
    const res = await sendSubscriptionWebhook(page, {
      type: 'subscription.active',
      userId: E2E_USER_ID,
      subscriptionId: `sub_e2e_${RUN}_profile`,
    });
    expect(res.status()).toBe(HTTP_OK);
    await expectProfileDaily(page, PRO_DAILY, PRO_DAILY);
    await snap('pro-profile');
    await page.screenshot({ path: shotPath('pro-profile'), fullPage: true });
  });

  test('@medium a balance above 50 is unchanged by activation', async ({ page }) => {
    await seedFree(HIGH_DAILY);
    const res = await sendSubscriptionWebhook(page, {
      type: 'subscription.active',
      userId: E2E_USER_ID,
      subscriptionId: `sub_e2e_${RUN}_high`,
    });
    expect(res.status()).toBe(HTTP_OK);
    // Plan flips to pro, which proves the event was applied before we assert the balance.
    await expect
      .poll(async () =>
        withUsers(async (users) => (await users.findOne({ userId: E2E_USER_ID }))?.plan),
      )
      .toBe('pro');
    expect((await readCredits(E2E_USER_ID)).dailyCredits).toBe(HIGH_DAILY);
  });
});
