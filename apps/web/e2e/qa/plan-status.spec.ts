import { clerk } from '@clerk/testing/playwright';
import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures/qa';
import { API_URL, requireEnv } from '../support/env';
import { withLegacyUser } from '../support/legacyUser';

const USER_PROFILE_URL = /\/users\/user_/;

type PlanStatus = {
  plan: string;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

async function clerkBearerToken(page: Page): Promise<string> {
  await clerk.loaded({ page });
  return page.evaluate(async () => {
    const token = await window.Clerk.session?.getToken();
    if (!token) {
      throw new Error('[e2e] Clerk session token unavailable');
    }
    return token;
  });
}

async function openStudioAndReadOwnProfile(page: Page): Promise<PlanStatus> {
  const [response] = await Promise.all([
    page.waitForResponse(
      (res) => USER_PROFILE_URL.test(res.url()) && res.request().method() === 'GET',
    ),
    page.goto('/create/image'),
  ]);
  await expect(page.getByTestId('composer-textarea-input')).toBeVisible();
  return (await response.json()) as PlanStatus;
}

function expectFreeStatus(body: PlanStatus) {
  expect(body.plan).toBe('free');
  expect(body.periodEnd).toBeNull();
  expect(body.cancelAtPeriodEnd).toBe(false);
}

test('@critical a free user sees no Pro badge and /users/me reports plan free', async ({
  page,
  snap,
}) => {
  const body = await openStudioAndReadOwnProfile(page);

  expectFreeStatus(body);
  await expect(page.getByTestId('pro-badge')).toHaveCount(0);
  await expect(page.getByText('Pro', { exact: true })).toHaveCount(0);
  await snap('free-user-studio');
});

test('@high a legacy user without plan fields behaves as free', async ({ page, request }) => {
  const token = await clerkBearerToken(await gotoStudio(page));

  await withLegacyUser(async ({ userId, rawDoc }) => {
    const raw = await rawDoc();
    expect(raw).not.toHaveProperty('plan');
    expect(raw).not.toHaveProperty('subscription');

    const res = await request.get(`${API_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok(), `GET /users/${userId} failed: ${res.status()}`).toBeTruthy();
    expectFreeStatus((await res.json()) as PlanStatus);
  });
});

test('@medium plan state persists after reload', async ({ page, snap }) => {
  const userId = requireEnv('E2E_CLERK_USER_ID');
  expectFreeStatus(await openStudioAndReadOwnProfile(page));

  const [reloaded] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes(`/users/${userId}`) && res.request().method() === 'GET',
    ),
    page.reload(),
  ]);
  await expect(page.getByTestId('composer-textarea-input')).toBeVisible();

  expectFreeStatus((await reloaded.json()) as PlanStatus);
  await expect(page.getByTestId('pro-badge')).toHaveCount(0);
  await snap('free-user-after-reload');
});

async function gotoStudio(page: Page): Promise<Page> {
  await page.goto('/create/image');
  await expect(page.getByTestId('composer-textarea-input')).toBeVisible();
  return page;
}
