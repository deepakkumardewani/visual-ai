import type { APIResponse, Page } from '@playwright/test';

import { API_URL, requireEnv } from './env';
import { signWebhook } from './signWebhook';

const PERIOD_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const EVENT_STEP_MS = 1000;
let sequence = 0;

/** Monotonic event times so the API's lastEventAt guard never drops a fresh event. */
function nextEventTime(): string {
  sequence += 1;
  return new Date(Date.now() + sequence * EVENT_STEP_MS).toISOString();
}

export type SubscriptionWebhookType = 'subscription.active' | 'subscription.renewed';

/** POSTs a signed subscription webhook; pass `timestamp` to replay the exact same event. */
export async function sendSubscriptionWebhook(
  page: Page,
  options: {
    type: SubscriptionWebhookType;
    userId: string;
    subscriptionId: string;
    timestamp?: string;
  },
): Promise<APIResponse> {
  const body = JSON.stringify({
    type: options.type,
    timestamp: options.timestamp ?? nextEventTime(),
    business_id: 'biz_e2e',
    data: {
      subscription_id: options.subscriptionId,
      next_billing_date: new Date(Date.now() + PERIOD_DAYS_MS).toISOString(),
      metadata: { userId: options.userId },
    },
  });
  const headers = signWebhook({ body, secret: requireEnv('DODO_PAYMENTS_WEBHOOK_KEY') });
  return page.request.post(`${API_URL}/webhooks/payments`, {
    headers: { ...headers, 'Content-Type': 'application/json' },
    data: body,
  });
}

/** POSTs a signed `subscription.active` webhook: the only way these specs make a user Pro. */
export function activateProViaWebhook(
  page: Page,
  userId: string,
  subscriptionId: string,
): Promise<APIResponse> {
  return sendSubscriptionWebhook(page, { type: 'subscription.active', userId, subscriptionId });
}

/** Event time to feed back into `sendSubscriptionWebhook` for a replay. */
export const freshEventTime = nextEventTime;
