/**
 * AI prompt utilities — calls backend `/prompt/*` endpoints via useFetch.
 * Random generation falls back to local JSON catalogs when the API fails.
 */

import { useFetch } from '@/composables/useFetch';
import { createLogger } from '@/utils/logger';
import PROMPTS from '@/utils/prompts.json';
import REALISTIC_PROMPTS from '@/utils/realisticPrompts.json';
import { MODEL_IDS } from '@visual-ai/shared';

const log = createLogger('promptAi');

export interface ImprovePromptResult {
  text: string;
}

export interface DescribeImageResult {
  text: string;
}

type PromptTextResponse = {
  text?: string;
};

function extractText(
  data: { value: PromptTextResponse | null },
  error: { value: unknown },
): string | null {
  if (error.value) return null;
  const text = data.value?.text;
  return typeof text === 'string' && text.trim().length > 0 ? text : null;
}

/** Enriches the current prompt via POST `/prompt/improve`. */
export async function improvePrompt(currentPrompt: string): Promise<ImprovePromptResult> {
  const { data, error } = await useFetch('/prompt/improve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      mode: 'cors',
    },
    body: JSON.stringify({ prompt: currentPrompt }),
  }).json<PromptTextResponse>();

  const text = extractText(data, error);
  if (!text) {
    throw new Error('Failed to improve prompt. Please try again.');
  }

  return { text };
}

/** Generates a text description from an uploaded image via POST `/prompt/describe`. */
export async function describeImage(file: File): Promise<DescribeImageResult> {
  const formData = new FormData();
  formData.append('image', file);

  const { data, error } = await useFetch('/prompt/describe', {
    method: 'POST',
    body: formData,
  }).json<PromptTextResponse>();

  const text = extractText(data, error);
  if (!text) {
    throw new Error('Failed to describe image. Please try again.');
  }

  return { text };
}

/**
 * Generates a random prompt via POST `/prompt/random`.
 * On API failure, falls back to the local JSON catalog so the UI never dead-ends.
 */
export async function generateRandomPrompt(modelId: string): Promise<string> {
  try {
    const { data, error } = await useFetch('/prompt/random', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        mode: 'cors',
      },
      body: JSON.stringify({}),
    }).json<PromptTextResponse>();

    const text = extractText(data, error);
    if (text) return text;

    log.warn('Random prompt API failed, falling back to catalog', { error: error.value });
  } catch (err) {
    log.warn('Random prompt API failed, falling back to catalog', { error: err });
  }

  return pickRandomPrompt(modelId);
}

/** Picks a random prompt from the existing JSON catalogs (offline fallback). */
export function pickRandomPrompt(modelId: string): string {
  const pool =
    modelId === MODEL_IDS.FLUX_REALISM ? (REALISTIC_PROMPTS as string[]) : (PROMPTS as string[]);

  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
