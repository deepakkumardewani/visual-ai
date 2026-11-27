import type { FeedbackTrigger } from '@visual-ai/shared';
import { defineStore, storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';

import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';

import { requestEligibility } from '@/utils/feedbackApi';
import { createLogger } from '@/utils/logger';

const log = createLogger('feedback');

/**
 * Decides when to ask the server whether the rating popup may show. The server owns the real
 * eligibility rules (and marks the prompt as shown on a `true`), so this store only keeps the
 * client from asking at the wrong moment or more than once per page load.
 */
export const useFeedbackStore = defineStore('feedback', () => {
  const generateStore = useGenerateStore();
  const userStore = useUserStore();
  const { isLoading, upscaleInProgress, colorizeInProgress, reviveInProgress, removeBgInProgress } =
    storeToRefs(generateStore);
  const { userId } = storeToRefs(userStore);

  const popupOpen = ref(false);
  const askedTriggers = new Set<FeedbackTrigger>();
  const inFlight = ref(false);
  const pendingTrigger = ref<FeedbackTrigger | null>(null);
  /** True once the server said yes: the prompt was claimed, so we never ask again this load. */
  const promptClaimed = ref(false);
  /** The server said yes while a generation was running; open once everything is idle. */
  const pendingOpen = ref(false);

  const isGenerating = computed(
    () =>
      isLoading.value ||
      upscaleInProgress.value ||
      colorizeInProgress.value ||
      reviveInProgress.value ||
      removeBgInProgress.value,
  );

  async function ask(trigger: FeedbackTrigger) {
    // Marked before the call so a failed request is not retried within this page load.
    askedTriggers.add(trigger);
    inFlight.value = true;
    try {
      const eligible = await requestEligibility(trigger);
      if (!eligible) return;
      promptClaimed.value = true;
      // A generation may have started during the round-trip; the slot is already claimed, so defer.
      if (isGenerating.value) pendingOpen.value = true;
      else popupOpen.value = true;
    } catch (error) {
      log.warn('eligibility check failed', { error, trigger });
    } finally {
      inFlight.value = false;
    }
  }

  /** Call at a happy moment (result ready, image downloaded). Safe to call repeatedly. */
  async function maybePrompt(trigger: FeedbackTrigger) {
    if (!userId.value) return;
    if (promptClaimed.value || inFlight.value || askedTriggers.has(trigger)) return;
    if (isGenerating.value) {
      pendingTrigger.value ??= trigger;
      return;
    }
    await ask(trigger);
  }

  watch(isGenerating, (generating) => {
    if (generating) return;
    if (pendingOpen.value) {
      pendingOpen.value = false;
      popupOpen.value = true;
      return;
    }
    if (!pendingTrigger.value) return;
    const trigger = pendingTrigger.value;
    pendingTrigger.value = null;
    void maybePrompt(trigger);
  });

  function closePopup() {
    popupOpen.value = false;
  }

  return { popupOpen, isGenerating, maybePrompt, closePopup };
});
