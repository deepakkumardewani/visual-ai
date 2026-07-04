<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref } from "vue";

import { useDashboardMotion } from "@/composables/useDashboardMotion";
import { useAsideStore } from "@/stores/aside";

import ComposerTextarea from "@/components/Dashboard/Composer/ComposerTextarea.vue";
import GenerateCTA from "@/components/Dashboard/Composer/GenerateCTA.vue";

import { describeImage } from "@/utils/promptAi";

const asideStore = useAsideStore();
const { typingPrompt } = storeToRefs(asideStore);
const { interactiveTransition } = useDashboardMotion();

const fileInputRef = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);

function openUpload() {
  if (isUploading.value) return;
  fileInputRef.value?.click();
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  isUploading.value = true;
  try {
    const result = await describeImage(file);
    typingPrompt.value = result.text;
  } finally {
    isUploading.value = false;
  }
}
</script>

<template>
  <div
    data-testid="prompt-bar"
    class="tw-flex tw-items-start tw-gap-2 tw-rounded-lg tw-border tw-border-hairline tw-bg-surface-1 tw-p-2 sm:tw-gap-3 sm:tw-p-3"
  >
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="tw-sr-only"
      tabindex="-1"
      aria-hidden="true"
      @change="handleFileChange"
    />

    <button
      type="button"
      data-testid="prompt-bar-upload"
      :class="[
        'tw-mt-0.5 tw-inline-flex tw-min-h-[44px] tw-min-w-[44px] tw-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2 tw-text-ink-muted hover:tw-border-accent/40 hover:tw-text-accent focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px] disabled:tw-opacity-50',
        interactiveTransition,
      ]"
      :disabled="isUploading"
      :aria-busy="isUploading"
      aria-label="Upload image to describe"
      @click="openUpload"
    >
      <font-awesome-icon icon="upload" class="tw-h-4 tw-w-4" aria-hidden="true" />
    </button>

    <div class="tw-min-w-0 tw-flex-1">
      <ComposerTextarea embedded />
    </div>

    <GenerateCTA class="tw-mt-0.5 tw-shrink-0" />
  </div>
</template>
