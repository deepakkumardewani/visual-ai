import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as shared from '@visual-ai/shared';
import { CREDIT_PACKS } from '@visual-ai/shared';
import type { ModelKey } from '@visual-ai/shared';

vi.mock('@/composables/useFetch', () => ({ useFetch: vi.fn() }));

import { useFetch } from '@/composables/useFetch';
import { usePricingCatalog } from '@/composables/usePricingCatalog';

const realCost = shared.getCreditCost;

describe('usePricingCatalog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete (shared.MODEL_REGISTRY as Record<string, unknown>).__MISSING__;
    delete (shared.MODEL_REGISTRY as Record<string, unknown>).FAKE_UTIL;
  });

  it('groups registry models into generation, utilities, and upscaling', () => {
    const { modelsByCategory } = usePricingCatalog();
    const cats = modelsByCategory.value;

    expect(cats['Image Generation'].length).toBeGreaterThan(0);
    expect(cats.Utilities.length).toBeGreaterThan(0);
    expect(cats.Upscaling.length).toBeGreaterThan(0);
    expect(cats.Upscaling.every((row) => row.key.includes('UPSCALE'))).toBe(true);
    expect(cats.Utilities.every((row) => !row.key.includes('UPSCALE'))).toBe(true);
  });

  it('builds board columns with everyday and premium generation bands', () => {
    const { pricingBoard } = usePricingCatalog();
    const [generation, studio, upscale] = pricingBoard.value;

    expect(generation.category).toBe('Image generation');
    expect(generation.bands.some((band) => band.title === 'Everyday generation')).toBe(true);
    expect(
      generation.bands.find((band) => band.title === 'Everyday generation')?.rows[0].cost,
    ).toBe(1);

    expect(studio.category).toBe('Studio tools');
    expect(studio.bands.some((band) => band.title === 'Colorize photos')).toBe(true);

    expect(upscale.category).toBe('Upscaling');
    expect(upscale.bands.some((band) => band.title === 'Standard upscale')).toBe(true);
    expect(upscale.bands.some((band) => band.title === 'Premium upscale')).toBe(true);
  });

  it('omits empty pricing bands and skips broken registry rows', () => {
    (shared.MODEL_REGISTRY as Record<string, unknown>).__MISSING__ = undefined;
    const revive = shared.MODEL_REGISTRY.REVIVE;
    if (revive) {
      (shared.MODEL_REGISTRY as Record<string, unknown>).FAKE_UTIL = {
        ...revive,
        label: 'Mystery tool',
        utility: true,
      };
    }

    vi.spyOn(shared, 'getCreditCost').mockImplementation((key: ModelKey) => {
      if (key === 'FLUX_BASIC') throw new Error('unavailable');
      const model = shared.MODEL_REGISTRY[key];
      if (!model) return 1;
      if (!model.utility) return 5;
      if (String(key).includes('UPSCALE')) return 1;
      if (key === ('FAKE_UTIL' as ModelKey)) return 2;
      return realCost(key);
    });

    const { modelsByCategory, pricingBoard } = usePricingCatalog();
    expect(modelsByCategory.value.Utilities.some((row) => row.label === 'Mystery tool')).toBe(true);

    const [generation, studio, upscale] = pricingBoard.value;
    expect(generation.bands.some((band) => band.title === 'Everyday generation')).toBe(false);
    expect(generation.bands.some((band) => band.title === 'Premium generation')).toBe(true);
    expect(studio.bands.some((band) => band.title === 'Mystery tool')).toBe(true);
    // Upscale bands split by registry tier, so a mocked cost does not move a model between them.
    expect(upscale.bands.some((band) => band.title === 'Premium upscale')).toBe(true);
    expect(upscale.bands.some((band) => band.title === 'Standard upscale')).toBe(true);
  });

  it('omits the premium generation band when every model costs one credit', () => {
    vi.spyOn(shared, 'getCreditCost').mockImplementation((key: ModelKey) => {
      const model = shared.MODEL_REGISTRY[key];
      if (!model || model.utility) return realCost(key);
      return 1;
    });

    const { pricingBoard } = usePricingCatalog();
    const [generation] = pricingBoard.value;
    expect(generation.bands.some((band) => band.title === 'Premium generation')).toBe(false);
    expect(generation.bands.some((band) => band.title === 'Everyday generation')).toBe(true);
  });

  it('derives every column blurb from registry costs', () => {
    const [generation, studio, upscale] = usePricingCatalog().pricingBoard.value;
    expect(generation.blurb).toBe('Drafts start at 1 credit. Flagship models cost up to 30.');
    expect(studio.blurb).toBe('Colorize, restore, and cutout — 1–2 credits per run.');
    expect(upscale.blurb).toBe('Standard upscale is 1–6 credits. Premium upscale is 6–16 credits.');
  });

  it('builds premium-only generation when no everyday models remain', () => {
    vi.spyOn(shared, 'getCreditCost').mockImplementation((key: ModelKey) => {
      const model = shared.MODEL_REGISTRY[key];
      if (!model || model.utility) return realCost(key);
      return 4;
    });

    const { pricingBoard } = usePricingCatalog();
    const [generation] = pricingBoard.value;
    expect(generation.bands.some((band) => band.title === 'Everyday generation')).toBe(false);
    expect(generation.bands.some((band) => band.title === 'Premium generation')).toBe(true);
  });

  it('uses model labels for upscale rows without premium copy', () => {
    vi.spyOn(shared, 'getCreditCost').mockImplementation((key: ModelKey) => {
      if (String(key).includes('UPSCALE') && key !== 'UPSCALE_REAL_ESRGAN') return 4;
      return realCost(key);
    });

    const { pricingBoard } = usePricingCatalog();
    const upscale = pricingBoard.value[2];
    const premium = upscale.bands.find((band) => band.title === 'Premium upscale');
    expect(premium?.rows.some((row) => row.names.includes('Clarity Pro'))).toBe(true);
    expect(
      premium?.rows.some((row) => row.names === shared.MODEL_REGISTRY.UPSCALE_REAL_ESRGAN?.label),
    ).toBe(false);
  });

  it('exposes the four shared credit packs (no subscription)', () => {
    const { creditPacks } = usePricingCatalog();
    expect(creditPacks.value).toHaveLength(4);
    expect(creditPacks.value.map((pack) => pack.id)).toEqual(CREDIT_PACKS.map((pack) => pack.id));
    expect(creditPacks.value.some((pack) => String(pack.id).includes('monthly'))).toBe(false);
  });
});

type Prices = {
  country: string | null;
  currency: string;
  pro: { amountMinor: number; currency: string };
  packs: Array<{ id: string; amountMinor: number; currency: string }>;
};

function mockPricesResponse(result: { data: Prices | null; error: unknown }) {
  vi.mocked(useFetch).mockReturnValue({
    json: async () => ({ data: { value: result.data }, error: { value: result.error } }),
  } as unknown as ReturnType<typeof useFetch>);
}

const INR_PRICES: Prices = {
  country: 'IN',
  currency: 'INR',
  pro: { amountMinor: 500, currency: 'USD' },
  packs: CREDIT_PACKS.map((pack) => ({
    id: pack.id,
    amountMinor: pack.prices.INR,
    currency: 'INR',
  })),
};

const POPULAR_PACK = CREDIT_PACKS.find((pack) => pack.popular)!;

describe('usePricingCatalog prices', () => {
  // Price state is module-level, so every test needs a fresh module instance.
  let loadCatalog: () => ReturnType<typeof usePricingCatalog>;

  beforeEach(async () => {
    vi.resetModules();
    vi.mocked(useFetch).mockReset();
    const mod = await import('@/composables/usePricingCatalog');
    loadCatalog = mod.usePricingCatalog;
  });

  it('shows the USD fallback Pro price before prices load', () => {
    expect(loadCatalog().proPrice.value).toMatch(/5\.00/);
    expect(loadCatalog().proPrice.value).toContain('$');
  });

  it('shows plain USD pack prices before the server currency is known', () => {
    const catalog = loadCatalog();
    expect(catalog.packCurrency.value).toBe('USD');
    expect(catalog.formatPackPrice(CREDIT_PACKS[0])).toBe('$5.00');
    expect(catalog.formatPackPrice(POPULAR_PACK)).toBe('$20.00');
  });

  it('shows INR pack prices when the server resolves India', async () => {
    mockPricesResponse({ data: INR_PRICES, error: null });
    const catalog = loadCatalog();
    await catalog.loadPrices();

    expect(catalog.packCurrency.value).toBe('INR');
    expect(catalog.formatPackPrice(CREDIT_PACKS[0])).toContain('₹');
    expect(catalog.formatPackPrice(CREDIT_PACKS[0])).toMatch(/249/);
    // Pro is a single USD product everywhere.
    expect(catalog.proPrice.value).toContain('$');
  });

  it('computes savings per displayed currency', async () => {
    const catalog = loadCatalog();
    expect(CREDIT_PACKS.map((pack) => catalog.packSavingsPercent(pack))).toEqual([0, 14, 25, 33]);
    expect(catalog.bestPackSavingsPercent.value).toBe(33);

    mockPricesResponse({ data: INR_PRICES, error: null });
    await catalog.loadPrices();
    expect(CREDIT_PACKS.map((pack) => catalog.packSavingsPercent(pack))).toEqual([0, 5, 13, 19]);
    expect(catalog.bestPackSavingsPercent.value).toBe(19);
  });

  it('shows the per-100-credit price in USD by default', () => {
    // 500 cents / 300 credits * 100 = 166.67 cents
    expect(loadCatalog().formatPackPer100Credits(CREDIT_PACKS[0])).toBe('$1.67');
  });

  it('falls back to USD when the API returns an unsupported currency', async () => {
    mockPricesResponse({
      data: {
        ...INR_PRICES,
        currency: 'XXX',
        pro: { amountMinor: 999, currency: 'XXX' },
      },
      error: null,
    });
    const catalog = loadCatalog();
    await catalog.loadPrices();

    expect(catalog.proPrice.value).toContain('$');
    expect(catalog.proPrice.value).toMatch(/5\.00/);
    expect(catalog.formatPackPrice(CREDIT_PACKS[0])).toBe('$5.00');
  });

  it('keeps the USD fallback and retries on the next call after a fetch error', async () => {
    mockPricesResponse({ data: null, error: new Error('boom') });
    const catalog = loadCatalog();
    await catalog.loadPrices();
    expect(catalog.packCurrency.value).toBe('USD');

    mockPricesResponse({ data: INR_PRICES, error: null });
    await catalog.loadPrices();
    expect(useFetch).toHaveBeenCalledTimes(2);
    expect(catalog.packCurrency.value).toBe('INR');
  });

  it('treats a response without a pro price as a failure', async () => {
    mockPricesResponse({
      data: { ...INR_PRICES, pro: undefined } as unknown as Prices,
      error: null,
    });
    const catalog = loadCatalog();
    await catalog.loadPrices();
    expect(catalog.proPrice.value).toContain('$');
    expect(catalog.packCurrency.value).toBe('USD');
  });

  it('shares one request between concurrent callers and skips refetching once loaded', async () => {
    mockPricesResponse({ data: INR_PRICES, error: null });
    const first = loadCatalog();
    const second = loadCatalog();
    await Promise.all([first.loadPrices(), second.loadPrices()]);
    await first.loadPrices();

    expect(useFetch).toHaveBeenCalledTimes(1);
    expect(useFetch).toHaveBeenCalledWith('/payments/prices');
    expect(second.packCurrency.value).toBe('INR');
  });

  it('prices packs from the shared catalog, not from server amounts', async () => {
    mockPricesResponse({
      data: {
        ...INR_PRICES,
        packs: [{ id: CREDIT_PACKS[0].id, amountMinor: 1, currency: 'INR' }],
      },
      error: null,
    });
    const catalog = loadCatalog();
    await catalog.loadPrices();

    expect(catalog.formatPackPrice(CREDIT_PACKS[0])).toMatch(/₹\s?249/);
  });
});
