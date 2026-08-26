import type { ModelDefinition, ModelKey } from './types.js';

/**
 * Aspect ratios from each model's Replicate OpenAPI `aspect_ratio` enum.
 * Excludes non-ratio controls: `match_input_image`, `custom`, and pixel sizes (e.g. `1024x1024`).
 * Re-sync with: `bun scripts/check-model-docs.mjs`
 */

/** Legacy Flux-1 family (flux-dev / flux-pro / flux-1.1-pro) */
const FLUX_1_ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'];

/** Flux 2 family — docs: match_input_image, custom, + these ratios (no 21:9) */
const FLUX_2_ASPECT_RATIOS = ['1:1', '16:9', '3:2', '2:3', '4:5', '5:4', '9:16', '3:4', '4:3'];

/** prunaai/flux-fast */
const FLUX_FAST_ASPECT_RATIOS = [
  '1:1',
  '16:9',
  '21:9',
  '3:2',
  '2:3',
  '4:5',
  '5:4',
  '3:4',
  '4:3',
  '9:16',
  '9:21',
];

/** prunaai/p-image — docs also allow `custom` (width/height) */
const P_IMAGE_ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'];

/** bytedance/seedream-4 — docs also allow `match_input_image` */
const SEEDREAM_ASPECT_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3', '21:9'];

/** black-forest-labs/flux-kontext-* — docs also allow `match_input_image` */
const KONTEXT_ASPECT_RATIOS = [
  '1:1',
  '16:9',
  '9:16',
  '4:3',
  '3:4',
  '3:2',
  '2:3',
  '4:5',
  '5:4',
  '21:9',
  '9:21',
  '2:1',
  '1:2',
];

/** google/imagen-4-ultra */
const IMAGEN_ASPECT_RATIOS = ['1:1', '9:16', '16:9', '3:4', '4:3'];

/** google/nano-banana-pro — docs also allow `match_input_image` */
const NANO_BANANA_PRO_ASPECT_RATIOS = [
  '1:1',
  '2:3',
  '3:2',
  '3:4',
  '4:3',
  '4:5',
  '5:4',
  '9:16',
  '16:9',
  '21:9',
];

/** google/nano-banana-2 — docs also allow `match_input_image` */
const NANO_BANANA_2_ASPECT_RATIOS = [
  '1:1',
  '1:4',
  '1:8',
  '2:3',
  '3:2',
  '3:4',
  '4:1',
  '4:3',
  '4:5',
  '5:4',
  '8:1',
  '9:16',
  '16:9',
  '21:9',
];

/** openai/gpt-image-2 — docs also allow `auto` and pixel sizes; UI uses ratios + auto */
const GPT_IMAGE_ASPECT_RATIOS = ['1:1', '3:2', '2:3', '4:3', '3:4', '16:9', '9:16', 'auto'];

/** xai/grok-imagine-image(+quality) — docs also allow `auto` */
const GROK_ASPECT_RATIOS = [
  '1:1',
  '16:9',
  '9:16',
  '4:3',
  '3:4',
  '3:2',
  '2:3',
  '2:1',
  '1:2',
  '19.5:9',
  '9:19.5',
  '20:9',
  '9:20',
  'auto',
];

const PNG_JPG_WEBP = ['png', 'jpg', 'webp'] as Array<'png' | 'jpg' | 'webp' | 'jpeg'>;
const JPG_PNG = ['jpg', 'png'] as Array<'png' | 'jpg' | 'webp' | 'jpeg'>;
/** GPT Image 2 OpenAPI uses `jpeg` (not `jpg`) */
const PNG_JPEG_WEBP = ['png', 'jpeg', 'webp'] as Array<'png' | 'jpg' | 'webp' | 'jpeg'>;

export const MODEL_REGISTRY: Record<ModelKey, ModelDefinition> = {
  // ── Legacy Flux-1 generation ──────────────────────────────────────────────

  FLUX_QUICK: {
    key: 'FLUX_QUICK',
    replicateId: 'black-forest-labs/flux-schnell',
    label: 'Flux Schnell',
    tier: 'budget',
    pricePerImage: 0.003,
    fields: {
      prompt: true,
      numOutputs: { max: 4, inputKey: 'num_outputs' },
      outputFormat: { values: PNG_JPG_WEBP },
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
      aspectRatio: { values: FLUX_1_ASPECT_RATIOS },
      numOutputs: { max: 4, inputKey: 'num_outputs' },
      outputFormat: { values: PNG_JPG_WEBP },
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
      aspectRatio: { values: FLUX_1_ASPECT_RATIOS },
      outputFormat: { values: PNG_JPG_WEBP },
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
      aspectRatio: { values: FLUX_1_ASPECT_RATIOS },
      outputFormat: { values: PNG_JPG_WEBP },
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
      outputFormat: { values: PNG_JPG_WEBP },
      outputQuality: { min: 1, max: 100 },
    },
  },

  // ── Catalog expansion (synced from Replicate OpenAPI) ─────────────────────

  FLUX_FAST: {
    key: 'FLUX_FAST',
    replicateId: 'prunaai/flux-fast',
    label: 'Flux Fast',
    tier: 'budget',
    pricePerImage: 0.005,
    fields: {
      prompt: true,
      aspectRatio: { values: FLUX_FAST_ASPECT_RATIOS },
      outputFormat: { values: PNG_JPG_WEBP },
    },
  },

  P_IMAGE: {
    key: 'P_IMAGE',
    replicateId: 'prunaai/p-image',
    label: 'P-Image',
    tier: 'budget',
    pricePerImage: 0.005,
    fields: {
      prompt: true,
      aspectRatio: { values: P_IMAGE_ASPECT_RATIOS },
      dimensions: { min: 256, max: 1440 },
    },
  },

  Z_IMAGE_TURBO: {
    key: 'Z_IMAGE_TURBO',
    replicateId: 'prunaai/z-image-turbo',
    label: 'Z-Image Turbo',
    tier: 'budget',
    pricePerImage: 0.02,
    fields: {
      prompt: true,
      // No aspect_ratio — uses raw width/height
      dimensions: { min: 64, max: 2048 },
      outputFormat: { values: PNG_JPG_WEBP },
    },
  },

  GROK_IMAGINE: {
    key: 'GROK_IMAGINE',
    replicateId: 'xai/grok-imagine-image',
    label: 'Grok Imagine',
    tier: 'budget',
    pricePerImage: 0.02,
    fields: {
      prompt: true,
      aspectRatio: { values: GROK_ASPECT_RATIOS },
      imageInput: { inputKey: 'image' },
    },
  },

  GROK_IMAGINE_QUALITY: {
    key: 'GROK_IMAGINE_QUALITY',
    replicateId: 'xai/grok-imagine-image-quality',
    label: 'Grok Imagine Quality',
    tier: 'standard',
    pricePerImage: 0.07,
    fields: {
      prompt: true,
      aspectRatio: { values: GROK_ASPECT_RATIOS },
      resolution: { values: ['1k', '2k'], inputKey: 'resolution' },
    },
  },

  SEEDREAM_4: {
    key: 'SEEDREAM_4',
    replicateId: 'bytedance/seedream-4',
    label: 'Seedream 4',
    tier: 'standard',
    pricePerImage: 0.03,
    fields: {
      prompt: true,
      aspectRatio: { values: SEEDREAM_ASPECT_RATIOS },
      resolution: { values: ['1K', '2K', '4K'], inputKey: 'size' },
      numOutputs: { max: 4, inputKey: 'max_images' },
      dimensions: { min: 1024, max: 4096 },
      imageInput: { inputKey: 'image_input' },
    },
  },

  FLUX_2_DEV: {
    key: 'FLUX_2_DEV',
    replicateId: 'black-forest-labs/flux-2-dev',
    label: 'Flux 2 Dev',
    tier: 'standard',
    pricePerImage: 0.014,
    fields: {
      prompt: true,
      aspectRatio: { values: FLUX_2_ASPECT_RATIOS },
      outputFormat: { values: PNG_JPG_WEBP },
      dimensions: { min: 256, max: 1440 },
      imageInput: { inputKey: 'input_images' },
    },
  },

  FLUX_2_PRO: {
    key: 'FLUX_2_PRO',
    replicateId: 'black-forest-labs/flux-2-pro',
    label: 'Flux 2 Pro',
    tier: 'standard',
    pricePerImage: 0.015,
    fields: {
      prompt: true,
      aspectRatio: { values: FLUX_2_ASPECT_RATIOS },
      outputFormat: { values: PNG_JPG_WEBP },
      dimensions: { min: 256, max: 2048 },
      imageInput: { inputKey: 'input_images', max: 8 },
    },
  },

  FLUX_KONTEXT_PRO: {
    key: 'FLUX_KONTEXT_PRO',
    replicateId: 'black-forest-labs/flux-kontext-pro',
    label: 'Flux Kontext Pro',
    tier: 'standard',
    pricePerImage: 0.04,
    fields: {
      prompt: true,
      aspectRatio: { values: KONTEXT_ASPECT_RATIOS },
      outputFormat: { values: JPG_PNG },
      imageInput: { inputKey: 'input_image' },
    },
  },

  FLUX_2_MAX: {
    key: 'FLUX_2_MAX',
    replicateId: 'black-forest-labs/flux-2-max',
    label: 'Flux 2 Max',
    tier: 'premium',
    pricePerImage: 0.12,
    fields: {
      prompt: true,
      aspectRatio: { values: FLUX_2_ASPECT_RATIOS },
      outputFormat: { values: PNG_JPG_WEBP },
      dimensions: { min: 256, max: 2048 },
      imageInput: { inputKey: 'input_images' },
    },
  },

  FLUX_KONTEXT_MAX: {
    key: 'FLUX_KONTEXT_MAX',
    replicateId: 'black-forest-labs/flux-kontext-max',
    label: 'Flux Kontext Max',
    tier: 'premium',
    pricePerImage: 0.08,
    fields: {
      prompt: true,
      aspectRatio: { values: KONTEXT_ASPECT_RATIOS },
      outputFormat: { values: JPG_PNG },
      imageInput: { inputKey: 'input_image' },
    },
  },

  NANO_BANANA_2: {
    key: 'NANO_BANANA_2',
    replicateId: 'google/nano-banana-2',
    label: 'Nano Banana 2',
    tier: 'standard',
    pricePerImage: 0.067,
    fields: {
      prompt: true,
      aspectRatio: { values: NANO_BANANA_2_ASPECT_RATIOS },
      outputFormat: { values: JPG_PNG },
      resolution: { values: ['1K', '2K', '4K'], inputKey: 'resolution' },
      imageInput: { inputKey: 'image_input' },
    },
  },

  IMAGEN_4_ULTRA: {
    key: 'IMAGEN_4_ULTRA',
    replicateId: 'google/imagen-4-ultra',
    label: 'Imagen 4 Ultra',
    tier: 'standard',
    pricePerImage: 0.06,
    fields: {
      prompt: true,
      aspectRatio: { values: IMAGEN_ASPECT_RATIOS },
      outputFormat: { values: JPG_PNG },
      resolution: { values: ['1K', '2K'], inputKey: 'image_size' },
    },
  },

  NANO_BANANA_PRO: {
    key: 'NANO_BANANA_PRO',
    replicateId: 'google/nano-banana-pro',
    label: 'Nano Banana Pro',
    tier: 'premium',
    pricePerImage: 0.15,
    fields: {
      prompt: true,
      aspectRatio: { values: NANO_BANANA_PRO_ASPECT_RATIOS },
      outputFormat: { values: JPG_PNG },
      resolution: { values: ['1K', '2K', '4K'], inputKey: 'resolution' },
      imageInput: { inputKey: 'image_input' },
    },
  },

  GPT_IMAGE_2: {
    key: 'GPT_IMAGE_2',
    replicateId: 'openai/gpt-image-2',
    label: 'GPT Image 2',
    tier: 'premium',
    pricePerImage: 0.128,
    fields: {
      prompt: true,
      aspectRatio: { values: GPT_IMAGE_ASPECT_RATIOS },
      outputFormat: { values: PNG_JPEG_WEBP },
      numOutputs: { max: 4, inputKey: 'number_of_images' },
      imageInput: { inputKey: 'input_images' },
    },
  },

  // ── Utility models (non-generation) ───────────────────────────────────────

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

  BACKGROUND_REMOVER: {
    key: 'BACKGROUND_REMOVER',
    replicateId:
      '851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc',
    label: 'Background Remover',
    tier: 'standard',
    utility: true,
    fields: {
      prompt: true,
      imageInput: { inputKey: 'image' },
    },
  },

  // ── Upscaler models (6-model expansion) ────────────────────────────────────

  UPSCALE_REAL_ESRGAN: {
    key: 'UPSCALE_REAL_ESRGAN',
    replicateId:
      'nightmareai/real-esrgan:b3ef194191d13140337468c916c2c5b96dd0cb06dffc032a022a31807f6a5ea8',
    label: 'Real-ESRGAN',
    tier: 'budget',
    utility: true,
    fields: {
      imageInput: { inputKey: 'image' },
      scale: {
        inputKey: 'scale',
        values: {
          2: 2,
          4: 4,
        },
      },
    },
  },

  UPSCALE_PRUNA: {
    key: 'UPSCALE_PRUNA',
    replicateId:
      'prunaai/p-image-upscale:b998e77850c393ccddb1a4c32e5c298c91f89f2af9d9fc72bb85e1949fd80ae3',
    label: 'Pruna',
    tier: 'budget',
    utility: true,
    fields: {
      imageInput: { inputKey: 'image' },
      outputFormat: { values: ['png', 'jpg', 'webp'] },
      scale: {
        inputKey: 'factor',
        values: {
          2: 2,
          4: 4,
          8: 8,
        },
        extraInput: { upscale_mode: 'factor' },
      },
    },
  },

  UPSCALE_RECRAFT: {
    key: 'UPSCALE_RECRAFT',
    replicateId: 'recraft-ai/recraft-crisp-upscale',
    label: 'Recraft',
    tier: 'budget',
    utility: true,
    fields: {
      imageInput: { inputKey: 'image' },
    },
  },

  UPSCALE_GOOGLE: {
    key: 'UPSCALE_GOOGLE',
    replicateId: 'google/upscaler',
    label: 'Google Upscaler',
    tier: 'standard',
    utility: true,
    fields: {
      imageInput: { inputKey: 'image' },
      scale: {
        inputKey: 'upscale_factor',
        values: {
          2: 'x2',
          4: 'x4',
        },
      },
    },
  },

  UPSCALE_CLARITY_PRO: {
    key: 'UPSCALE_CLARITY_PRO',
    replicateId:
      'philz1337x/clarity-pro-upscaler:8e33eb474936d75d3ceaa787f3e66f5ba16f35db0853a7697a4ca4e5fc14b6cd',
    label: 'Clarity Pro',
    tier: 'premium',
    utility: true,
    fields: {
      imageInput: { inputKey: 'image' },
      outputFormat: { values: ['png', 'jpg'] },
      scale: {
        inputKey: 'scale_factor',
        values: {
          2: 2,
          4: 4,
          8: 8,
          16: 16,
        },
      },
    },
  },

  UPSCALE_TOPAZ: {
    key: 'UPSCALE_TOPAZ',
    replicateId: 'topazlabs/image-upscale',
    label: 'Topaz',
    tier: 'premium',
    utility: true,
    fields: {
      imageInput: { inputKey: 'image' },
      outputFormat: { values: ['jpg', 'png'] },
      scale: {
        inputKey: 'upscale_factor',
        values: {
          2: '2x',
          4: '4x',
          6: '6x',
        },
      },
    },
  },
};

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

/** Look up a registry entry by model key. Throws if key is not found. */
export function getModelDefinition(key: ModelKey): ModelDefinition {
  const model = MODEL_REGISTRY[key];
  if (!model) {
    throw new Error(`Unknown model key: ${key}`);
  }
  return model;
}

/** Look up a registry entry by Replicate slug (with or without version hash). */
export function findModelByReplicateId(replicateId: string): ModelDefinition | undefined {
  const base = replicateId.split(':')[0];
  return Object.values(MODEL_REGISTRY).find((entry) => {
    const entryBase = entry.replicateId.split(':')[0];
    return entry.replicateId === replicateId || entryBase === base || entryBase === replicateId;
  });
}
