import { z } from 'zod';

import { MEDIA_PROMPT_MAX_CHARS } from '../models/media-limits.js';

/** Fields every media request carries; cost and userId are never accepted from the client. */
const mediaRequestBase = {
  jobId: z.string().uuid('jobId must be a UUID'),
  modelKey: z.string().min(1, 'modelKey is required'),
};

export const MusicRequestSchema = z.object({
  ...mediaRequestBase,
  prompt: z.string().min(1, 'Prompt is required').max(MEDIA_PROMPT_MAX_CHARS),
  negativePrompt: z.string().max(MEDIA_PROMPT_MAX_CHARS).optional(),
  seed: z.number().int().optional(),
});

export type MusicRequest = z.infer<typeof MusicRequestSchema>;
