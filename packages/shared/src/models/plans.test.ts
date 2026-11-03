import { describe, it, expect } from 'vitest';
import {
  PLAN,
  PlanSchema,
  SUBSCRIPTION_STATUS,
  SubscriptionStatus,
  HISTORY_CAP,
  PRO_PRICE_USD_MONTHLY,
  PREMIUM_MODEL_KEYS,
  QUEUE_PRIORITY,
} from './plans.js';
import { MODEL_REGISTRY } from './registry.js';

describe('plan constants', () => {
  it('caps history at 100 for free and 500 for pro', () => {
    expect(HISTORY_CAP).toEqual({ free: 100, pro: 500 });
  });

  it('prices pro at 5 USD monthly', () => {
    expect(PRO_PRICE_USD_MONTHLY).toBe(5);
  });

  it('serves pro jobs ahead of free (lower number first)', () => {
    expect(QUEUE_PRIORITY).toEqual({ PRO: 1, FREE: 10 });
    expect(QUEUE_PRIORITY.PRO).toBeLessThan(QUEUE_PRIORITY.FREE);
  });
});

describe('PREMIUM_MODEL_KEYS', () => {
  it('lists the three premium models', () => {
    expect([...PREMIUM_MODEL_KEYS]).toEqual(['NANO_BANANA_PRO', 'GPT_IMAGE_2', 'FLUX_2_MAX']);
  });

  it.each([...PREMIUM_MODEL_KEYS])('%s exists in the registry', (key) => {
    expect(MODEL_REGISTRY[key]).toBeDefined();
  });

  it('has no duplicates', () => {
    expect(new Set(PREMIUM_MODEL_KEYS).size).toBe(PREMIUM_MODEL_KEYS.length);
  });
});

describe('PlanSchema', () => {
  it.each(['free', 'pro'])('accepts %s', (v) => {
    expect(PlanSchema.parse(v)).toBe(v);
  });

  it('rejects unknown plans', () => {
    expect(PlanSchema.safeParse('enterprise').success).toBe(false);
    expect(PlanSchema.safeParse(undefined).success).toBe(false);
  });

  it('exposes plan values', () => {
    expect(PLAN).toEqual({ FREE: 'free', PRO: 'pro' });
  });
});

describe('SubscriptionStatus', () => {
  it.each(['active', 'past_due', 'cancelled', 'expired'])('accepts %s', (v) => {
    expect(SubscriptionStatus.parse(v)).toBe(v);
  });

  it('rejects unknown status', () => {
    expect(SubscriptionStatus.safeParse('paused').success).toBe(false);
  });

  it('constant values match the schema options', () => {
    expect(Object.values(SUBSCRIPTION_STATUS).sort()).toEqual(
      [...SubscriptionStatus.options].sort(),
    );
  });
});
