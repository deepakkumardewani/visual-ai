export const PAYMENT_POLL_INTERVAL_MS = 2000;
export const PAYMENT_POLL_TIMEOUT_MS = 60_000;

export const PAYMENT_TOAST = {
  SUCCESS: 'Payment successful — credits updated.',
  FAILED: 'Payment failed. Please try again.',
  PROCESSING: 'Payment processing — credits will appear shortly after confirmation.',
  CHECKOUT_UNAVAILABLE: 'Checkout is unavailable right now. Please try again.',
  SUBSCRIBED: 'Welcome to Pro! Your perks are active.',
  ALREADY_PRO: "You're already on Pro. Manage your subscription from your profile.",
  SUBSCRIPTION_PROCESSING:
    'Subscription processing — Pro will activate shortly after confirmation.',
} as const;

export const HTTP_CONFLICT = 409;
