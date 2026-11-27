import { z } from 'zod';

import { MODEL_REGISTRY } from './registry.js';
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

/**
 * Whether a model needs an active Pro subscription. Only premium-tier generation
 * models are gated; premium utilities (e.g. Topaz, Clarity upscalers) stay open.
 * Pack credits never unlock these. Unknown keys return false so callers can fall
 * through to their own validation.
 */
export function requiresPro(modelKey: string): boolean {
  const model = MODEL_REGISTRY[modelKey as ModelKey];
  if (!model) return false;
  return model.tier === 'premium' && !model.utility;
}

/** Pro-gated model keys in registry order, derived from `requiresPro`. */
export const PREMIUM_MODEL_KEYS: readonly ModelKey[] = (
  Object.keys(MODEL_REGISTRY) as ModelKey[]
).filter(requiresPro);

/** BullMQ priority: lower number is served sooner. */
export const QUEUE_PRIORITY = { PRO: 1, FREE: 10 } as const;
