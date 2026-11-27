import { describe, it, expect } from 'vitest';
import {
  DAILY_CREDITS,
  DAILY_RESET_UTC_HOUR,
  MIN_CREDIT_COST,
  REFERRAL_BONUS,
  SIGNUP_CREDITS,
  USD_PER_CREDIT,
  creditsForPrice,
  formatCreditRange,
  getCategoryCreditRange,
  getCreditCategory,
  getCreditCost,
  getCreditCostRange,
  getDailyCredits,
  getModelKeysByCategory,
} from './credits.js';
import { MODEL_REGISTRY } from './registry.js';
import type { ModelKey } from './types.js';

/** Expected per-run cost at USD_PER_CREDIT = $0.005 (ceil(price / 0.005), min 1). */
const GENERATION_COSTS: ReadonlyArray<readonly [ModelKey, number]> = [
  ['FLUX_QUICK', 1],
  ['FLUX_FAST', 1],
  ['P_IMAGE', 1],
  ['FLUX_BASIC', 3],
  ['FLUX_2_DEV', 3],
  ['FLUX_2_PRO', 3],
  ['Z_IMAGE_TURBO', 4],
  ['GROK_IMAGINE', 4],
  ['SEEDREAM_4', 6],
  ['FLUX_REALISM', 6],
  ['FLUX_PRO', 8],
  ['FLUX_1_1_PRO', 8],
  ['FLUX_KONTEXT_PRO', 8],
  ['IMAGEN_4_ULTRA', 12],
  ['NANO_BANANA_2', 14],
  ['GROK_IMAGINE_QUALITY', 14],
  ['FLUX_KONTEXT_MAX', 16],
  ['FLUX_2_MAX', 24],
  ['GPT_IMAGE_2', 26],
  ['NANO_BANANA_PRO', 30],
];

const UTILITY_COSTS: ReadonlyArray<readonly [ModelKey, number]> = [
  ['COLORIZE_ADVANCED', 1],
  ['BACKGROUND_REMOVER', 1],
  ['REVIVE', 2],
  ['OLD_PHOTOS', 2],
  ['COLORIZE_BASIC', 8],
  ['UPSCALE_REAL_ESRGAN', 1],
  ['UPSCALE_PRUNA', 1],
  ['UPSCALE_RECRAFT', 2],
  ['UPSCALE_IMAGE', 4],
  ['UPSCALE_GOOGLE', 6],
  ['UPSCALE_CLARITY_PRO', 6],
  ['UPSCALE_TOPAZ', 16],
];

describe('getCreditCost', () => {
  it.each(GENERATION_COSTS)('generation model %s costs %i credits', (key, cost) => {
    expect(getCreditCost(key)).toBe(cost);
  });

  it.each(UTILITY_COSTS)('utility model %s costs %i credits', (key, cost) => {
    expect(getCreditCost(key)).toBe(cost);
  });

  it('covers every registry model in the tables above', () => {
    const tested = new Set([...GENERATION_COSTS, ...UTILITY_COSTS].map(([key]) => key));
    expect([...tested].sort()).toEqual(Object.keys(MODEL_REGISTRY).sort());
  });

  it('throws for a key missing from the registry', () => {
    expect(() => getCreditCost('NOT_A_MODEL' as ModelKey)).toThrow(
      'Unknown model key: NOT_A_MODEL',
    );
  });
});

describe('creditsForPrice', () => {
  it('uses a $0.005 credit unit', () => {
    expect(USD_PER_CREDIT).toBe(0.005);
  });

  it.each([
    [0.07, 14],
    [0.067, 14],
    [0.128, 26],
    [0.015, 3],
    [0.005, 1],
    [0.0051, 2],
  ])('charges $%d at %i credits without float drift', (price, credits) => {
    expect(creditsForPrice(price)).toBe(credits);
  });

  it('never charges less than the minimum', () => {
    expect(creditsForPrice(0)).toBe(MIN_CREDIT_COST);
    expect(creditsForPrice(0.0001)).toBe(MIN_CREDIT_COST);
  });

  it.each([-0.01, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid price %d', (price) => {
    expect(() => creditsForPrice(price)).toThrow('Invalid model price');
  });
});

describe('credit categories and ranges', () => {
  it('splits the registry into generation, utility and upscale groups', () => {
    expect(getCreditCategory(MODEL_REGISTRY.FLUX_QUICK)).toBe('generation');
    expect(getCreditCategory(MODEL_REGISTRY.REVIVE)).toBe('utility');
    expect(getCreditCategory(MODEL_REGISTRY.UPSCALE_TOPAZ)).toBe('upscale');
    expect(getModelKeysByCategory('generation')).toHaveLength(GENERATION_COSTS.length);
  });

  it('derives each category range from the registry', () => {
    expect(getCategoryCreditRange('generation')).toEqual({ min: 1, max: 30 });
    expect(getCategoryCreditRange('utility')).toEqual({ min: 1, max: 8 });
    expect(getCategoryCreditRange('upscale')).toEqual({ min: 1, max: 16 });
  });

  it('throws for an empty model list', () => {
    expect(() => getCreditCostRange([])).toThrow('zero models');
  });

  it('formats a range, collapsing equal bounds', () => {
    expect(formatCreditRange({ min: 1, max: 30 })).toBe('1–30');
    expect(formatCreditRange({ min: 2, max: 2 })).toBe('2');
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
