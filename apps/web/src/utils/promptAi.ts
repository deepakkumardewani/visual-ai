/**
 * Placeholder AI prompt utilities.
 *
 * These functions simulate async AI endpoints with a fixed delay and mock
 * responses. Replace with real API calls when backend endpoints ship.
 */

import PROMPTS from '@/utils/prompts.json';
import REALISTIC_PROMPTS from '@/utils/realisticPrompts.json';
import { MODEL_IDS } from '@visual-ai/shared';

const MOCK_DELAY_MS = 1200;

const EMPTY_PROMPT_FALLBACK =
  'A cinematic portrait with soft golden hour lighting, shallow depth of field, and rich atmospheric haze.';

export interface ImprovePromptResult {
  text: string;
}

export interface DescribeImageResult {
  text: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Placeholder: enriches the current prompt with more descriptive detail. */
export async function improvePrompt(currentPrompt: string): Promise<ImprovePromptResult> {
  await delay(MOCK_DELAY_MS);

  const trimmed = currentPrompt.trim();
  if (!trimmed) {
    return { text: EMPTY_PROMPT_FALLBACK };
  }

  return {
    text: `${trimmed}, enhanced with vivid detail, cinematic lighting, and professional composition.`,
  };
}

/** Placeholder: generates a text description from an uploaded image file. */
export async function describeImage(file: File): Promise<DescribeImageResult> {
  await delay(MOCK_DELAY_MS);

  const baseName = file.name.replace(/\.[^.]+$/, '');
  return {
    text: `A detailed image description based on ${baseName}: rich colors, balanced composition, and striking visual elements.`,
  };
}

/** Picks a random prompt from the existing JSON catalogs (offline fallback). */
export function pickRandomPrompt(modelId: string): string {
  const pool =
    modelId === MODEL_IDS.FLUX_REALISM ? (REALISTIC_PROMPTS as string[]) : (PROMPTS as string[]);

  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
