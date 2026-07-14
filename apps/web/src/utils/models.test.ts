import { describe, expect, it } from 'vitest';

import { MODEL_IDS } from '@/utils/modelIds';
import {
  FLUX_MODES,
  formatPrice,
  getFeaturedModels,
  getProviderDisplayName,
  groupModelsByProvider,
  MODELS,
} from '@/utils/models';

describe('models catalog', () => {
  it('exports typed MODELS with required fields', () => {
    expect(MODELS.length).toBeGreaterThan(5);

    for (const model of MODELS) {
      expect(model.title).toBeTruthy();
      expect(model.id).toBeTruthy();
      expect(model.provider).toBeTruthy();
      expect(model.description).toBeTruthy();
      expect(['budget', 'standard', 'premium']).toContain(model.tier);
      expect(typeof model.isPro).toBe('boolean');
    }
  });

  it('keeps FLUX_MODES alias for legacy backend model ids', () => {
    expect(FLUX_MODES.length).toBe(5);
    expect(FLUX_MODES[0].title).toBe('Flux Lightning');
    expect(FLUX_MODES[0].id).toBe(MODEL_IDS.FLUX_BASIC);

    const ids = FLUX_MODES.map((m) => m.id);
    expect(ids).toContain(MODEL_IDS.FLUX_BASIC);
    expect(ids).toContain(MODEL_IDS.FLUX_PRO);
    expect(ids).toContain(MODEL_IDS.FLUX_1_1_PRO);
    expect(ids).toContain(MODEL_IDS.FLUX_REALISM);
  });

  it('derives isPro from premium tier for new catalog models', () => {
    const premium = MODELS.filter((m) => m.tier === 'premium');
    expect(premium.length).toBeGreaterThan(0);
    for (const model of premium) {
      expect(model.isPro).toBe(true);
    }
  });

  it('groups models by provider', () => {
    const groups = groupModelsByProvider(MODELS);
    expect(groups.get('bfl')!.length).toBeGreaterThan(1);
    expect(groups.get('openai')!.length).toBe(1);
    expect(groups.get('google')!.length).toBe(3);
  });

  it('marks a featured set of 5-6 models', () => {
    const featured = getFeaturedModels();
    expect(featured.length).toBeGreaterThanOrEqual(5);
    expect(featured.length).toBeLessThanOrEqual(6);

    const titles = featured.map((m) => m.title);
    expect(titles).toContain('Z-Image Turbo');
    expect(titles).toContain('GPT Image 2');
    expect(titles).toContain('Nano Banana 2');
    expect(titles).toContain('Nano Banana Pro');
    expect(titles).toContain('Seedream 4');
    expect(titles).toContain('Flux 2 Pro');
  });

  it('filters featured models from an arbitrary list', () => {
    const subset = MODELS.filter((m) => !m.featured);
    expect(getFeaturedModels(subset)).toEqual([]);
  });

  it('resolves provider display names with raw fallback', () => {
    expect(getProviderDisplayName('openai')).toBe('OpenAI');
    expect(getProviderDisplayName('bfl')).toBe('Black Forest Labs');
    expect(getProviderDisplayName('zimage')).toBe('Z-Image');
    expect(getProviderDisplayName('unknown-provider')).toBe('unknown-provider');
  });

  it('formats price per image', () => {
    expect(formatPrice(0.005)).toBe('$0.005');
    expect(formatPrice(0.014)).toBe('$0.014');
    expect(formatPrice(0.15)).toBe('$0.15');
    expect(formatPrice(undefined)).toBeNull();
  });
});
