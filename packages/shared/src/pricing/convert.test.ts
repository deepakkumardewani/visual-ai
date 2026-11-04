import { describe, it, expect } from 'vitest';
import { convertMinor } from './convert.js';

const RATES = { EUR: 0.5, INR: 80, JPY: 150, BAD: 0 } as const;

describe('convertMinor', () => {
  it('returns the same amount for USD to USD', () => {
    expect(convertMinor(1234, 'USD', 'USD', RATES)).toBe(1234);
  });

  it('converts USD to a two-decimal currency', () => {
    // $10.00 * 80 = 800.00 INR
    expect(convertMinor(1000, 'USD', 'INR', RATES)).toBe(80000);
  });

  it('converts USD to a zero-decimal currency', () => {
    // $10.00 * 150 = 1500 JPY
    expect(convertMinor(1000, 'USD', 'JPY', RATES)).toBe(1500);
  });

  it('converts from a non-USD currency back to USD', () => {
    // 800 INR / 80 = $10.00
    expect(convertMinor(80000, 'INR', 'USD', RATES)).toBe(1000);
  });

  it('converts between two non-USD currencies via USD', () => {
    // 1500 JPY -> $10 -> 5 EUR
    expect(convertMinor(1500, 'JPY', 'EUR', RATES)).toBe(500);
  });

  it('rounds to the nearest minor unit', () => {
    // $0.99 * 0.5 = 0.495 EUR -> 49.5 cents -> 50
    expect(convertMinor(99, 'USD', 'EUR', RATES)).toBe(50);
    // $1.01 * 0.5 = 50.5 cents -> 51 ; $0.01 * 150 = 1.5 JPY -> 2
    expect(convertMinor(1, 'USD', 'JPY', RATES)).toBe(2);
  });

  it('returns 0 for a zero amount', () => {
    expect(convertMinor(0, 'USD', 'EUR', RATES)).toBe(0);
  });

  it('returns undefined for an unsupported source currency', () => {
    expect(convertMinor(100, 'XYZ', 'USD', RATES)).toBeUndefined();
  });

  it('returns undefined for an unsupported target currency', () => {
    expect(convertMinor(100, 'USD', 'XYZ', RATES)).toBeUndefined();
  });

  it('returns undefined when the target rate is missing', () => {
    expect(convertMinor(100, 'USD', 'GBP', RATES)).toBeUndefined();
  });

  it('returns undefined when the source rate is missing', () => {
    expect(convertMinor(100, 'GBP', 'USD', RATES)).toBeUndefined();
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('rejects unusable rate %s', (rate) => {
    expect(convertMinor(100, 'USD', 'EUR', { EUR: rate })).toBeUndefined();
  });

  it('ignores any rate supplied for USD', () => {
    expect(convertMinor(100, 'USD', 'EUR', { USD: 99, EUR: 2 })).toBe(200);
  });
});
