import { describe, it, expect } from 'vitest';
import { MODEL_REGISTRY, isPro } from './registry.js';
import type { ModelDefinition, ModelKey } from './types.js';

const GENERATION_KEYS: ModelKey[] = [
  'FLUX_QUICK',
  'FLUX_BASIC',
  'FLUX_PRO',
  'FLUX_1_1_PRO',
  'FLUX_REALISM',
];

const UTILITY_KEYS: ModelKey[] = [
  'UPSCALE_IMAGE',
  'COLORIZE_BASIC',
  'COLORIZE_ADVANCED',
  'REVIVE',
  'OLD_PHOTOS',
];

const ALL_KEYS: ModelKey[] = [...GENERATION_KEYS, ...UTILITY_KEYS];

describe('MODEL_REGISTRY', () => {
  it('contains an entry for every expected model key', () => {
    for (const key of ALL_KEYS) {
      expect(MODEL_REGISTRY[key]).toBeDefined();
    }
  });

  it('every entry satisfies the ModelDefinition shape', () => {
    for (const key of ALL_KEYS) {
      const entry: ModelDefinition = MODEL_REGISTRY[key];
      expect(entry.key).toBe(key);
      expect(typeof entry.replicateId).toBe('string');
      expect(entry.replicateId).toMatch(/^[^/]+\/[^/]+/);
      expect(['budget', 'standard', 'premium']).toContain(entry.tier);
      expect(entry.fields.prompt).toBe(true);
    }
  });

  it('replicateId values match the constants in apps/api', () => {
    expect(MODEL_REGISTRY.FLUX_QUICK.replicateId).toBe('black-forest-labs/flux-schnell');
    expect(MODEL_REGISTRY.FLUX_BASIC.replicateId).toBe('black-forest-labs/flux-dev');
    expect(MODEL_REGISTRY.FLUX_PRO.replicateId).toBe('black-forest-labs/flux-pro');
    expect(MODEL_REGISTRY.FLUX_1_1_PRO.replicateId).toBe('black-forest-labs/flux-1.1-pro');
    expect(MODEL_REGISTRY.FLUX_REALISM.replicateId).toContain('xlabs-ai/flux-dev-realism:');
  });
});

describe('isPro — tier→isPro mapping', () => {
  // Ground truth from apps/web/src/utils/models.ts hardcoded `isPro` flags
  const expectedIsPro: Record<ModelKey, boolean> = {
    FLUX_QUICK: false, // tier: budget
    FLUX_BASIC: false, // tier: standard
    FLUX_PRO: true, // tier: premium
    FLUX_1_1_PRO: true, // tier: premium
    FLUX_REALISM: true, // tier: premium
    // utility models — tier drives the value
    UPSCALE_IMAGE: false, // tier: standard
    COLORIZE_BASIC: false, // tier: budget
    COLORIZE_ADVANCED: false, // tier: standard
    REVIVE: false, // tier: budget
    OLD_PHOTOS: false, // tier: standard
  };

  for (const key of ALL_KEYS) {
    it(`isPro(${key}) === ${expectedIsPro[key]}`, () => {
      expect(isPro(MODEL_REGISTRY[key])).toBe(expectedIsPro[key]);
    });
  }

  it('isPro returns true only for premium tier', () => {
    for (const key of ALL_KEYS) {
      const entry = MODEL_REGISTRY[key];
      expect(isPro(entry)).toBe(entry.tier === 'premium');
    }
  });
});

describe('FLUX_PRO / FLUX_1_1_PRO — no outputQuality field', () => {
  it('FLUX_PRO has no outputQuality (not supported by this model)', () => {
    expect(MODEL_REGISTRY.FLUX_PRO.fields.outputQuality).toBeUndefined();
  });

  it('FLUX_1_1_PRO has no outputQuality (not supported by this model)', () => {
    expect(MODEL_REGISTRY.FLUX_1_1_PRO.fields.outputQuality).toBeUndefined();
  });

  it('FLUX_BASIC has outputQuality', () => {
    expect(MODEL_REGISTRY.FLUX_BASIC.fields.outputQuality).toBeDefined();
  });
});

describe('FLUX_PRO / FLUX_1_1_PRO — no numOutputs field (T5 constraint)', () => {
  it('FLUX_PRO does not have numOutputs field spec', () => {
    expect(MODEL_REGISTRY.FLUX_PRO.fields.numOutputs).toBeUndefined();
  });

  it('FLUX_1_1_PRO does not have numOutputs field spec', () => {
    expect(MODEL_REGISTRY.FLUX_1_1_PRO.fields.numOutputs).toBeUndefined();
  });

  it('other generation models have numOutputs', () => {
    expect(MODEL_REGISTRY.FLUX_QUICK.fields.numOutputs).toBeDefined();
    expect(MODEL_REGISTRY.FLUX_BASIC.fields.numOutputs).toBeDefined();
    expect(MODEL_REGISTRY.FLUX_REALISM.fields.numOutputs).toBeDefined();
  });
});

describe('OLD_PHOTOS — new utility model', () => {
  it('OLD_PHOTOS has correct shape', () => {
    const model = MODEL_REGISTRY.OLD_PHOTOS;
    expect(model.key).toBe('OLD_PHOTOS');
    expect(model.replicateId).toContain('microsoft/bringing-old-photos-back-to-life:');
    expect(model.tier).toBe('standard');
    expect(model.utility).toBe(true);
    expect(model.fields.imageInput).toBeDefined();
    expect(model.fields.imageInput?.inputKey).toBe('image');
  });
});

describe('utility models', () => {
  it('utility models have imageInput field', () => {
    for (const key of UTILITY_KEYS) {
      expect(MODEL_REGISTRY[key].fields.imageInput).toBeDefined();
      expect(MODEL_REGISTRY[key].utility).toBe(true);
    }
  });

  it('generation models do not have utility flag', () => {
    for (const key of GENERATION_KEYS) {
      expect(MODEL_REGISTRY[key].utility).toBeFalsy();
    }
  });
});
