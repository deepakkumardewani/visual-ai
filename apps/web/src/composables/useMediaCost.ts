import { getMediaCreditCost, type MediaCostInput, type MediaModelKey } from '@visual-ai/shared';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';

import { useUserStore } from '@/stores/user';

import { canAffordGeneration } from '@/utils/generationCredits';
import { createLogger } from '@/utils/logger';

const log = createLogger('mediaCost');

/** Billed on a quantity the client can only approximate (character count after tag expansion). */
const ESTIMATED_COST_MODELS: readonly MediaModelKey[] = [
  'MINIMAX_SPEECH_28_HD',
  'MINIMAX_SPEECH_28_TURBO',
];
/** P-Video bills audio-driven runs on the stored audio duration, which is known only server-side (G1). */
const AUDIO_DRIVEN_ESTIMATED_MODEL: MediaModelKey = 'P_VIDEO';

export interface MediaCostOptions {
  modelKey: MaybeRefOrGetter<MediaModelKey>;
  input: MaybeRefOrGetter<MediaCostInput>;
  /** True when the P-Video run takes its length from an audio file. */
  audioDriven?: MaybeRefOrGetter<boolean>;
}

/** Reactive wrapper over getMediaCreditCost, the same function the API prices jobs with. */
export function useMediaCost(options: MediaCostOptions) {
  const userStore = useUserStore();

  const cost = computed<number | null>(() => {
    const modelKey = toValue(options.modelKey);
    try {
      return getMediaCreditCost(modelKey, toValue(options.input));
    } catch (error) {
      // An input that does not fit the model's pricing unit has no price yet; the surface shows no badge.
      log.warn('media cost unavailable', { modelKey, error });
      return null;
    }
  });

  const estimated = computed(() => {
    const modelKey = toValue(options.modelKey);
    if (ESTIMATED_COST_MODELS.includes(modelKey)) return true;
    return modelKey === AUDIO_DRIVEN_ESTIMATED_MODEL && Boolean(toValue(options.audioDriven));
  });

  const balance = computed(() => (userStore.dailyCredits || 0) + (userStore.credits || 0));

  const canAfford = computed(
    () => cost.value !== null && canAffordGeneration(balance.value, { cost: cost.value }),
  );

  return { cost, estimated, balance, canAfford };
}
