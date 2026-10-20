import { randomUUID } from 'node:crypto';

import type { APIResponse, Page } from '@playwright/test';

import { CREDIT_PACKS, getCreditPack, type CreditPackId } from '@visual-ai/shared';

import { test, expect } from '../fixtures/qa';
import { API_URL, requireEnv } from '../support/env';
import { signWebhook } from '../support/signWebhook';
import { PAYMENT_TOAST } from '../../src/payments/constants';

const USER_PROFILE_URL = /\/users\/user_/;
const E2E_USER_ID = requireEnv('E2E_CLERK_USER_ID');

const E2E_DODO_INIT = `
window.__VISUAL_AI_E2E_DODO__ = {
  enabled: true,
  openCalls: [],
  pendingResolve: null,
  closeOverlay(reason = 'closed') {
    this.pendingResolve?.(reason);
    this.pendingResolve = null;
  },
};
`;

async function installBillingMocks(page: Page) {
  await page.addInitScript(E2E_DODO_INIT);
  await page.route('**/checkouts/**', (route) => route.abort());
}

async function gotoStudio(page: Page) {
  // Hard navigation resets module-level purchase/poll state between tests.
  await page.goto('about:blank');
  await Promise.all([page.waitForResponse(USER_PROFILE_URL), page.goto('/create/image')]);
  await expect(page.getByTestId('composer-textarea-input')).toBeVisible();
}

async function settleOpenCheckout(page: Page) {
  await page.clock.install();
  await closeE2eOverlay(page);
  await page.clock.fastForward(65_000);
  await expect(
    page.getByRole('status').filter({ hasText: PAYMENT_TOAST.PROCESSING }),
  ).toBeVisible();
}

async function readPaidCredits(page: Page): Promise<number> {
  const title = (await page.getByTestId('credits-chip').getAttribute('title')) ?? '';
  const paidMatch = title.match(/(\d+)\s+credits\s*$/m);
  return Number.parseInt(paidMatch?.[1] ?? '0', 10);
}

async function refreshPaidCredits(page: Page): Promise<number> {
  await Promise.all([page.waitForResponse(USER_PROFILE_URL), page.reload()]);
  await expect(page.getByTestId('composer-textarea-input')).toBeVisible();
  return readPaidCredits(page);
}

function packRadio(page: Page, packId: CreditPackId) {
  const index = CREDIT_PACKS.findIndex((pack) => pack.id === packId);
  if (index < 0) throw new Error(`Unknown pack ${packId}`);
  return buyCreditsDialog(page)
    .getByRole('radiogroup', { name: 'Credit packages' })
    .getByRole('radio')
    .nth(index);
}

function buyCreditsDialog(page: Page) {
  // Dashboard + AppHeader each mount BuyMoreCreditsDialog; both open from the shared store.
  return page.getByRole('dialog', { name: 'Buy more credits' }).last();
}

async function openBuyCreditsDialog(page: Page) {
  await page.getByTestId('credits-chip').click();
  await page.getByRole('button', { name: 'Buy Credits' }).click();
  await expect(buyCreditsDialog(page)).toBeVisible();
}

async function closeE2eOverlay(page: Page, reason: 'closed' | 'status' | 'error' = 'closed') {
  await page.evaluate((r) => {
    window.__VISUAL_AI_E2E_DODO__?.closeOverlay(r);
  }, reason);
}

type CheckoutSession = { checkoutUrl: string; sessionId: string };

async function startCheckout(
  page: Page,
  packId: CreditPackId,
): Promise<{ session: CheckoutSession; checkoutResponse: import('@playwright/test').Response }> {
  const pack = getCreditPack(packId);
  if (!pack) throw new Error(`Unknown pack ${packId}`);

  const checkoutResponsePromise = page.waitForResponse(
    (res) => res.url().includes('/payments/checkout') && res.request().method() === 'POST',
  );

  await buyCreditsDialog(page)
    .getByRole('button', { name: `Buy ${pack.credits} credits` })
    .click();

  const checkoutResponse = await checkoutResponsePromise;
  expect(checkoutResponse.ok()).toBeTruthy();
  const session = (await checkoutResponse.json()) as CheckoutSession;
  expect(session.sessionId).toBeTruthy();
  await expect
    .poll(() => page.evaluate(() => window.__VISUAL_AI_E2E_DODO__?.openCalls.length))
    .toBe(1);
  return { session, checkoutResponse };
}

function webhookPayload(
  type: 'payment.succeeded' | 'payment.failed',
  opts: {
    paymentId: string;
    sessionId: string;
    packId: CreditPackId;
    userId?: string;
  },
) {
  const pack = getCreditPack(opts.packId)!;
  return {
    type,
    timestamp: new Date().toISOString(),
    business_id: 'biz_e2e',
    data: {
      payment_id: opts.paymentId,
      total_amount: pack.priceMinor,
      currency: pack.currency,
      checkout_session_id: opts.sessionId,
      payment_method: 'card',
      metadata: { userId: opts.userId ?? E2E_USER_ID, packId: opts.packId },
    },
  };
}

async function waitForCheckoutSucceeded(page: Page, sessionId: string) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const response = await page
      .waitForResponse(
        (res) =>
          res.request().method() === 'GET' &&
          res.url().includes('/payments/checkout/') &&
          res.url().includes(encodeURIComponent(sessionId)) &&
          res.ok(),
        { timeout: 5_000 },
      )
      .catch(() => null);

    if (!response) {
      continue;
    }

    const body = (await response.json()) as { status?: string };
    if (body.status === 'succeeded') {
      return;
    }
    if (body.status === 'failed') {
      throw new Error('Checkout session failed before credits could be granted');
    }
  }

  throw new Error(`Timed out waiting for checkout session ${sessionId} to succeed`);
}

async function postWebhookRaw(
  request: Page['request'],
  payload: unknown,
  webhookId: string,
): Promise<APIResponse> {
  const body = JSON.stringify(payload);
  const secret = requireEnv('DODO_PAYMENTS_WEBHOOK_KEY');
  const headers = signWebhook({ body, secret, id: webhookId });
  return request.post(`${API_URL}/webhooks/payments`, {
    headers: { ...headers, 'Content-Type': 'application/json' },
    data: body,
  });
}

test.describe('Billing purchase', () => {
  // Shared E2E user — purchases and webhooks must not run in parallel (incl. --repeat-each).
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await installBillingMocks(page);
  });

  test('Buy dialog lists the 4 credit packs', { tag: ['@critical'] }, async ({ page }) => {
    await gotoStudio(page);
    await openBuyCreditsDialog(page);

    const dialog = buyCreditsDialog(page);
    const radios = dialog.getByRole('radiogroup', { name: 'Credit packages' }).getByRole('radio');
    await expect(radios).toHaveCount(4);
    for (let i = 0; i < CREDIT_PACKS.length; i += 1) {
      await expect(radios.nth(i)).toContainText(String(CREDIT_PACKS[i]!.credits));
    }
  });

  test('Checkout request sends the pack id only', { tag: ['@critical'] }, async ({ page }) => {
    await gotoStudio(page);
    await openBuyCreditsDialog(page);

    const target = CREDIT_PACKS[2]!;
    await buyCreditsDialog(page)
      .getByRole('radio')
      .filter({ hasText: String(target.credits) })
      .click();

    const checkoutResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/payments/checkout') && res.request().method() === 'POST',
    );

    await buyCreditsDialog(page)
      .getByRole('button', { name: `Buy ${target.credits} credits` })
      .click();
    const checkoutResponse = await checkoutResponsePromise;

    const body = checkoutResponse.request().postDataJSON() as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['packId']);
    expect(body.packId).toBe(target.id);

    await settleOpenCheckout(page);
  });

  test(
    "Signed payment success grants exactly the pack's credits and shows the row in Profile -> Payments",
    { tag: ['@critical'] },
    async ({ page, request }) => {
      const packId: CreditPackId = 'pack_450';
      const pack = getCreditPack(packId)!;
      const paymentId = `pay_e2e_${randomUUID()}`;
      const webhookId = randomUUID();

      await gotoStudio(page);
      const creditsBefore = await refreshPaidCredits(page);

      await openBuyCreditsDialog(page);
      await packRadio(page, packId).click();
      const { session } = await startCheckout(page, packId);

      await closeE2eOverlay(page);

      const payload = webhookPayload('payment.succeeded', {
        paymentId,
        sessionId: session.sessionId,
        packId,
      });
      const whRes = await postWebhookRaw(request, payload, webhookId);
      expect(whRes.status()).toBe(200);
      await waitForCheckoutSucceeded(page, session.sessionId);

      await expect(
        page.getByRole('status').filter({ hasText: PAYMENT_TOAST.SUCCESS }),
      ).toBeVisible();
      await expect(page.getByText('Purchase successful')).toBeVisible();

      await expect
        .poll(async () => readPaidCredits(page), { timeout: 15_000 })
        .toBe(creditsBefore + pack.credits);

      await Promise.all([
        page.waitForResponse(USER_PROFILE_URL),
        page.goto('/profile?tab=payments'),
      ]);
      await expect(page.getByRole('heading', { name: 'Receipts' })).toBeVisible();
      const purchaseRow = page
        .getByRole('row')
        .filter({ hasText: pack.description })
        .filter({ hasText: `₹${(pack.priceMinor / 100).toFixed(2)}` });
      await expect(purchaseRow.first()).toBeVisible();
    },
  );

  test(
    'Duplicate webhook delivery is a no-op',
    { tag: ['@critical'] },
    async ({ page, request }) => {
      const packId: CreditPackId = 'pack_200';
      const pack = getCreditPack(packId)!;
      const paymentId = `pay_e2e_dup_${randomUUID()}`;
      const webhookId = `wh_dup_${randomUUID()}`;

      await gotoStudio(page);
      const creditsBefore = await refreshPaidCredits(page);

      await openBuyCreditsDialog(page);
      const { session } = await startCheckout(page, packId);
      await closeE2eOverlay(page);

      const payload = webhookPayload('payment.succeeded', {
        paymentId,
        sessionId: session.sessionId,
        packId,
      });

      expect((await postWebhookRaw(request, payload, webhookId)).status()).toBe(200);
      await waitForCheckoutSucceeded(page, session.sessionId);
      await expect(
        page.getByRole('status').filter({ hasText: PAYMENT_TOAST.SUCCESS }),
      ).toBeVisible();
      await expect
        .poll(async () => readPaidCredits(page), { timeout: 15_000 })
        .toBe(creditsBefore + pack.credits);

      expect((await postWebhookRaw(request, payload, webhookId)).status()).toBe(200);
      await expect
        .poll(async () => readPaidCredits(page), { timeout: 15_000 })
        .toBe(creditsBefore + pack.credits);
    },
  );

  test(
    'Invalid signature gets 401 and credits are unchanged',
    { tag: ['@high'] },
    async ({ page, request }) => {
      const packId: CreditPackId = 'pack_200';
      const paymentId = `pay_e2e_bad_sig_${randomUUID()}`;

      await gotoStudio(page);
      const creditsBefore = await readPaidCredits(page);

      await openBuyCreditsDialog(page);
      const { session } = await startCheckout(page, packId);
      await settleOpenCheckout(page);

      const payload = webhookPayload('payment.succeeded', {
        paymentId,
        sessionId: session.sessionId,
        packId,
      });
      const body = JSON.stringify(payload);
      const res = await request.post(`${API_URL}/webhooks/payments`, {
        headers: {
          'Content-Type': 'application/json',
          'webhook-id': randomUUID(),
          'webhook-timestamp': Math.floor(Date.now() / 1000).toString(),
          'webhook-signature': 'v1,invalid',
        },
        data: body,
      });
      expect(res.status()).toBe(401);

      await expect.poll(async () => readPaidCredits(page)).toBe(creditsBefore);
    },
  );

  test(
    'Failed payment shows an error and credits are unchanged',
    { tag: ['@high'] },
    async ({ page, request }) => {
      const packId: CreditPackId = 'pack_200';
      const paymentId = `pay_e2e_fail_${randomUUID()}`;

      await gotoStudio(page);
      const creditsBefore = await readPaidCredits(page);

      await openBuyCreditsDialog(page);
      const { session } = await startCheckout(page, packId);
      await closeE2eOverlay(page);

      const payload = webhookPayload('payment.failed', {
        paymentId,
        sessionId: session.sessionId,
        packId,
      });
      expect((await postWebhookRaw(request, payload, randomUUID())).status()).toBe(200);

      await expect(
        page.getByRole('status').filter({ hasText: PAYMENT_TOAST.FAILED }),
      ).toBeVisible();
      await expect.poll(async () => readPaidCredits(page)).toBe(creditsBefore);
    },
  );

  test(
    'Overlay closed then poll timeout shows the processing message',
    { tag: ['@medium'] },
    async ({ page }) => {
      const packId: CreditPackId = 'pack_200';

      await page.clock.install();
      await gotoStudio(page);
      const creditsBefore = await readPaidCredits(page);

      await openBuyCreditsDialog(page);
      const { session } = await startCheckout(page, packId);
      await closeE2eOverlay(page);

      await page.clock.fastForward(65_000);

      await expect(
        page.getByRole('status').filter({ hasText: PAYMENT_TOAST.PROCESSING }),
      ).toBeVisible();
      await expect.poll(async () => readPaidCredits(page)).toBe(creditsBefore);

      void session.sessionId;
    },
  );
});
