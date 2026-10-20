import { createHmac, randomUUID } from 'node:crypto';

export type SignedWebhookHeaders = {
  'webhook-id': string;
  'webhook-timestamp': string;
  'webhook-signature': string;
};

/**
 * Standard Webhooks signing for Dodo payment webhooks.
 * Algorithm per SPEC_dodo_payments.md Q6 / PLAN T0.3-item4:
 * HMAC-SHA256 of "{id}.{timestamp}.{body}" with the base64 key after the `whsec_` prefix;
 * `webhook-signature` header value is `v1,` + base64 digest.
 * @see https://docs.dodopayments.com/developer-resources/webhooks
 */
export function signWebhook({
  body,
  secret,
  id = randomUUID(),
  timestamp = Math.floor(Date.now() / 1000).toString(),
}: {
  body: string;
  secret: string;
  id?: string;
  timestamp?: string;
}): SignedWebhookHeaders {
  if (!secret.startsWith('whsec_')) {
    throw new Error(
      '[e2e] DODO_PAYMENTS_WEBHOOK_KEY must be a Standard Webhooks secret (whsec_…).',
    );
  }

  const key = Buffer.from(secret.slice('whsec_'.length), 'base64');
  const signedContent = `${id}.${timestamp}.${body}`;
  const digest = createHmac('sha256', key).update(signedContent, 'utf8').digest('base64');

  return {
    'webhook-id': id,
    'webhook-timestamp': timestamp,
    'webhook-signature': `v1,${digest}`,
  };
}
