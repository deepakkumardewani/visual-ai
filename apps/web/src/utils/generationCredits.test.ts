import { describe, expect, it } from 'vitest';

import {
  canAffordGeneration,
  getGenerationCreditBreakdown,
  getGenerationCreditCost,
  getTierCreditLabel,
  getTransformCreditCost,
} from '@/utils/generationCredits';

describe('getGenerationCreditBreakdown', () => {
  it('uses one credit per image by default', () => {
    expect(getGenerationCreditBreakdown(3)).toEqual({
      baseCostPerImage: 1,
      imageCount: 3,
      qualityMultiplier: 1,
      total: 3,
    });
  });

  it('clamps image count and total to at least 1', () => {
    expect(getGenerationCreditBreakdown(0).imageCount).toBe(1);
    expect(getGenerationCreditBreakdown(0).total).toBe(1);
    expect(getGenerationCreditBreakdown(-4).imageCount).toBe(1);
  });

  it('applies custom base cost and quality, rounding up', () => {
    expect(
      getGenerationCreditBreakdown(2, { baseCostPerImage: 1.2, qualityMultiplier: 1.5 }),
    ).toEqual({
      baseCostPerImage: 1.2,
      imageCount: 2,
      qualityMultiplier: 1.5,
      total: 4,
    });
  });
});

describe('getGenerationCreditCost', () => {
  it('returns the breakdown total', () => {
    expect(getGenerationCreditCost(4)).toBe(4);
    expect(getGenerationCreditCost(2, 5)).toBe(10);
  });
});

describe('canAffordGeneration', () => {
  it('is true when balance covers the run', () => {
    expect(canAffordGeneration(5, 4)).toBe(true);
    expect(canAffordGeneration(4, 4)).toBe(true);
  });

  it('is false when balance is short', () => {
    expect(canAffordGeneration(3, 4)).toBe(false);
    expect(canAffordGeneration(0, 1)).toBe(false);
  });

  it('uses the model base cost when provided', () => {
    expect(canAffordGeneration(7, 2, 4)).toBe(false);
    expect(canAffordGeneration(8, 2, 4)).toBe(true);
  });
});

describe('getTransformCreditCost', () => {
  it.each([
    ['upscale', 4],
    ['colorize', 1],
    ['revive', 2],
    ['remove_bg', 1],
  ] as const)('prices %s by the model it runs (%i credits)', (action, cost) => {
    expect(getTransformCreditCost(action)).toBe(cost);
  });

  it('returns the cheapest studio-tool cost without an action', () => {
    expect(getTransformCreditCost()).toBe(1);
  });
});

describe('getTierCreditLabel', () => {
  it('labels each tier with its cheapest generation model', () => {
    expect(getTierCreditLabel('budget')).toBe('1 cr');
    expect(getTierCreditLabel('standard')).toBe('3 cr');
    expect(getTierCreditLabel('premium')).toBe('6 cr');
  });
});
