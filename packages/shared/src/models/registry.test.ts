import { describe, it, expect } from 'vitest';
import {
  FIXED_INPUTS,
  MODEL_REGISTRY,
  MODEL_IDS,
  findModelByReplicateId,
  getModelDefinition,
} from './registry.js';
import { PREMIUM_MODEL_KEYS } from './plans.js';
import { getModelKind } from './types.js';
import type { MediaModelKey, ModelDefinition, ModelKey, ModelKind } from './types.js';

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

const MEDIA_KEYS: ModelKey[] = [
  'LYRIA_2',
  'MINIMAX_MUSIC_26',
  'MINIMAX_MUSIC_15',
  'STABLE_AUDIO_25',
  'IMAGE_WATERMARK',
  'AUTOCAPTION',
  'VIDEO_WATERMARK',
  'INWORLD_TTS_2',
  'INWORLD_TTS_15_MAX',
  'MINIMAX_SPEECH_28_HD',
  'MINIMAX_SPEECH_28_TURBO',
  'CHATTERBOX_TURBO',
  'P_VIDEO',
  'WAN_3',
  'MINIMAX_VOICE_CLONE',
];

const IMAGE_KEYS: ModelKey[] = [...LEGACY_GENERATION_KEYS, ...CATALOG_KEYS, ...UTILITY_KEYS];
const ALL_KEYS: ModelKey[] = [...IMAGE_KEYS, ...MEDIA_KEYS];

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

describe('getModelDefinition / findModelByReplicateId', () => {
  it('returns the entry for a known key', () => {
    expect(getModelDefinition('WAN_3').replicateId).toBe('alibaba/wan-3');
  });

  it('throws for an unknown key', () => {
    expect(() => getModelDefinition('NOPE' as ModelKey)).toThrow('Unknown model key: NOPE');
  });

  it('matches a slug regardless of the version hash on either side', () => {
    expect(findModelByReplicateId('prunaai/p-video:abc123')?.key).toBe('P_VIDEO');
    expect(
      findModelByReplicateId(
        'fictions-ai/autocaption:18a45ff0d95feb4449d192bbdc06b4a6df168fa33def76dfc51b78ae224b599b',
      )?.key,
    ).toBe('AUTOCAPTION');
    expect(findModelByReplicateId('fictions-ai/autocaption')?.key).toBe('AUTOCAPTION');
  });

  it('returns undefined for an unknown slug', () => {
    expect(findModelByReplicateId('nobody/nothing')).toBeUndefined();
  });
});

describe('getModelKind', () => {
  it('is image for every pre-existing registry key', () => {
    for (const key of IMAGE_KEYS) {
      expect(getModelKind(MODEL_REGISTRY[key])).toBe('image');
    }
  });

  it('defaults an entry without kind to image', () => {
    expect(getModelKind({})).toBe('image');
  });

  it('reads the declared kind for media models', () => {
    const expected: Record<MediaModelKey, ModelKind> = {
      LYRIA_2: 'music',
      MINIMAX_MUSIC_26: 'song',
      MINIMAX_MUSIC_15: 'song',
      STABLE_AUDIO_25: 'music',
      IMAGE_WATERMARK: 'tool',
      AUTOCAPTION: 'tool',
      VIDEO_WATERMARK: 'tool',
      INWORLD_TTS_2: 'tts',
      INWORLD_TTS_15_MAX: 'tts',
      MINIMAX_SPEECH_28_HD: 'tts',
      MINIMAX_SPEECH_28_TURBO: 'tts',
      CHATTERBOX_TURBO: 'tts',
      P_VIDEO: 'video',
      WAN_3: 'video',
      MINIMAX_VOICE_CLONE: 'tts',
    };
    for (const key of MEDIA_KEYS as MediaModelKey[]) {
      expect(getModelKind(MODEL_REGISTRY[key])).toBe(expected[key]);
    }
  });
});

describe('media model entries', () => {
  const mediaKeys = MEDIA_KEYS as MediaModelKey[];
  const PINNED_HASH = /:[0-9a-f]{64}$/;
  const COMMUNITY_KEYS: MediaModelKey[] = ['IMAGE_WATERMARK', 'AUTOCAPTION', 'VIDEO_WATERMARK'];

  it('has exactly 15 media entries, all standard tier and never pro', () => {
    expect(mediaKeys).toHaveLength(15);
    for (const key of mediaKeys) {
      expect(MODEL_REGISTRY[key].tier).toBe('standard');
      expect(PREMIUM_MODEL_KEYS).not.toContain(key);
    }
  });

  it.each(MEDIA_KEYS)('%s carries kind, pricing, inputs and a verified date', (key) => {
    const entry = MODEL_REGISTRY[key];
    expect(entry.kind).toBeDefined();
    expect(entry.fields).toEqual({});
    expect(entry.media?.pricesVerifiedOn).toBe('2026-11-15');
    expect(entry.media?.pricing.usd).toBeGreaterThan(0);
    expect(Object.keys(entry.media?.inputs ?? {}).length).toBeGreaterThan(0);
    for (const field of Object.values(entry.media?.inputs ?? {})) {
      expect(field.inputKey).toMatch(/^\w+$/);
    }
  });

  it.each(COMMUNITY_KEYS)('pins a version hash on community model %s', (key) => {
    expect(MODEL_REGISTRY[key].replicateId).toMatch(PINNED_HASH);
  });

  it('keeps image entries free of a media config', () => {
    for (const key of IMAGE_KEYS) {
      expect(MODEL_REGISTRY[key].media).toBeUndefined();
    }
  });

  it('prices each model with the SPEC section 4 unit and rate', () => {
    const pricing = (k: MediaModelKey) => MODEL_REGISTRY[k].media?.pricing;
    expect(pricing('LYRIA_2')).toEqual({ unit: 'file', usd: 0.06 });
    expect(pricing('MINIMAX_MUSIC_26')).toEqual({ unit: 'file', usd: 0.15 });
    expect(pricing('MINIMAX_MUSIC_15')).toEqual({ unit: 'file', usd: 0.03 });
    expect(pricing('STABLE_AUDIO_25')).toEqual({ unit: 'file', usd: 0.2 });
    expect(pricing('IMAGE_WATERMARK')).toEqual({ unit: 'run', usd: 0.00019 });
    expect(pricing('VIDEO_WATERMARK')).toEqual({ unit: 'run', usd: 0.00045 });
    expect(pricing('AUTOCAPTION')).toEqual({ unit: 'run', usd: 0.055, blockSec: 30 });
    expect(pricing('INWORLD_TTS_2')).toEqual({ unit: 'kChars', usd: 0.025 });
    expect(pricing('INWORLD_TTS_15_MAX')).toEqual({ unit: 'kChars', usd: 0.035 });
    expect(pricing('MINIMAX_SPEECH_28_HD')).toEqual({ unit: 'kTokens', usd: 0.1 });
    expect(pricing('MINIMAX_SPEECH_28_TURBO')).toEqual({ unit: 'kTokens', usd: 0.06 });
    expect(pricing('CHATTERBOX_TURBO')).toEqual({ unit: 'kChars', usd: 0.025 });
    expect(pricing('MINIMAX_VOICE_CLONE')).toEqual({ unit: 'run', usd: 3 });
    expect(pricing('P_VIDEO')?.byResolution).toEqual({ '720p': 0.02, '1080p': 0.04 });
    expect(pricing('P_VIDEO')?.draftByResolution).toEqual({ '720p': 0.005, '1080p': 0.01 });
    expect(pricing('WAN_3')?.byResolution).toEqual({ '480p': 0.035, '720p': 0.07, '1080p': 0.14 });
  });

  it('wires each limit from the single media-limits source', () => {
    expect(MODEL_REGISTRY.P_VIDEO.media?.durationSec).toEqual({ min: 1, max: 20, default: 5 });
    expect(MODEL_REGISTRY.WAN_3.media?.durationSec).toEqual({ min: 2, max: 30, default: 5 });
    expect(MODEL_REGISTRY.INWORLD_TTS_2.media?.textLimit).toBe(2000);
    expect(MODEL_REGISTRY.MINIMAX_SPEECH_28_HD.media?.textLimit).toBe(10000);
    expect(MODEL_REGISTRY.CHATTERBOX_TURBO.media?.textLimit).toBe(500);
    expect(MODEL_REGISTRY.INWORLD_TTS_2.media?.voices).toBe('inworld');
    expect(MODEL_REGISTRY.MINIMAX_SPEECH_28_TURBO.media?.voices).toBe('minimax');
    expect(MODEL_REGISTRY.CHATTERBOX_TURBO.media?.voices).toBe('chatterbox');
  });
});

describe('FIXED_INPUTS', () => {
  const inputKeys = (key: MediaModelKey) =>
    Object.values(MODEL_REGISTRY[key].media?.inputs ?? {}).map((f) => f.inputKey);

  it('has one entry per media model and is the object the registry exposes', () => {
    expect(Object.keys(FIXED_INPUTS).sort()).toEqual([...MEDIA_KEYS].sort());
    for (const key of MEDIA_KEYS as MediaModelKey[]) {
      expect(MODEL_REGISTRY[key].media?.fixedInputs).toBe(FIXED_INPUTS[key]);
    }
  });

  it('P_VIDEO always sends disable_safety_filter=false and never sends no_op', () => {
    expect(FIXED_INPUTS.P_VIDEO.send).toEqual({ disable_safety_filter: false });
    expect(FIXED_INPUTS.P_VIDEO.neverSend).toEqual(['no_op']);
    expect(inputKeys('P_VIDEO')).not.toContain('disable_safety_filter');
    expect(inputKeys('P_VIDEO')).not.toContain('no_op');
  });

  it('Minimax Music never sends the deprecated audio_format alias', () => {
    for (const key of ['MINIMAX_MUSIC_26', 'MINIMAX_MUSIC_15'] as const) {
      expect(FIXED_INPUTS[key].neverSend).toEqual(['audio_format']);
      expect(inputKeys(key)).not.toContain('audio_format');
      expect(inputKeys(key)).toContain('output_format');
    }
  });

  it('VIDEO_WATERMARK always sends the user text so the vendor brand never applies', () => {
    expect(FIXED_INPUTS.VIDEO_WATERMARK.alwaysSend).toEqual(['watermark']);
    expect(inputKeys('VIDEO_WATERMARK')).toContain('watermark');
  });

  it('declares no server-forced input for the remaining models', () => {
    const withRules: MediaModelKey[] = [
      'P_VIDEO',
      'MINIMAX_MUSIC_26',
      'MINIMAX_MUSIC_15',
      'VIDEO_WATERMARK',
      'IMAGE_WATERMARK',
      'AUTOCAPTION',
    ];
    for (const key of MEDIA_KEYS as MediaModelKey[]) {
      if (withRules.includes(key)) continue;
      expect(FIXED_INPUTS[key]).toEqual({});
    }
  });
});
