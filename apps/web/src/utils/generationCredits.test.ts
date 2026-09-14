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
  it('returns the flat utility cost', () => {
    expect(getTransformCreditCost()).toBe(2);
  });
});

describe('getTierCreditLabel', () => {
  it('labels budget and standard as 1 cr', () => {
    expect(getTierCreditLabel('budget')).toBe('1 cr');
    expect(getTierCreditLabel('standard')).toBe('1 cr');
  });

  it('labels premium as 4 cr', () => {
    expect(getTierCreditLabel('premium')).toBe('4 cr');
  });
});
