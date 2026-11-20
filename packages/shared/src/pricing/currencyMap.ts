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

const EURO_COUNTRIES = [
  'AT',
  'BE',
  'CY',
  'DE',
  'EE',
  'ES',
  'FI',
  'FR',
  'GR',
  'HR',
  'IE',
  'IT',
  'LT',
  'LU',
  'LV',
  'MT',
  'NL',
  'PT',
  'SI',
  'SK',
] as const;

const COUNTRY_TO_CURRENCY: Readonly<Record<string, SupportedCurrency>> = {
  US: 'USD',
  GB: 'GBP',
  IN: 'INR',
  CA: 'CAD',
  AU: 'AUD',
  SG: 'SGD',
  CH: 'CHF',
  BR: 'BRL',
  MX: 'MXN',
  JP: 'JPY',
  KR: 'KRW',
  ...Object.fromEntries(EURO_COUNTRIES.map((country) => [country, 'EUR' as const])),
};

const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

export function isSupportedCurrency(code: string): code is SupportedCurrency {
  return Object.hasOwn(CURRENCY_MINOR_DIGITS, code);
}

/** Normalizes a geo header value to an upper-case ISO 3166-1 alpha-2 code, or undefined if malformed. */
export function normalizeCountryCode(raw: string | null | undefined): string | undefined {
  const code = raw?.trim().toUpperCase();
  return code && COUNTRY_CODE_PATTERN.test(code) ? code : undefined;
}

/** Unknown, missing or malformed country gives USD. */
export function currencyForCountry(raw: string | null | undefined): SupportedCurrency {
  const country = normalizeCountryCode(raw);
  return (country && COUNTRY_TO_CURRENCY[country]) || FALLBACK_CURRENCY;
}
