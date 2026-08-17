<script setup lang="ts">
import { MODEL_REGISTRY } from '@visual-ai/shared';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from 'vue-clerk';

import { type ImageBody, FeatureType } from '@/types';

import { useAppStore } from '@/stores/app';
import { useAsideStore } from '@/stores/aside';
import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';

import { useDashboardMotion } from '@/composables/useDashboardMotion';
import { useFeatureSubmit } from '@/composables/useFeatureSubmit';

import { getGenerationCreditCost } from '@/utils/generationCredits';

const generateStore = useGenerateStore();
const appStore = useAppStore();
const dialogStore = useDialogStore();
const asideStore = useAsideStore();
const userStore = useUserStore();

const { isSignedIn } = useUser();
const { progressUrl } = storeToRefs(appStore);
const { isLoading } = storeToRefs(generateStore);
const { aspectRatio, noOfOutputs, outputQuality, imageFormat, mode, typingPrompt } =
  storeToRefs(asideStore);

const { pressable } = useDashboardMotion();

const isPremium = computed(() => mode.value.tier === 'premium');
const creditCost = computed(() => getGenerationCreditCost(noOfOutputs.value));
const canAfford = computed(() => userStore.canAffordOutputs(noOfOutputs.value));
const isLowCredits = computed(() => Boolean(isSignedIn.value) && !canAfford.value);
const isDisabled = computed(() => typingPrompt.value === '' || isLoading.value);

async function generateImage() {
  if (isDisabled.value) return;

  if (!isSignedIn.value) {
    dialogStore.showSignup();
    return;
  }

  if (!canAfford.value) {
    dialogStore.showLowCredits();
    return;
  }

  const jobId = uuidv4();
  const supportsOutputQuality = Boolean(
    MODEL_REGISTRY[mode.value.id as keyof typeof MODEL_REGISTRY]?.fields.outputQuality,
  );
  const input: ImageBody = {
    jobId,
    modelId: mode.value.id,
    imageType: aspectRatio.value.type,
    modelName: mode.value.title,
    prompt: typingPrompt.value,
    noOfOutputs: noOfOutputs.value,
    ...(supportsOutputQuality ? { outputQuality: outputQuality.value === 0 ? 70 : 100 } : {}),
    aspectRatio: aspectRatio.value.title,
    outputFormat: imageFormat.value.title.toLowerCase(),
  };

  generateStore.generateImage(input);

  progressUrl.value = `${import.meta.env.VITE_API_BASEPATH}/progress?jobId=${jobId}`;
  appStore.imageOpen();
}

useFeatureSubmit(FeatureType.IMAGE, {
  canSubmit: () => !isDisabled.value && !isLowCredits.value,
  submit: generateImage,
});
</script>

<template>
  <div data-testid="generate-cta-wrap" class="tw-inline-flex tw-items-center tw-gap-1">
    <button
      type="button"
      data-testid="generate-cta"
      :class="[
        'tw-inline-flex tw-min-h-[38px] tw-items-center tw-gap-2 tw-rounded-lg tw-px-4 tw-py-1.5 tw-text-body-sm tw-font-semibold tw-text-canvas tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.35)] tw-transition-[filter,background-color] tw-duration-fast tw-ease-soft focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[3px] disabled:tw-cursor-not-allowed disabled:tw-opacity-40 disabled:tw-shadow-none motion-reduce:tw-transition-none',
        pressable,
        isPremium
          ? 'tw-bg-gradient-gold hover:tw-brightness-110 focus-visible:tw-outline-gold'
          : 'tw-bg-accent focus-visible:tw-outline-accent hover:tw-bg-accent-hover',
        isLowCredits && !isDisabled ? 'tw-opacity-80' : '',
      ]"
      :data-premium-cue="isPremium ? 'true' : undefined"
      :disabled="isDisabled"
      :aria-busy="isLoading"
      :aria-label="isLowCredits ? 'Not enough credits to generate' : 'Generate image'"
      :title="isLowCredits ? `Needs ${creditCost} credits` : undefined"
      @click="generateImage"
    >
      <span
        v-if="isLoading"
        data-testid="generate-cta-spinner"
        class="tw-inline-block tw-h-4 tw-w-4 tw-animate-spin tw-rounded-full tw-border-2 tw-border-canvas/30 tw-border-t-canvas motion-reduce:tw-animate-none"
        aria-hidden="true"
      />
      <template v-else>
        <span>{{ isLowCredits ? 'Low credits' : 'Generate' }}</span>
        <span
          data-testid="generate-cta-credits"
          class="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-sm tw-bg-canvas/20 tw-px-2 tw-py-0.5 tw-text-eyebrow tw-font-bold"
          :class="{ 'tw-ring-1 tw-ring-canvas/50': isLowCredits }"
        >
          <font-awesome-icon icon="coins" class="tw-h-3 tw-w-3" aria-hidden="true" />
          {{ creditCost }}
        </span>
      </template>
    </button>
  </div>
</template>
