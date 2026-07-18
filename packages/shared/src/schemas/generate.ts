import { z } from 'zod';

export const GenerateRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(1000),
  output_quality: z.number().min(1).max(100).optional().default(50),
  num_outputs: z.number().min(1).max(10).optional().default(1),
  aspect_ratio: z.string().optional().default('1:1'),
  output_format: z.string().optional().default('jpeg'),
  model: z.string().optional(),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

export const UpscaleRequestSchema = z.object({
  image: z.string().min(1, 'Image URL is required'),
  prompt: z.string().optional(),
  creativity: z.number().min(0).max(10).optional().default(5),
  scale_factor: z.number().min(1).max(4).optional().default(2),
  negative_prompt: z.string().optional(),
  output_format: z.string().optional().default('jpeg'),
});

export type UpscaleRequest = z.infer<typeof UpscaleRequestSchema>;

export const ColorizeRequestSchema = z.object({
  image: z.string().min(1, 'Image URL is required'),
  prompt: z.string().optional(),
  output_format: z.string().optional().default('jpeg'),
});

export type ColorizeRequest = z.infer<typeof ColorizeRequestSchema>;

export const ReviveRequestSchema = z.object({
  img: z.string().min(1, 'Image URL is required'),
  prompt: z.string().optional(),
  output_format: z.string().optional().default('jpeg'),
});

export type ReviveRequest = z.infer<typeof ReviveRequestSchema>;
