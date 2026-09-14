import { afterEach, describe, expect, it, vi } from 'vitest';

import * as shared from '@visual-ai/shared';
import type { ModelKey } from '@visual-ai/shared';

import { usePricingCatalog } from '@/composables/usePricingCatalog';
import { RAZORPAY_PRODUCTS } from '@/utils/constants';

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
    expect(upscale.bands.some((band) => band.title === 'Premium upscale')).toBe(false);
    expect(upscale.bands.some((band) => band.title === 'Standard upscale')).toBe(true);
  });

  it('exposes one-time credit packs only', () => {
    const { creditPacks } = usePricingCatalog();
    expect(creditPacks.value.every((pack) => pack.type === 'single')).toBe(true);
    expect(creditPacks.value.length).toBe(
      RAZORPAY_PRODUCTS.filter((product) => product.type === 'single').length,
    );
  });
});
