<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "vue-clerk";

import { type ImageBody } from "@/types";

import { useAppStore } from "@/stores/app";
import { useAsideStore } from "@/stores/aside";
import { useDialogStore } from "@/stores/dialog";
import { useGenerateStore } from "@/stores/generate";
import { useUserStore } from "@/stores/user";

import { useDashboardMotion } from "@/composables/useDashboardMotion";

const generateStore = useGenerateStore();
const appStore = useAppStore();
const dialogStore = useDialogStore();
const asideStore = useAsideStore();
const userStore = useUserStore();

const { isSignedIn } = useUser();
const { credits } = storeToRefs(userStore);
const { progressUrl } = storeToRefs(appStore);
const { isLoading } = storeToRefs(generateStore);
const { aspectRatio, noOfOutputs, outputQuality, imageFormat, mode, typingPrompt } =
  storeToRefs(asideStore);

const { pressable } = useDashboardMotion();

const isPremium = computed(() => mode.value.tier === "premium");
const isDisabled = computed(() => typingPrompt.value === "" || isLoading.value);

async function generateImage() {
  if (!isSignedIn.value) {
    dialogStore.showSignup();
    return;
  }

  if (credits.value === 0) {
    dialogStore.showLowCredits();
    return;
  }

  const jobId = uuidv4();
  const input: ImageBody = {
    jobId,
    modelId: mode.value.id,
    imageType: aspectRatio.value.type,
    modelName: mode.value.title,
    prompt: typingPrompt.value,
    noOfOutputs: noOfOutputs.value,
    outputQuality: outputQuality.value === 0 ? 70 : 100,
    aspectRatio: aspectRatio.value.title,
    outputFormat: imageFormat.value.title.toLowerCase(),
  };

  generateStore.generateImage(input);

  progressUrl.value = `${import.meta.env.VITE_API_BASEPATH}/progress?jobId=${jobId}`;
  appStore.imageOpen();
}
</script>

<template>
  <button
    type="button"
    data-testid="generate-arrow"
    :class="[
      'tw-inline-flex tw-h-11 tw-w-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-text-canvas focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[3px] disabled:tw-cursor-not-allowed disabled:tw-opacity-40 motion-reduce:tw-transition-none',
      pressable,
      isPremium
        ? 'tw-bg-gradient-gold tw-shadow-gold-glow focus-visible:tw-outline-gold'
        : 'tw-bg-accent tw-shadow-accent focus-visible:tw-outline-accent hover:tw-bg-accent-hover',
    ]"
    :data-premium-cue="isPremium ? 'true' : undefined"
    :disabled="isDisabled"
    :aria-busy="isLoading"
    aria-label="Generate image"
    @click="generateImage"
  >
    <span
      v-if="isLoading"
      data-testid="generate-arrow-spinner"
      class="tw-inline-block tw-h-4 tw-w-4 tw-animate-spin tw-rounded-full tw-border-2 tw-border-canvas/30 tw-border-t-canvas motion-reduce:tw-animate-none"
      aria-hidden="true"
    />
    <font-awesome-icon v-else icon="arrow-right" class="tw-h-4 tw-w-4" aria-hidden="true" />
  </button>
</template>
