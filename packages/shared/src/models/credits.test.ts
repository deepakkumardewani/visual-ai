import { describe, it, expect } from 'vitest';
import {
  DAILY_CREDITS,
  DAILY_RESET_UTC_HOUR,
  PREMIUM_CREDIT_COST,
  REFERRAL_BONUS,
  SIGNUP_CREDITS,
  getCreditCost,
  getDailyCredits,
} from './credits.js';
import { PREMIUM_MODEL_KEYS } from './plans.js';
import type { ModelKey } from './types.js';

const COST_TABLE: ReadonlyArray<readonly [ModelKey, number, boolean]> = [
  ['FLUX_QUICK', 1, false],
  ['NANO_BANANA_2', 1, false],
  ['BACKGROUND_REMOVER', 2, false],
  ['UPSCALE_TOPAZ', 4, false],
  ['FLUX_REALISM', 5, true],
  ['FLUX_KONTEXT_PRO', 5, true],
  ['FLUX_KONTEXT_MAX', 5, true],
  ['IMAGEN_4_ULTRA', 5, true],
  ['NANO_BANANA_PRO', 5, true],
  ['GPT_IMAGE_2', 5, true],
  ['FLUX_2_PRO', 5, false],
  ['FLUX_1_1_PRO', 5, false],
  ['FLUX_2_MAX', 5, false],
  ['FLUX_PRO', 5, false],
];

describe('getCreditCost', () => {
  it.each(COST_TABLE)('%s costs %i credits (premium: %s)', (key, cost, isPremium) => {
    expect(getCreditCost(key)).toBe(cost);
    expect(PREMIUM_MODEL_KEYS.includes(key)).toBe(isPremium);
  });

  it('throws for a key missing from the registry', () => {
    expect(() => getCreditCost('NOT_A_MODEL' as ModelKey)).toThrow(
      'Unknown model key: NOT_A_MODEL',
    );
  });

  it('prices every premium model at the premium cost', () => {
    expect(PREMIUM_MODEL_KEYS).toHaveLength(6);
    for (const key of PREMIUM_MODEL_KEYS) {
      expect(getCreditCost(key)).toBe(5);
    }
    expect(PREMIUM_CREDIT_COST).toBe(5);
  });
});

describe('getDailyCredits', () => {
  it('gives pro users 50', () => {
    expect(getDailyCredits(true)).toBe(50);
  });

  it('gives free users 30', () => {
    expect(getDailyCredits(false)).toBe(30);
  });

  it('exposes the per-plan table', () => {
    expect(DAILY_CREDITS).toEqual({ free: 30, pro: 50 });
  });
});

describe('credit constants', () => {
  it('uses 30 signup and referral credits and a midnight UTC reset', () => {
    expect(SIGNUP_CREDITS).toBe(30);
    expect(REFERRAL_BONUS).toBe(30);
    expect(DAILY_RESET_UTC_HOUR).toBe(0);
  });
});
