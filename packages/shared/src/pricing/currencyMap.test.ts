import { describe, it, expect } from 'vitest';
import {
  CURRENCY_MINOR_DIGITS,
  FALLBACK_CURRENCY,
  isSupportedCurrency,
  normalizeCountryCode,
} from './currencyMap.js';

describe('normalizeCountryCode', () => {
  it('upper-cases and trims a valid code', () => {
    expect(normalizeCountryCode(' in ')).toBe('IN');
  });

  it.each([undefined, null, '', '   ', 'USA', 'U', '12', 'U1'])(
    'returns undefined for %j',
    (raw) => {
      expect(normalizeCountryCode(raw)).toBeUndefined();
    },
  );
});

describe('FALLBACK_CURRENCY', () => {
  it('is USD', () => {
    expect(FALLBACK_CURRENCY).toBe('USD');
  });
});

describe('isSupportedCurrency', () => {
  it('accepts supported codes', () => {
    expect(isSupportedCurrency('EUR')).toBe(true);
    expect(isSupportedCurrency('JPY')).toBe(true);
  });

  it.each(['XYZ', 'eur', '', 'toString', 'constructor'])('rejects %j', (code) => {
    expect(isSupportedCurrency(code)).toBe(false);
  });

  it('knows zero-decimal currencies', () => {
    expect(CURRENCY_MINOR_DIGITS.JPY).toBe(0);
    expect(CURRENCY_MINOR_DIGITS.USD).toBe(2);
  });
});
