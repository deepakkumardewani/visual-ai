import type { Tier } from './types.js';

/**
 * Credit cost multiplier per tier for generation and utility models.
 * Base unit: 1 credit per standard-tier image.
 * Budget tier: 1 credit per 2 images (0.5x cost)
 * Premium tier: 1 credit per 6 images for users, 1 credit per 2 for pro (2x cost)
 */
export const TIER_CREDIT_COST: Record<Tier, Record<'free' | 'pro', number>> = {
  budget: {
    free: 1 / 2,
    pro: 1,
  },
  standard: {
    free: 1 / 3,
    pro: 1,
  },
  premium: {
    free: 1 / 6,
    pro: 2,
  },
};
