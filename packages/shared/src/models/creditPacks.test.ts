import { describe, it, expect } from 'vitest';
import {
  CREDIT_PACK_CURRENCY,
  CREDIT_PACKS,
  getCreditPack,
  type CreditPackId,
} from './creditPacks.js';

const EXPECTED_PACKS: Readonly<
  Record<
    CreditPackId,
    { credits: number; priceMinor: number; savingsPercent: number; description: string }
  >
> = {
  pack_200: {
    credits: 200,
    priceMinor: 13_000,
    savingsPercent: 0,
    description: '200 credits',
  },
  pack_450: {
    credits: 450,
    priceMinor: 29_000,
    savingsPercent: 10,
    description: '450 credits',
  },
  pack_960: {
    credits: 960,
    priceMinor: 50_000,
    savingsPercent: 20,
    description: '960 credits',
  },
  pack_2000: {
    credits: 2000,
    priceMinor: 90_000,
    savingsPercent: 30,
    description: '2000 credits',
  },
};

const PACK_IDS = Object.keys(EXPECTED_PACKS) as CreditPackId[];

describe('CREDIT_PACK_CURRENCY', () => {
  it('is INR', () => {
    expect(CREDIT_PACK_CURRENCY).toBe('INR');
  });
});

describe('CREDIT_PACKS', () => {
  it('lists exactly four one-time credit packs', () => {
    expect(CREDIT_PACKS).toHaveLength(4);
  });

  it('uses unique pack ids', () => {
    const ids = CREDIT_PACKS.map((pack) => pack.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual([...PACK_IDS].sort());
  });

  it('matches legacy singles credits, prices, savings, and descriptions', () => {
    for (const pack of CREDIT_PACKS) {
      const expected = EXPECTED_PACKS[pack.id];
      expect(pack.credits).toBe(expected.credits);
      expect(pack.priceMinor).toBe(expected.priceMinor);
      expect(pack.savingsPercent).toBe(expected.savingsPercent);
      expect(pack.description).toBe(expected.description);
      expect(pack.currency).toBe(CREDIT_PACK_CURRENCY);
    }
  });

  it('has no monthly subscription entry', () => {
    for (const pack of CREDIT_PACKS) {
      expect(pack.id).not.toMatch(/monthly/i);
      expect(pack.description.toLowerCase()).not.toContain('monthly');
    }
    expect(CREDIT_PACKS.some((pack) => (pack.id as string) === 'monthly')).toBe(false);
  });
});

describe('getCreditPack', () => {
  it('returns the pack for each known id', () => {
    for (const id of PACK_IDS) {
      const pack = getCreditPack(id);
      expect(pack).toBeDefined();
      expect(pack?.id).toBe(id);
      expect(pack?.credits).toBe(EXPECTED_PACKS[id].credits);
    }
  });

  it('returns undefined for unknown ids', () => {
    expect(getCreditPack('nope')).toBeUndefined();
    expect(getCreditPack('')).toBeUndefined();
    expect(getCreditPack('pack_999')).toBeUndefined();
  });
});
