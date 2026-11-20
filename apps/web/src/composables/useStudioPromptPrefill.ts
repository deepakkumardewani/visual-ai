import { GenerateRequestSchema } from '@visual-ai/shared';
import { useRoute, useRouter, type LocationQuery } from 'vue-router';

import { useAsideStore } from '@/stores/aside';
import { useGenerateStore } from '@/stores/generate';

import { APP_SURFACE } from '@/utils/dashboardRoutes';

/** Query key the landing "Try this prompt" link sets on the create route. */
export const PROMPT_QUERY_KEY = 'prompt';

/** The API's own prompt limit, so a prefilled prompt can always be submitted as is. */
const PROMPT_MAX_LENGTH = readPromptMaxLength();

function readPromptMaxLength(): number {
  const max = GenerateRequestSchema.shape.prompt.maxLength;
  if (max === null) throw new Error('GenerateRequestSchema.prompt must set a max length');
  return max;
}

/** First string value of an untrusted query param, trimmed and capped; '' when absent. */
export function readPromptParam(query: LocationQuery): string {
  const raw = query[PROMPT_QUERY_KEY];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, PROMPT_MAX_LENGTH);
}

/**
 * Reads `?prompt=` once on entering the studio, fills the composer with it and
 * drops the param from the URL. It only fills the text box: nothing here
 * submits or starts a generation. Call after `useComposerPersistence` so the
 * shared prompt wins over the one restored from storage.
 */
export function useStudioPromptPrefill(): void {
  const route = useRoute();
  // Partial route stand-ins (the page's unit tests) carry no `query`; treat that as no param.
  const current: LocationQuery = route.query ?? {};
  if (route.name !== APP_SURFACE.CREATE || !(PROMPT_QUERY_KEY in current)) return;

  const prompt = readPromptParam(current);
  if (prompt) {
    useAsideStore().typingPrompt = prompt;
    useGenerateStore().promptText = prompt;
  }

  const query = Object.fromEntries(
    Object.entries(current).filter(([key]) => key !== PROMPT_QUERY_KEY),
  );
  useRouter()
    .replace({ name: route.name, params: route.params, query, hash: route.hash })
    .catch((error: unknown) => {
      console.error('[useStudioPromptPrefill] Could not clear the prompt param', { error });
    });
}
