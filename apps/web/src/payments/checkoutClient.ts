import { useFetch } from '@/composables/useFetch';
import { createLogger } from '@/utils/logger';

const log = createLogger('checkout-client');

export type CheckoutSessionStatus = 'pending' | 'succeeded' | 'failed';

export class CheckoutClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckoutClientError';
  }
}

export type CheckoutSessionResponse = {
  checkoutUrl: string;
  sessionId: string;
};

export type CheckoutStatusResponse = {
  status: CheckoutSessionStatus;
  credits?: number;
};

export async function createCheckoutSession(packId: string): Promise<CheckoutSessionResponse> {
  const { error, data, response } = await useFetch('/payments/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packId }),
  }).json<CheckoutSessionResponse>();

  if (error.value || !response.value?.ok) {
    log.error('createCheckoutSession failed', {
      error: error.value,
      status: response.value?.status,
    });
    throw new CheckoutClientError('Could not start checkout');
  }

  const payload = data.value;
  if (!payload?.checkoutUrl || !payload?.sessionId) {
    throw new CheckoutClientError('Invalid checkout response');
  }

  return payload;
}

export async function fetchCheckoutStatus(sessionId: string): Promise<CheckoutStatusResponse> {
  const { error, data, response } = await useFetch(
    `/payments/checkout/${encodeURIComponent(sessionId)}/status`,
    { method: 'GET' },
  ).json<CheckoutStatusResponse>();

  if (error.value || !response.value?.ok) {
    log.error('fetchCheckoutStatus failed', {
      error: error.value,
      status: response.value?.status,
      sessionId,
    });
    throw new CheckoutClientError('Could not read payment status');
  }

  const payload = data.value;
  if (!payload?.status) {
    throw new CheckoutClientError('Invalid status response');
  }

  return payload;
}
