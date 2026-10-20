import { randomUUID } from 'node:crypto';

import { clerk } from '@clerk/testing/playwright';
import type { APIRequestContext, Page } from '@playwright/test';

import { CREDIT_PACKS, type CreditPackId } from '@visual-ai/shared';

import { expect, test } from '../fixtures/qa';
import { API_URL, requireEnv } from '../support/env';

const USER_PROFILE_URL = /\/users\/user_/;

const LEGACY_PAYMENT_ROW = {
  transactionId: 'legacy_tx_e2e',
  humanReadableDate: '1 Jan 2026',
  amount: 99,
  status: 'paid',
  paymentMethod: 'card',
  description: 'Legacy pack',
};

async function clerkBearerToken(page: Page): Promise<string> {
  await page.goto('/create/image');
  await clerk.loaded({ page });
  await expect(page.getByTestId('composer-textarea-input')).toBeVisible();
  return page.evaluate(async () => {
    const token = await window.Clerk.session?.getToken();
    if (!token) {
      throw new Error('[e2e] Clerk session token unavailable');
    }
    return token;
  });
}

async function createDodoPaymentViaApi(
  page: Page,
  request: APIRequestContext,
  postSignedWebhook: (payload: unknown) => Promise<import('@playwright/test').APIResponse>,
  packId: CreditPackId = 'pack_200',
) {
  const userId = requireEnv('E2E_CLERK_USER_ID');
  const pack = CREDIT_PACKS.find((p) => p.id === packId)!;
  const token = await clerkBearerToken(page);

  const checkoutRes = await request.post(`${API_URL}/payments/checkout`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: { packId },
  });
  expect(checkoutRes.ok(), `checkout failed: ${checkoutRes.status()}`).toBeTruthy();
  const { sessionId } = (await checkoutRes.json()) as { sessionId: string };

  const paymentId = `pay_e2e_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const payload = {
    type: 'payment.succeeded',
    timestamp: new Date().toISOString(),
    business_id: 'biz_e2e',
    data: {
      payment_id: paymentId,
      total_amount: pack.priceMinor,
      currency: pack.currency,
      checkout_session_id: sessionId,
      payment_method: 'card',
      metadata: { userId, packId: pack.id },
    },
  };

  const webhookRes = await postSignedWebhook(payload);
  expect(webhookRes.ok(), `webhook failed: ${webhookRes.status()}`).toBeTruthy();

  return {
    paymentId,
    description: pack.description,
    amountDisplay: `₹${(pack.priceMinor / 100).toFixed(2)}`,
  };
}

function userFetchPattern() {
  const userId = requireEnv('E2E_CLERK_USER_ID');
  return `**/users/${userId}**`;
}

async function interceptUserPayments(page: Page, transform: (payments: unknown[]) => unknown[]) {
  await page.route(userFetchPattern(), async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    const body = (await response.json()) as { payments?: unknown[] };
    const payments = transform(body.payments ?? []);
    await route.fulfill({
      response,
      json: { ...body, payments },
    });
  });
}

function paymentWithProviderId(payments: unknown[], providerPaymentId: string) {
  return payments.find(
    (row) =>
      typeof row === 'object' &&
      row !== null &&
      (row as { providerPaymentId?: string }).providerPaymentId === providerPaymentId,
  );
}

async function openProfilePayments(page: Page) {
  await Promise.all([page.waitForResponse(USER_PROFILE_URL), page.goto('/profile?tab=payments')]);
  await expect(page.getByRole('heading', { name: 'Receipts' })).toBeVisible();
}

test('@high Dodo and legacy Razorpay-shaped rows both render in Profile -> Payments', async ({
  page,
  request,
  postSignedWebhook,
}) => {
  const dodo = await createDodoPaymentViaApi(page, request, postSignedWebhook);

  await interceptUserPayments(page, (payments) => {
    const row = paymentWithProviderId(payments, dodo.paymentId);
    return row ? [row, LEGACY_PAYMENT_ROW] : [LEGACY_PAYMENT_ROW];
  });
  await openProfilePayments(page);

  await expect(page.getByRole('cell', { name: dodo.description })).toHaveCount(1);
  await expect(page.getByRole('cell', { name: LEGACY_PAYMENT_ROW.description })).toHaveCount(1);
  await expect(page.getByRole('cell', { name: dodo.amountDisplay })).toHaveCount(1);
});

test('@medium Empty state when the user has no payments', async ({ page }) => {
  await interceptUserPayments(page, () => []);
  await openProfilePayments(page);

  await expect(page.getByText('No receipts yet')).toBeVisible();
  await expect(page.getByText('Credit purchases will appear here.')).toBeVisible();
});

test('@medium Payment rows persist after reload', async ({ page, request, postSignedWebhook }) => {
  const dodo = await createDodoPaymentViaApi(page, request, postSignedWebhook, 'pack_960');

  await interceptUserPayments(page, (payments) => {
    const row = paymentWithProviderId(payments, dodo.paymentId);
    return row ? [row] : [];
  });
  await openProfilePayments(page);
  await expect(page.getByRole('cell', { name: dodo.description })).toHaveCount(1);

  await Promise.all([page.waitForResponse(USER_PROFILE_URL), page.reload()]);
  await expect(page.getByRole('heading', { name: 'Receipts' })).toBeVisible();
  await expect(page.getByRole('cell', { name: dodo.description })).toHaveCount(1);
});

test('@medium Deep link opens Profile -> Payments directly', async ({ page }) => {
  await Promise.all([page.waitForResponse(USER_PROFILE_URL), page.goto('/profile?tab=payments')]);

  const paymentsTab = page.getByRole('tab', { name: 'Payments' });
  await expect(paymentsTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: 'Receipts' })).toBeVisible();
});
