import { randomUUID } from 'node:crypto';

import { clerk } from '@clerk/testing/playwright';
import type { APIResponse, Page } from '@playwright/test';

import { expect, test } from '../fixtures/qa';
import { API_URL, requireEnv } from '../support/env';
import { signWebhook } from '../support/signWebhook';
import { resetToFree } from '../support/subscriptionState';

const E2E_USER_ID = requireEnv('E2E_CLERK_USER_ID');
const HTTP_CONFLICT = 409;
const TEST_RUN = randomUUID().slice(0, 8);

type SubEventType = 'active' | 'cancelled' | 'expired';
type PlanStatus = { plan: string; periodEnd: string | null; cancelAtPeriodEnd: boolean };

const PERIOD_END_MS = Date.now() + 30 * 24 * 60 * 60 * 1000;
const PERIOD_END_ISO = new Date(PERIOD_END_MS).toISOString();
let sequence = 0;

/** Monotonic event times so the API's lastEventAt guard never drops a fresh event. */
function nextEventTime(): string {
  sequence += 1;
  return new Date(Date.now() + sequence * 1000).toISOString();
}

function subscriptionEvent(type: SubEventType, subscriptionId: string) {
  return {
    type: `subscription.${type}`,
    timestamp: nextEventTime(),
    business_id: 'biz_e2e',
    data: {
      subscription_id: subscriptionId,
      next_billing_date: PERIOD_END_ISO,
      metadata: { userId: E2E_USER_ID },
    },
  };
}

async function postWebhook(
  page: Page,
  payload: unknown,
  webhookId: string = randomUUID(),
): Promise<APIResponse> {
  const body = JSON.stringify(payload);
  const headers = signWebhook({
    body,
    secret: requireEnv('DODO_PAYMENTS_WEBHOOK_KEY'),
    id: webhookId,
  });
  return page.request.post(`${API_URL}/webhooks/payments`, {
    headers: { ...headers, 'Content-Type': 'application/json' },
    data: body,
  });
}

async function clerkBearerToken(page: Page): Promise<string> {
  await clerk.loaded({ page });
  return page.evaluate(async () => {
    const token = await window.Clerk.session?.getToken();
    if (!token) throw new Error('[e2e] Clerk session token unavailable');
    return token;
  });
}

async function readStatus(page: Page): Promise<PlanStatus> {
  const token = await clerkBearerToken(page);
  const res = await page.request.get(`${API_URL}/users/${E2E_USER_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok(), `GET /users/${E2E_USER_ID} failed: ${res.status()}`).toBeTruthy();
  return (await res.json()) as PlanStatus;
}

async function activate(page: Page, subscriptionId: string) {
  const res = await postWebhook(page, subscriptionEvent('active', subscriptionId));
  expect(res.status()).toBe(200);
}

test.describe('Subscription lifecycle', () => {
  // One shared Clerk user whose plan is mutated: tests must run one at a time.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await resetToFree(E2E_USER_ID);
    await page.goto('/create/image');
    await expect(page.getByTestId('composer-textarea-input')).toBeVisible();
  });

  test.afterEach(async () => {
    // Zero Cloudinary network hits is enforced by the base fixture's auto cloudinaryMock guard.
    await resetToFree(E2E_USER_ID);
  });

  test('@critical signed active webhook flips the user to Pro', async ({ page, snap }) => {
    expect((await readStatus(page)).plan).toBe('free');

    await activate(page, `sub_e2e_${TEST_RUN}_active`);

    const status = await readStatus(page);
    expect(status.plan).toBe('pro');
    expect(status.cancelAtPeriodEnd).toBe(false);
    expect(status.periodEnd).toBe(PERIOD_END_ISO);

    await page.reload();
    await expect(page.getByTestId('composer-textarea-input')).toBeVisible();
    await snap('active-pro');
  });

  test('@high cancelled webhook keeps Pro until period end', async ({ page, snap }) => {
    const subId = `sub_e2e_${TEST_RUN}_cancel`;
    await activate(page, subId);

    const res = await postWebhook(page, subscriptionEvent('cancelled', subId));
    expect(res.status()).toBe(200);

    const status = await readStatus(page);
    expect(status.plan).toBe('pro');
    expect(status.cancelAtPeriodEnd).toBe(true);
    expect(status.periodEnd).toBe(PERIOD_END_ISO);
    await snap('cancelled-still-pro');
  });

  test('@high expired webhook returns to free', async ({ page, snap }) => {
    const subId = `sub_e2e_${TEST_RUN}_expire`;
    await activate(page, subId);
    expect((await readStatus(page)).plan).toBe('pro');

    const res = await postWebhook(page, subscriptionEvent('expired', subId));
    expect(res.status()).toBe(200);

    const status = await readStatus(page);
    expect(status.plan).toBe('free');
    expect(status.cancelAtPeriodEnd).toBe(false);
    await snap('expired-free');
  });

  test('@medium duplicate event id is a no-op', async ({ page }) => {
    const subId = `sub_e2e_${TEST_RUN}_dup`;
    const activeId = randomUUID();
    const activePayload = subscriptionEvent('active', subId);
    expect((await postWebhook(page, activePayload, activeId)).status()).toBe(200);
    expect((await postWebhook(page, subscriptionEvent('cancelled', subId))).status()).toBe(200);
    const afterCancel = await readStatus(page);
    expect(afterCancel).toMatchObject({ plan: 'pro', cancelAtPeriodEnd: true });

    const redelivered = await postWebhook(page, activePayload, activeId);
    expect(redelivered.status()).toBe(200);

    expect(await readStatus(page)).toEqual(afterCancel);
  });

  test('@medium subscribe while already Pro returns 409', async ({ page }) => {
    await activate(page, `sub_e2e_${TEST_RUN}_409`);
    expect((await readStatus(page)).plan).toBe('pro');
    const token = await clerkBearerToken(page);

    const res = await page.request.post(`${API_URL}/payments/subscribe`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBe(HTTP_CONFLICT);
    expect(await res.json()).toHaveProperty('message');
    expect((await readStatus(page)).plan).toBe('pro');
  });
});
