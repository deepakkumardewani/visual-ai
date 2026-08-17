import { z } from 'zod';

export const CreateSavedPromptSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name must be 80 characters or fewer'),
  prompt: z
    .string()
    .trim()
    .min(1, 'Prompt is required')
    .max(2000, 'Prompt must be 2000 characters or fewer'),
  modelId: z.string().trim().min(1).max(120).optional(),
});

export type CreateSavedPrompt = z.infer<typeof CreateSavedPromptSchema>;
