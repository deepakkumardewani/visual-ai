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

import { useFeatureSubmit } from '@/composables/useFeatureSubmit';

import FeatureCta from '@/components/Dashboard/FeatureCta.vue';

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

const isPremium = computed(() => mode.value.tier === 'premium');
const costPerImage = computed(() => mode.value.creditCost ?? 1);
const creditCost = computed(() => getGenerationCreditCost(noOfOutputs.value, costPerImage.value));
const canAfford = computed(() => userStore.canAffordOutputs(noOfOutputs.value, costPerImage.value));
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
    <FeatureCta
      label="Generate"
      test-id="generate-cta"
      credits-test-id="generate-cta-credits"
      :cost="creditCost"
      :loading="isLoading"
      :disabled="isDisabled"
      :premium="isPremium"
      :low-credits="isLowCredits"
      :aria-label="isLowCredits ? 'Not enough credits to generate' : 'Generate image'"
      @click="generateImage"
    />
  </div>
</template>
