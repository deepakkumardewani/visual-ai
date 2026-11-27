export const FALLBACK_CURRENCY = 'USD' as const;

/** Minor-unit exponent per supported currency (digits after the decimal point). */
export const CURRENCY_MINOR_DIGITS = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  INR: 2,
  CAD: 2,
  AUD: 2,
  SGD: 2,
  CHF: 2,
  BRL: 2,
  MXN: 2,
  JPY: 0,
  KRW: 0,
} as const;

export type SupportedCurrency = keyof typeof CURRENCY_MINOR_DIGITS;

const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

export function isSupportedCurrency(code: string): code is SupportedCurrency {
  return Object.hasOwn(CURRENCY_MINOR_DIGITS, code);
}

/** Normalizes a geo header value to an upper-case ISO 3166-1 alpha-2 code, or undefined if malformed. */
export function normalizeCountryCode(raw: string | null | undefined): string | undefined {
  const code = raw?.trim().toUpperCase();
  return code && COUNTRY_CODE_PATTERN.test(code) ? code : undefined;
}
