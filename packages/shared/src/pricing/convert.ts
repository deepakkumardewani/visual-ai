import {
  CURRENCY_MINOR_DIGITS,
  FALLBACK_CURRENCY,
  isSupportedCurrency,
  type SupportedCurrency,
} from './currencyMap.js';

/** Units of each currency per 1 USD. */
export type FxRates = Readonly<Record<string, number>>;

/** Base used to turn a currency's minor-unit digits into a divisor. */
export const MAJOR_BASE = 10;

function rateFor(rates: FxRates, currency: SupportedCurrency): number | undefined {
  if (currency === FALLBACK_CURRENCY) return 1;
  const rate = rates[currency];
  return Number.isFinite(rate) && rate > 0 ? rate : undefined;
}

/**
 * Converts a minor-unit amount between supported currencies via the USD-based table.
 * Returns undefined when either currency is unsupported or has no usable rate.
 */
export function convertMinor(
  amountMinor: number,
  from: string,
  to: string,
  rates: FxRates,
): number | undefined {
  if (!isSupportedCurrency(from) || !isSupportedCurrency(to)) return undefined;
  const fromRate = rateFor(rates, from);
  const toRate = rateFor(rates, to);
  if (fromRate === undefined || toRate === undefined) return undefined;

  const major = amountMinor / MAJOR_BASE ** CURRENCY_MINOR_DIGITS[from];
  const converted = (major / fromRate) * toRate;
  return Math.round(converted * MAJOR_BASE ** CURRENCY_MINOR_DIGITS[to]);
}
