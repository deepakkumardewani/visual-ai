export type Tier = 'budget' | 'standard' | 'premium';

/** Legacy generation + utility keys (pre-catalog expansion). */
export type LegacyModelKey =
  | 'FLUX_QUICK'
  | 'FLUX_BASIC'
  | 'FLUX_PRO'
  | 'FLUX_1_1_PRO'
  | 'FLUX_REALISM'
  | 'UPSCALE_IMAGE'
  | 'COLORIZE_BASIC'
  | 'COLORIZE_ADVANCED'
  | 'REVIVE'
  | 'OLD_PHOTOS';

/**
 * Expanded catalog keys from MODELS_COMPARISON.md §2–§4.
 * Onboarding these into the registry is required so FE sidebar visibility and
 * BE `buildModelInput` share one source of truth.
 */
export type CatalogModelKey =
  | 'FLUX_FAST'
  | 'P_IMAGE'
  | 'Z_IMAGE_TURBO'
  | 'GROK_IMAGINE'
  | 'GROK_IMAGINE_QUALITY'
  | 'SEEDREAM_4'
  | 'FLUX_2_DEV'
  | 'FLUX_2_PRO'
  | 'FLUX_KONTEXT_PRO'
  | 'FLUX_2_MAX'
  | 'FLUX_KONTEXT_MAX'
  | 'NANO_BANANA_2'
  | 'IMAGEN_4_ULTRA'
  | 'NANO_BANANA_PRO'
  | 'GPT_IMAGE_2';

export type ModelKey = LegacyModelKey | CatalogModelKey;

export interface ModelDefinition {
  key: ModelKey;
  replicateId: `${string}/${string}` | `${string}/${string}:${string}`;
  label: string;
  tier: Tier;
  pricePerImage?: number;
  /** true if this is a utility model (upscale, colorize, revive, etc.) not a generation model */
  utility?: boolean;
  fields: {
    prompt: true;
    aspectRatio?: { values: string[] };
    /** OpenAPI may use `jpeg` (GPT Image 2) or `jpg` — store the API value as-is */
    outputFormat?: { values: Array<'png' | 'jpg' | 'webp' | 'jpeg'> };
    /** output_quality slider — Flux-1 family only */
    outputQuality?: { min: number; max: number };
    numOutputs?: {
      max: number;
      inputKey: 'num_outputs' | 'max_images' | 'number_of_images';
    };
    /** Fixed-string resolution choices, e.g. "1K" / "1024x1024" */
    resolution?: {
      values: string[];
      inputKey: 'resolution' | 'size' | 'image_size';
    };
    /** Raw width/height models that accept integer dimensions */
    dimensions?: { min: number; max: number };
    imageInput?: {
      inputKey: 'image' | 'image_input' | 'input_image' | 'input_images';
      max?: number;
    };
  };
}
