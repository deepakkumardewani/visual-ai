import { MAJOR_BASE } from './convert.js';
import { CURRENCY_MINOR_DIGITS, type SupportedCurrency } from './currencyMap.js';

/** Formats a minor-unit amount for display in the given locale (browser default when omitted). */
export function formatPrice(
  amountMinor: number,
  currency: SupportedCurrency,
  locale?: string,
): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
    amountMinor / MAJOR_BASE ** CURRENCY_MINOR_DIGITS[currency],
  );
}
