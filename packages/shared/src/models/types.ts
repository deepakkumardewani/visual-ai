export type Tier = 'budget' | 'standard' | 'premium';

export type ModelKey =
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
    outputFormat?: { values: Array<'png' | 'jpg' | 'webp'> };
    /** output_quality slider — Flux-1 family only */
    outputQuality?: { min: number; max: number };
    numOutputs?: {
      max: number;
      inputKey: 'num_outputs' | 'max_images' | 'number_of_images';
    };
    /** Fixed-string resolution choices, e.g. "1024x1024" */
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
