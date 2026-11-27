import { normalizeCountryCode } from '../pricing/currencyMap.js';

/** Currencies packs are sold in: India pays INR, everyone else pays USD. */
export const PACK_CURRENCIES = ['USD', 'INR'] as const;
export type PackCurrency = (typeof PACK_CURRENCIES)[number];

export const DEFAULT_PACK_CURRENCY: PackCurrency = 'USD';
const INR_COUNTRY = 'IN';

export type CreditPackId = 'pack_300' | 'pack_700' | 'pack_1600' | 'pack_4500';

export interface CreditPack {
  id: CreditPackId;
  credits: number;
  /** Fixed price per currency in minor units (cents, paise); never FX-converted. */
  prices: Readonly<Record<PackCurrency, number>>;
  /** The one pack highlighted as "Most popular" wherever packs are listed. */
  popular: boolean;
  description: string;
}

export const CREDIT_PACKS: readonly CreditPack[] = [
  {
    id: 'pack_300',
    credits: 300,
    prices: { USD: 500, INR: 24_900 },
    popular: false,
    description: '300 credits',
  },
  {
    id: 'pack_700',
    credits: 700,
    prices: { USD: 1_000, INR: 54_900 },
    popular: false,
    description: '700 credits',
  },
  {
    id: 'pack_1600',
    credits: 1600,
    prices: { USD: 2_000, INR: 114_900 },
    popular: true,
    description: '1,600 credits',
  },
  {
    id: 'pack_4500',
    credits: 4500,
    prices: { USD: 5_000, INR: 299_900 },
    popular: false,
    description: '4,500 credits',
  },
] as const;

const PERCENT = 100;

export function getCreditPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((pack) => pack.id === id);
}

export function isPackCurrency(code: string): code is PackCurrency {
  return (PACK_CURRENCIES as readonly string[]).includes(code);
}

/** India (by ISO country) pays INR; every other or unknown country pays USD. */
export function packCurrencyForCountry(raw: string | null | undefined): PackCurrency {
  return normalizeCountryCode(raw) === INR_COUNTRY ? 'INR' : DEFAULT_PACK_CURRENCY;
}

/** The pack with the lowest credit count: the per-credit baseline savings are measured against. */
function baselinePack(packs: readonly CreditPack[]): CreditPack | undefined {
  return packs.reduce<CreditPack | undefined>(
    (smallest, pack) => (!smallest || pack.credits < smallest.credits ? pack : smallest),
    undefined,
  );
}

/**
 * Whole-percent saving of `pack` per credit versus the smallest pack, in `currency`, rounded down.
 * Cross-multiplied integers keep exact ratios (e.g. 25%) from flooring to 24 through float error.
 */
export function computePackSavingsPercent(
  pack: CreditPack,
  currency: PackCurrency,
  packs: readonly CreditPack[] = CREDIT_PACKS,
): number {
  const baseline = baselinePack(packs);
  if (!baseline) return 0;
  const baselineCost = baseline.prices[currency] * pack.credits;
  const packCost = pack.prices[currency] * baseline.credits;
  if (baselineCost <= 0 || packCost >= baselineCost) return 0;
  return Math.floor((PERCENT * (baselineCost - packCost)) / baselineCost);
}

/** Highest saving any pack offers in `currency`. */
export function maxPackSavingsPercent(
  currency: PackCurrency,
  packs: readonly CreditPack[] = CREDIT_PACKS,
): number {
  return Math.max(0, ...packs.map((pack) => computePackSavingsPercent(pack, currency, packs)));
}
