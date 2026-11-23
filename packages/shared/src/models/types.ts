export type Tier = 'budget' | 'standard' | 'premium';

export type EnhanceMode = 'on' | 'off' | 'auto';

export const ENHANCE_MODES = ['on', 'off', 'auto'] as const satisfies readonly EnhanceMode[];

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
  | 'OLD_PHOTOS'
  | 'BACKGROUND_REMOVER';

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
  | 'GPT_IMAGE_2'
  | 'UPSCALE_REAL_ESRGAN'
  | 'UPSCALE_PRUNA'
  | 'UPSCALE_RECRAFT'
  | 'UPSCALE_GOOGLE'
  | 'UPSCALE_CLARITY_PRO'
  | 'UPSCALE_TOPAZ'
  | MediaModelKey;

/** Media Studio models (audio, speech, video, tools); priced by `getMediaCreditCost`. */
export type MediaModelKey =
  | 'LYRIA_2'
  | 'MINIMAX_MUSIC_26'
  | 'MINIMAX_MUSIC_15'
  | 'STABLE_AUDIO_25'
  | 'IMAGE_WATERMARK'
  | 'AUTOCAPTION'
  | 'VIDEO_WATERMARK'
  | 'INWORLD_TTS_2'
  | 'INWORLD_TTS_15_MAX'
  | 'MINIMAX_SPEECH_28_HD'
  | 'MINIMAX_SPEECH_28_TURBO'
  | 'CHATTERBOX_TURBO'
  | 'P_VIDEO'
  | 'WAN_3'
  | 'MINIMAX_VOICE_CLONE';

export type ModelKey = LegacyModelKey | CatalogModelKey;

/** Every key that is not a media model, i.e. priced by the flat `getCreditCost` table. */
export type ImageModelKey = Exclude<ModelKey, MediaModelKey>;

export type ModelKind = 'image' | 'music' | 'song' | 'tts' | 'video' | 'tool';

/** Voice catalogs a TTS model draws from (lists live with the Speech feature). */
export type VoiceCatalogKey = 'inworld' | 'minimax' | 'chatterbox';

/** Pricing unit of a media model's Replicate cost driver. */
export type MediaPricingUnit = 'file' | 'second' | 'kChars' | 'kTokens' | 'run';

export interface MediaPricing {
  unit: MediaPricingUnit;
  /** Replicate cost in USD per unit; the default/base rate when `byResolution` is set. */
  usd: number;
  /** Per-second rate by resolution label (video). */
  byResolution?: Record<string, number>;
  /** Per-second rate by resolution label when the draft preview is on (P-Video). */
  draftByResolution?: Record<string, number>;
  /** Billing block length in seconds of input (Autocaption, gap G6). */
  blockSec?: number;
}

/** Maps one app-level field to the Replicate input key that carries it. */
export interface MediaInputField {
  inputKey: string;
}

/**
 * Values the server always sets (`send`) and keys it must never send (`neverSend`),
 * independent of user input. Asserted for every media model by unit test.
 */
export interface MediaFixedInputs {
  send?: Record<string, unknown>;
  neverSend?: readonly string[];
  /** Inputs always set from user input so the vendor default never reaches Replicate. */
  alwaysSend?: readonly string[];
}

export interface MediaModelConfig {
  durationSec?: { min: number; max: number; default: number };
  lyrics?: { min: number; max: number };
  prompt?: { min: number; max: number };
  textLimit?: number;
  voices?: VoiceCatalogKey;
  pricing: MediaPricing;
  /** App field name -> Replicate input key; payload building reads this, never per-model branches. */
  inputs: Record<string, MediaInputField>;
  fixedInputs: MediaFixedInputs;
  /** ISO date the pricing and schema were last re-read from the Replicate model page. */
  pricesVerifiedOn: string;
}

export interface ModelDefinition {
  key: ModelKey;
  /** Omitted on image models; read through `getModelKind`. */
  kind?: ModelKind;
  /** Present on every non-image (media) model. */
  media?: MediaModelConfig;
  replicateId: `${string}/${string}` | `${string}/${string}:${string}`;
  label: string;
  tier: Tier;
  pricePerImage?: number;
  /** true if this is a utility model (upscale, colorize, revive, etc.) not a generation model */
  utility?: boolean;
  fields: {
    prompt?: true;
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
      /** When true, Replicate expects an array at `inputKey` (verified OpenAPI schema). */
      array: boolean;
      max?: number;
    };
    /** Scale/upscale factor with model-specific param name and value mapping */
    scale?: {
      inputKey: string;
      values: Record<number, string | number>;
      extraInput?: Record<string, unknown>;
    };
    /** Native prompt enhancement hook — when present, skips local enhancement */
    promptEnhance?: { inputKey: string };
  };
}

/** Legacy and image entries declare no `kind`, so they default to 'image'. */
export function getModelKind(model: Pick<ModelDefinition, 'kind'>): ModelKind {
  return model.kind ?? 'image';
}
