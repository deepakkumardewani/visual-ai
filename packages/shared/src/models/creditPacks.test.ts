import { describe, it, expect } from 'vitest';
import {
  CREDIT_PACKS,
  computePackSavingsPercent,
  getCreditPack,
  isPackCurrency,
  maxPackSavingsPercent,
  packCurrencyForCountry,
  type CreditPack,
  type CreditPackId,
  type PackCurrency,
} from './creditPacks.js';

const EXPECTED_PACKS: Readonly<
  Record<CreditPackId, { credits: number; prices: Record<PackCurrency, number> }>
> = {
  pack_300: { credits: 300, prices: { USD: 500, INR: 24_900 } },
  pack_700: { credits: 700, prices: { USD: 1_000, INR: 54_900 } },
  pack_1600: { credits: 1600, prices: { USD: 2_000, INR: 114_900 } },
  pack_4500: { credits: 4500, prices: { USD: 5_000, INR: 299_900 } },
};

const PACK_IDS = Object.keys(EXPECTED_PACKS) as CreditPackId[];

describe('CREDIT_PACKS', () => {
  it('lists the four packs in ascending order', () => {
    expect(CREDIT_PACKS.map((pack) => pack.id)).toEqual(PACK_IDS);
  });

  it('holds fixed USD and INR prices in minor units', () => {
    for (const pack of CREDIT_PACKS) {
      const expected = EXPECTED_PACKS[pack.id];
      expect(pack.credits).toBe(expected.credits);
      expect(pack.prices).toEqual(expected.prices);
    }
  });

  it('marks only the third pack (1,600 credits) as most popular', () => {
    expect(CREDIT_PACKS.filter((pack) => pack.popular).map((pack) => pack.id)).toEqual([
      'pack_1600',
    ]);
    expect(CREDIT_PACKS[2]?.popular).toBe(true);
  });
});

describe('getCreditPack', () => {
  it('returns the pack for each current id', () => {
    for (const id of PACK_IDS) {
      expect(getCreditPack(id)?.id).toBe(id);
    }
  });

  it('does not resolve retired or unknown ids', () => {
    for (const id of ['pack_200', 'pack_450', 'pack_960', 'pack_2000', 'nope', '']) {
      expect(getCreditPack(id)).toBeUndefined();
    }
  });
});

describe('packCurrencyForCountry', () => {
  it('gives INR for India in any case or padding', () => {
    expect(packCurrencyForCountry('IN')).toBe('INR');
    expect(packCurrencyForCountry(' in ')).toBe('INR');
  });

  it('gives USD for every other, unknown or malformed country', () => {
    for (const country of ['US', 'GB', 'DE', 'JP', undefined, null, '', 'IND', '12']) {
      expect(packCurrencyForCountry(country)).toBe('USD');
    }
  });
});

describe('isPackCurrency', () => {
  it('accepts USD and INR only', () => {
    expect(isPackCurrency('USD')).toBe(true);
    expect(isPackCurrency('INR')).toBe(true);
    expect(isPackCurrency('EUR')).toBe(false);
    expect(isPackCurrency('usd')).toBe(false);
  });
});

describe('computePackSavingsPercent', () => {
  const savings = (currency: PackCurrency) =>
    CREDIT_PACKS.map((pack) => computePackSavingsPercent(pack, currency));

  it('computes USD savings per 100 credits vs the smallest pack, rounded down', () => {
    expect(savings('USD')).toEqual([0, 14, 25, 33]);
  });

  it('computes INR savings separately because INR prices scale differently', () => {
    expect(savings('INR')).toEqual([0, 5, 13, 19]);
  });

  it('keeps an exact ratio exact instead of flooring float error (25%, not 24%)', () => {
    const pack1600 = getCreditPack('pack_1600') as CreditPack;
    expect(computePackSavingsPercent(pack1600, 'USD')).toBe(25);
  });

  it('never reports a negative saving for a pricier-per-credit pack', () => {
    const base: CreditPack = {
      id: 'pack_300',
      credits: 100,
      prices: { USD: 100, INR: 100 },
      popular: false,
      description: '',
    };
    const worse: CreditPack = {
      ...base,
      id: 'pack_700',
      credits: 200,
      prices: { USD: 300, INR: 300 },
    };
    expect(computePackSavingsPercent(worse, 'USD', [base, worse])).toBe(0);
  });

  it('returns 0 for an empty pack list', () => {
    expect(computePackSavingsPercent(CREDIT_PACKS[0] as CreditPack, 'USD', [])).toBe(0);
  });
});

describe('maxPackSavingsPercent', () => {
  it('is the best saving per currency', () => {
    expect(maxPackSavingsPercent('USD')).toBe(33);
    expect(maxPackSavingsPercent('INR')).toBe(19);
  });
});
