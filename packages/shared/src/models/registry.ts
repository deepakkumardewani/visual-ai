import type { ModelDefinition, ModelKey } from './types.js';

// Aspect ratio values shared across all Flux generation models
const FLUX_ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'];

export const MODEL_REGISTRY: Record<ModelKey, ModelDefinition> = {
  FLUX_QUICK: {
    key: 'FLUX_QUICK',
    replicateId: 'black-forest-labs/flux-schnell',
    label: 'Flux Schnell',
    tier: 'budget',
    pricePerImage: 0.003,
    fields: {
      prompt: true,
      numOutputs: { max: 4, inputKey: 'num_outputs' },
      outputFormat: { values: ['png', 'jpg', 'webp'] },
      outputQuality: { min: 1, max: 100 },
    },
  },

  FLUX_BASIC: {
    key: 'FLUX_BASIC',
    replicateId: 'black-forest-labs/flux-dev',
    label: 'Flux Dev',
    tier: 'standard',
    pricePerImage: 0.014,
    fields: {
      prompt: true,
      aspectRatio: { values: FLUX_ASPECT_RATIOS },
      numOutputs: { max: 4, inputKey: 'num_outputs' },
      outputFormat: { values: ['png', 'jpg', 'webp'] },
      outputQuality: { min: 1, max: 100 },
    },
  },

  FLUX_PRO: {
    key: 'FLUX_PRO',
    replicateId: 'black-forest-labs/flux-pro',
    label: 'Flux Pro',
    tier: 'premium',
    pricePerImage: 0.04,
    fields: {
      prompt: true,
      aspectRatio: { values: FLUX_ASPECT_RATIOS },
      // num_outputs excluded: FLUX_PRO does not support it (T5 constraint)
      outputFormat: { values: ['png', 'jpg', 'webp'] },
      // output_quality not supported on flux-pro
    },
  },

  FLUX_1_1_PRO: {
    key: 'FLUX_1_1_PRO',
    replicateId: 'black-forest-labs/flux-1.1-pro',
    label: 'Flux 1.1 Pro',
    tier: 'premium',
    pricePerImage: 0.04,
    fields: {
      prompt: true,
      aspectRatio: { values: FLUX_ASPECT_RATIOS },
      // num_outputs excluded: FLUX_1_1_PRO does not support it (T5 constraint)
      outputFormat: { values: ['png', 'jpg', 'webp'] },
      // output_quality not supported on flux-1.1-pro
    },
  },

  FLUX_REALISM: {
    key: 'FLUX_REALISM',
    replicateId:
      'xlabs-ai/flux-dev-realism:39b3434f194f87a900d1bc2b6d4b983e90f0dde1d5022c27b52c143d670758fa',
    label: 'Flux Realism',
    tier: 'premium',
    pricePerImage: 0.03,
    fields: {
      prompt: true,
      numOutputs: { max: 4, inputKey: 'num_outputs' },
      outputFormat: { values: ['png', 'jpg', 'webp'] },
      outputQuality: { min: 1, max: 100 },
    },
  },

  // — Utility models (non-generation) —

  UPSCALE_IMAGE: {
    key: 'UPSCALE_IMAGE',
    replicateId:
      'philz1337x/clarity-upscaler:dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e',
    label: 'Clarity Upscaler',
    tier: 'standard',
    utility: true,
    fields: {
      prompt: true,
      imageInput: { inputKey: 'image' },
    },
  },

  COLORIZE_BASIC: {
    key: 'COLORIZE_BASIC',
    replicateId:
      'arielreplicate/deoldify_image:0da600fab0c45a66211339f1c16b71345d22f26ef5fea3dca1bb90bb5711e950',
    label: 'DeOldify',
    tier: 'budget',
    utility: true,
    fields: {
      prompt: true,
      imageInput: { inputKey: 'input_image' },
    },
  },

  COLORIZE_ADVANCED: {
    key: 'COLORIZE_ADVANCED',
    replicateId: 'piddnad/ddcolor:ca494ba129e44e45f661d6ece83c4c98a9a7c774309beca01429b58fce8aa695',
    label: 'DDColor',
    tier: 'standard',
    utility: true,
    fields: {
      prompt: true,
      imageInput: { inputKey: 'image' },
    },
  },

  REVIVE: {
    key: 'REVIVE',
    replicateId:
      'tencentarc/gfpgan:0fbacf7afc6c144e5be9767cff80f25aff23e52b0708f17e20f9879b2f21516c',
    label: 'GFPGAN',
    tier: 'budget',
    utility: true,
    fields: {
      prompt: true,
      imageInput: { inputKey: 'image' },
    },
  },

  OLD_PHOTOS: {
    key: 'OLD_PHOTOS',
    replicateId:
      'microsoft/bringing-old-photos-back-to-life:c75db81db6cbd809d93cc3b7e7a088a351a3349c9fa02b6d393e35e0d51ba799',
    label: 'Restore Old Photos',
    tier: 'standard',
    utility: true,
    fields: {
      prompt: true,
      imageInput: { inputKey: 'image' },
    },
  },
};

/** Derive isPro from tier — matches the hardcoded `isPro` flags in apps/web/src/utils/models.ts */
export function isPro(model: ModelDefinition): boolean {
  return model.tier === 'premium';
}

/**
 * Typed constant map of every registry key to itself.
 * Replaces the web-local `utils/modelIds.ts` — import from `@visual-ai/shared` instead.
 *
 * @example
 *   import { MODEL_IDS } from '@visual-ai/shared'
 *   const modelId = MODEL_IDS.FLUX_BASIC // 'FLUX_BASIC'
 */
export const MODEL_IDS = Object.fromEntries(
  Object.keys(MODEL_REGISTRY).map((k) => [k, k]),
) as Record<ModelKey, ModelKey>;
