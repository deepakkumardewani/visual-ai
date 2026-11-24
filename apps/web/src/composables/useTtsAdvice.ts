import type { TtsDoc } from '@visual-ai/shared';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';

/** Average conversational narration pace, used only for the spoken-length estimate. */
export const SPOKEN_WORDS_PER_MIN = 150;
/** Share of the limit at which the advisor starts warning. */
export const NEAR_LIMIT_RATIO = 0.9;
const SECONDS_PER_MIN = 60;

export type AdviceLevel = 'ok' | 'near' | 'over';

export interface TtsAdviceOptions {
  doc: MaybeRefOrGetter<TtsDoc>;
  /** Billed character count: the serialized text length, as the server counts it. */
  chars: MaybeRefOrGetter<number>;
  limit: MaybeRefOrGetter<number>;
  estimatedCost: MaybeRefOrGetter<boolean>;
}

export function countWords(doc: TtsDoc): number {
  const spoken = doc.map((node) => (node.type === 'text' ? node.text : ' ')).join('');
  return spoken.split(/\s+/).filter(Boolean).length;
}

export function estimateSpokenSeconds(doc: TtsDoc): number {
  const pauses = doc.reduce((sum, node) => sum + (node.type === 'pause' ? node.seconds : 0), 0);
  return Math.round((countWords(doc) / SPOKEN_WORDS_PER_MIN) * SECONDS_PER_MIN + pauses);
}

export function formatSpokenLength(seconds: number): string {
  if (seconds < SECONDS_PER_MIN) return `${seconds} s`;
  const minutes = Math.floor(seconds / SECONDS_PER_MIN);
  const rest = seconds % SECONDS_PER_MIN;
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`;
}

/** Advice only: nothing here ever disables Generate. */
export function useTtsAdvice(options: TtsAdviceOptions) {
  const seconds = computed(() => estimateSpokenSeconds(toValue(options.doc)));
  const spokenLabel = computed(() => formatSpokenLength(seconds.value));
  const remaining = computed(() => toValue(options.limit) - toValue(options.chars));
  const level = computed<AdviceLevel>(() => {
    if (remaining.value < 0) return 'over';
    return toValue(options.chars) >= toValue(options.limit) * NEAR_LIMIT_RATIO ? 'near' : 'ok';
  });
  const isEstimated = computed(() => toValue(options.estimatedCost));

  return { seconds, spokenLabel, remaining, level, isEstimated };
}
