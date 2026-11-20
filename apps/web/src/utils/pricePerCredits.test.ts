import { describe, expect, it } from 'vitest';

import {
  estimateImages,
  formatImageEstimate,
  formatPricePer100Credits,
  PRICE_BASIS_CREDITS,
} from '@/utils/pricePerCredits';

describe('formatPricePer100Credits', () => {
  it('uses 100 credits as the price basis', () => {
    expect(PRICE_BASIS_CREDITS).toBe(100);
  });

  // Pack credit sizes match CREDIT_PACKS (200/450/960/2000). INR amounts are the real
  // pack prices; USD and JPY amounts are representative localized prices of the same packs.
  it.each([
    { credits: 200, minor: 150, expected: '$0.75' },
    { credits: 450, minor: 340, expected: '$0.76' },
    { credits: 960, minor: 590, expected: '$0.61' },
    { credits: 2000, minor: 1060, expected: '$0.53' },
  ])('formats the USD $credits-credit pack per 100 credits', ({ minor, credits, expected }) => {
    expect(formatPricePer100Credits(minor, credits, 'USD')).toBe(expected);
  });

  it.each([
    { credits: 200, minor: 13_000, expected: '₹65.00' },
    { credits: 450, minor: 29_000, expected: '₹64.44' },
    { credits: 960, minor: 50_000, expected: '₹52.08' },
    { credits: 2000, minor: 90_000, expected: '₹45.00' },
  ])('formats the INR $credits-credit pack per 100 credits', ({ minor, credits, expected }) => {
    expect(formatPricePer100Credits(minor, credits, 'INR')).toBe(expected);
  });

  it.each([
    { credits: 200, minor: 230, expected: /^(JP)?¥115$/ },
    { credits: 450, minor: 520, expected: /^(JP)?¥116$/ },
    { credits: 960, minor: 880, expected: /^(JP)?¥92$/ },
    { credits: 2000, minor: 1580, expected: /^(JP)?¥79$/ },
  ])(
    'rounds the JPY $credits-credit pack to a whole non-zero yen per 100 credits',
    ({ minor, credits, expected }) => {
      expect(formatPricePer100Credits(minor, credits, 'JPY')).toMatch(expected);
    },
  );

  it('never shows $0.00 for the largest pack even when the per-credit cost is under a cent', () => {
    const result = formatPricePer100Credits(900, 2000, 'USD');
    expect(result).toBe('$0.45');
    expect(result).not.toBe('$0.00');
  });

  it('rounds fractional minor units to the nearest whole minor unit', () => {
    // 101 cents / 300 credits * 100 = 33.67 cents -> 34 cents
    expect(formatPricePer100Credits(101, 300, 'USD')).toBe('$0.34');
  });
});

describe('estimateImages', () => {
  it('buys one image per credit at the cheapest price and one per 5 credits at premium', () => {
    expect(estimateImages(200)).toEqual({ budgetImages: 200, premiumImages: 40 });
    expect(estimateImages(2000)).toEqual({ budgetImages: 2000, premiumImages: 400 });
  });

  it('floors partial premium images', () => {
    expect(estimateImages(7)).toEqual({ budgetImages: 7, premiumImages: 1 });
  });

  it('returns zero images for zero credits', () => {
    expect(estimateImages(0)).toEqual({ budgetImages: 0, premiumImages: 0 });
  });
});

describe('formatImageEstimate', () => {
  it('renders the estimate sentence', () => {
    expect(formatImageEstimate(500)).toBe('≈ 500 images at 1 credit / 100 at 5 credits');
  });
});
