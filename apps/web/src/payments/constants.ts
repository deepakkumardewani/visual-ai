export const PAYMENT_POLL_INTERVAL_MS = 2000;
export const PAYMENT_POLL_TIMEOUT_MS = 60_000;

export const PAYMENT_TOAST = {
  SUCCESS: 'Payment successful — credits updated.',
  FAILED: 'Payment failed. Please try again.',
  PROCESSING: 'Payment processing — credits will appear shortly after confirmation.',
  CHECKOUT_UNAVAILABLE: 'Checkout is unavailable right now. Please try again.',
} as const;
