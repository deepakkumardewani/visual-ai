// API request/response types

export interface AIImageInput {
  prompt: string;
  output_quality: number;
  num_outputs?: number;
  aspect_ratio: string;
  output_format: string;
}

export interface UpscaleInput {
  image: string;
  prompt: string;
  creativity: number;
  scale_factor: number;
  negative_prompt: string;
  output_format: string;
}

export interface ColorizeInput {
  image: string;
}

export interface ReviveInput {
  img: string;
}

export interface Body {
  userId: string;
  jobId: string;
  modelId?: string;
  filePath?: string;
  name?: string;
  aiImagePublicId?: string;
  modelName?: string;
  numOfOutputs?: number;
  outputQuality?: number;
  outputFormat?: string;
  originalPublicId?: string;
  enhancedPublicId?: string;
  imageType?: string;
  resolution?: string;
  aspectRatio?: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  prompt?: string;
  creativity?: number;
  scale?: number;
  negativePrompt?: string;
  /** Style preset id (e.g. 'dynamic', 'photography') — t2i only */
  styleId?: string;
  /** Enhancement mode ('on', 'off', 'auto') — t2i only */
  enhanceMode?: string;
}

export interface Props {
  body: Body;
  filePath: string;
  fileName: string;
}
