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

/** History usage ratio at or above which the "almost full" note appears. */
export const HISTORY_NEAR_FULL_RATIO = 0.9;

export type HistoryFullLevel = 'none' | 'near' | 'full';

export function getHistoryFullLevel(count: number, cap: number): HistoryFullLevel {
  if (!Number.isFinite(count) || !Number.isFinite(cap) || cap <= 0) return 'none';
  if (count >= cap) return 'full';
  if (count >= cap * HISTORY_NEAR_FULL_RATIO) return 'near';
  return 'none';
}

/** Explicit list (not derived from price) so registry price edits never silently change the gate. */
export const PREMIUM_MODEL_KEYS: readonly ModelKey[] = [
  'FLUX_REALISM',
  'FLUX_KONTEXT_PRO',
  'FLUX_KONTEXT_MAX',
  'IMAGEN_4_ULTRA',
  'NANO_BANANA_PRO',
  'GPT_IMAGE_2',
];

/** BullMQ priority: lower number is served sooner. */
export const QUEUE_PRIORITY = { PRO: 1, FREE: 10 } as const;
