export const CREDIT_PACK_CURRENCY = 'INR' as const;

export type CreditPackId = 'pack_200' | 'pack_450' | 'pack_960' | 'pack_2000';

export interface CreditPack {
  id: CreditPackId;
  credits: number;
  /** Price in minor units (paise for INR). */
  priceMinor: number;
  currency: typeof CREDIT_PACK_CURRENCY;
  savingsPercent: number;
  description: string;
}

export const CREDIT_PACKS: readonly CreditPack[] = [
  {
    id: 'pack_200',
    credits: 200,
    priceMinor: 13_000,
    currency: CREDIT_PACK_CURRENCY,
    savingsPercent: 0,
    description: '200 credits',
  },
  {
    id: 'pack_450',
    credits: 450,
    priceMinor: 29_000,
    currency: CREDIT_PACK_CURRENCY,
    savingsPercent: 10,
    description: '450 credits',
  },
  {
    id: 'pack_960',
    credits: 960,
    priceMinor: 50_000,
    currency: CREDIT_PACK_CURRENCY,
    savingsPercent: 20,
    description: '960 credits',
  },
  {
    id: 'pack_2000',
    credits: 2000,
    priceMinor: 90_000,
    currency: CREDIT_PACK_CURRENCY,
    savingsPercent: 30,
    description: '2000 credits',
  },
] as const;

export function getCreditPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((pack) => pack.id === id);
}
