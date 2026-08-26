import { describe, it, expect } from 'vitest';
import { MODEL_REGISTRY, MODEL_IDS, findModelByReplicateId } from './registry.js';
import type { ModelDefinition, ModelKey } from './types.js';

const LEGACY_GENERATION_KEYS: ModelKey[] = [
  'FLUX_QUICK',
  'FLUX_BASIC',
  'FLUX_PRO',
  'FLUX_1_1_PRO',
  'FLUX_REALISM',
];

const CATALOG_KEYS: ModelKey[] = [
  'FLUX_FAST',
  'P_IMAGE',
  'Z_IMAGE_TURBO',
  'GROK_IMAGINE',
  'GROK_IMAGINE_QUALITY',
  'SEEDREAM_4',
  'FLUX_2_DEV',
  'FLUX_2_PRO',
  'FLUX_KONTEXT_PRO',
  'FLUX_2_MAX',
  'FLUX_KONTEXT_MAX',
  'NANO_BANANA_2',
  'IMAGEN_4_ULTRA',
  'NANO_BANANA_PRO',
  'GPT_IMAGE_2',
];

const UTILITY_KEYS: ModelKey[] = [
  'UPSCALE_IMAGE',
  'COLORIZE_BASIC',
  'COLORIZE_ADVANCED',
  'REVIVE',
  'OLD_PHOTOS',
  'BACKGROUND_REMOVER',
  'UPSCALE_REAL_ESRGAN',
  'UPSCALE_PRUNA',
  'UPSCALE_RECRAFT',
  'UPSCALE_GOOGLE',
  'UPSCALE_CLARITY_PRO',
  'UPSCALE_TOPAZ',
];

const ALL_KEYS: ModelKey[] = [...LEGACY_GENERATION_KEYS, ...CATALOG_KEYS, ...UTILITY_KEYS];

describe('MODEL_REGISTRY', () => {
  it('contains an entry for every expected model key', () => {
    for (const key of ALL_KEYS) {
      expect(MODEL_REGISTRY[key]).toBeDefined();
    }
    expect(Object.keys(MODEL_REGISTRY).sort()).toEqual([...ALL_KEYS].sort());
  });

  it('every entry satisfies the ModelDefinition shape', () => {
    for (const key of ALL_KEYS) {
      const entry: ModelDefinition = MODEL_REGISTRY[key];
      expect(entry.key).toBe(key);
      expect(typeof entry.replicateId).toBe('string');
      expect(entry.replicateId).toMatch(/^[^/]+\/[^/]+/);
      expect(['budget', 'standard', 'premium']).toContain(entry.tier);
      // prompt is optional for utility models
      if (entry.fields.prompt !== undefined) {
        expect(entry.fields.prompt).toBe(true);
      }
    }
  });

  it('MODEL_IDS mirrors registry keys', () => {
    for (const key of ALL_KEYS) {
      expect(MODEL_IDS[key]).toBe(key);
    }
  });

  it('replicateId values match known Replicate slugs', () => {
    expect(MODEL_REGISTRY.FLUX_QUICK.replicateId).toBe('black-forest-labs/flux-schnell');
    expect(MODEL_REGISTRY.FLUX_BASIC.replicateId).toBe('black-forest-labs/flux-dev');
    expect(MODEL_REGISTRY.NANO_BANANA_2.replicateId).toBe('google/nano-banana-2');
    expect(MODEL_REGISTRY.GPT_IMAGE_2.replicateId).toBe('openai/gpt-image-2');
    expect(MODEL_REGISTRY.SEEDREAM_4.replicateId).toBe('bytedance/seedream-4');
  });

  it('findModelByReplicateId resolves catalog slugs', () => {
    expect(findModelByReplicateId('google/nano-banana-2')?.key).toBe('NANO_BANANA_2');
    expect(findModelByReplicateId('openai/gpt-image-2')?.key).toBe('GPT_IMAGE_2');
  });
});

describe('catalog field specs (MODELS_COMPARISON §4)', () => {
  it('NANO_BANANA_2 has aspectRatio + outputFormat + resolution, no numOutputs/quality', () => {
    const fields = MODEL_REGISTRY.NANO_BANANA_2.fields;
    expect(fields.aspectRatio).toBeDefined();
    expect(fields.outputFormat).toBeDefined();
    expect(fields.resolution?.inputKey).toBe('resolution');
    expect(fields.numOutputs).toBeUndefined();
    expect(fields.outputQuality).toBeUndefined();
  });

  it('SEEDREAM_4 uses max_images for multi-output', () => {
    expect(MODEL_REGISTRY.SEEDREAM_4.fields.numOutputs?.inputKey).toBe('max_images');
  });

  it('GPT_IMAGE_2 uses number_of_images for multi-output', () => {
    expect(MODEL_REGISTRY.GPT_IMAGE_2.fields.numOutputs?.inputKey).toBe('number_of_images');
  });

  it('Z_IMAGE_TURBO has no aspectRatio (dimensions only)', () => {
    expect(MODEL_REGISTRY.Z_IMAGE_TURBO.fields.aspectRatio).toBeUndefined();
    expect(MODEL_REGISTRY.Z_IMAGE_TURBO.fields.dimensions).toBeDefined();
    expect(MODEL_REGISTRY.Z_IMAGE_TURBO.fields.outputFormat).toBeDefined();
  });
});

describe('FLUX_PRO / FLUX_1_1_PRO — no outputQuality / numOutputs', () => {
  it('FLUX_PRO has no outputQuality or numOutputs', () => {
    expect(MODEL_REGISTRY.FLUX_PRO.fields.outputQuality).toBeUndefined();
    expect(MODEL_REGISTRY.FLUX_PRO.fields.numOutputs).toBeUndefined();
  });

  it('FLUX_1_1_PRO has no outputQuality or numOutputs', () => {
    expect(MODEL_REGISTRY.FLUX_1_1_PRO.fields.outputQuality).toBeUndefined();
    expect(MODEL_REGISTRY.FLUX_1_1_PRO.fields.numOutputs).toBeUndefined();
  });

  it('FLUX_BASIC has outputQuality and numOutputs', () => {
    expect(MODEL_REGISTRY.FLUX_BASIC.fields.outputQuality).toBeDefined();
    expect(MODEL_REGISTRY.FLUX_BASIC.fields.numOutputs).toBeDefined();
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
    for (const key of [...LEGACY_GENERATION_KEYS, ...CATALOG_KEYS]) {
      expect(MODEL_REGISTRY[key].utility).toBeFalsy();
    }
  });
});
