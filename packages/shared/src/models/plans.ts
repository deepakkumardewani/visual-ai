import { z } from 'zod';

import type { ModelKey } from './types.js';

export const PLAN = { FREE: 'free', PRO: 'pro' } as const;

export type Plan = (typeof PLAN)[keyof typeof PLAN];

export const PlanSchema = z.enum([PLAN.FREE, PLAN.PRO]);

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;

export const SubscriptionStatus = z.enum([
  SUBSCRIPTION_STATUS.ACTIVE,
  SUBSCRIPTION_STATUS.PAST_DUE,
  SUBSCRIPTION_STATUS.CANCELLED,
  SUBSCRIPTION_STATUS.EXPIRED,
]);

export type SubscriptionStatus = z.infer<typeof SubscriptionStatus>;

export const HISTORY_CAP = { [PLAN.FREE]: 100, [PLAN.PRO]: 500 } as const;

export const PRO_PRICE_USD_MONTHLY = 5;

/** Explicit list (not derived from price) so registry price edits never silently change the gate. */
export const PREMIUM_MODEL_KEYS: readonly ModelKey[] = [
  'NANO_BANANA_PRO',
  'GPT_IMAGE_2',
  'FLUX_2_MAX',
];

/** BullMQ priority: lower number is served sooner. */
export const QUEUE_PRIORITY = { PRO: 1, FREE: 10 } as const;
