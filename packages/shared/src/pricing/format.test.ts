import { describe, it, expect } from 'vitest';
import { formatPrice } from './format.js';

describe('formatPrice', () => {
  it('formats USD minor units in en-US', () => {
    expect(formatPrice(1999, 'USD', 'en-US')).toBe('$19.99');
  });

  it('keeps two decimals for whole amounts', () => {
    expect(formatPrice(1200, 'USD', 'en-US')).toBe('$12.00');
  });

  it('treats zero-decimal currencies as major units', () => {
    expect(formatPrice(1500, 'JPY', 'en-US')).toBe('¥1,500');
  });

  it('formats per locale conventions', () => {
    expect(formatPrice(1999, 'EUR', 'de-DE')).toBe('19,99 €');
    expect(formatPrice(1999, 'EUR', 'en-US')).toBe('€19.99');
  });

  it('formats INR with the Indian locale', () => {
    expect(formatPrice(123456700, 'INR', 'en-IN')).toBe('₹12,34,567.00');
  });

  it('falls back to the runtime default locale when omitted', () => {
    const expected = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'GBP',
    }).format(5);
    expect(formatPrice(500, 'GBP')).toBe(expected);
  });
});
