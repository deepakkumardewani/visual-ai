<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

import { useDashboardMotion } from '@/composables/useDashboardMotion';
import { useAsideStore } from '@/stores/aside';
import { useGenerateStore } from '@/stores/generate';

import ComposerTextarea from '@/components/Dashboard/Composer/ComposerTextarea.vue';
import GenerateCTA from '@/components/Dashboard/Composer/GenerateCTA.vue';
import PromptAiMenu from '@/components/Dashboard/ModelPicker/PromptAiMenu.vue';

import { describeImage } from '@/utils/promptAi';

const asideStore = useAsideStore();
const generateStore = useGenerateStore();
const { typingPrompt } = storeToRefs(asideStore);
const { promptText } = storeToRefs(generateStore);
const { interactiveTransition } = useDashboardMotion();

const fileInputRef = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const isMultiline = ref(false);
const isAiLoading = ref(false);

function openUpload() {
  if (isUploading.value) return;
  fileInputRef.value?.click();
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  isUploading.value = true;
  try {
    const result = await describeImage(file);
    typingPrompt.value = result.text;
  } finally {
    isUploading.value = false;
  }
}

function applyPrompt(text: string) {
  typingPrompt.value = text;
  promptText.value = text;
}
</script>

<template>
  <div
    data-testid="prompt-bar"
    class="tw-overflow-visible tw-rounded-2xl tw-border tw-border-hairline tw-bg-surface-1 tw-p-2.5 tw-shadow-[0_1px_2px_rgba(0,0,0,0.25)] tw-transition-[border-color,box-shadow] tw-duration-base focus-within:tw-border-accent focus-within:tw-shadow-[0_1px_2px_rgba(0,0,0,0.25),0_8px_18px_-12px_rgba(201,138,90,0.6)] sm:tw-p-3 motion-reduce:tw-transition-none"
  >
    <div
      :class="['tw-flex tw-gap-2 sm:tw-gap-3', isMultiline ? 'tw-items-start' : 'tw-items-center']"
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
          'tw-inline-flex tw-min-h-[38px] tw-min-w-[38px] tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-hairline/60 tw-bg-surface-2/60 tw-text-ink-muted hover:tw-border-accent/40 hover:tw-bg-surface-2 hover:tw-text-accent focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px] disabled:tw-opacity-50',
          interactiveTransition,
        ]"
        :disabled="isUploading || isAiLoading"
        :aria-busy="isUploading"
        aria-label="Upload image to describe"
        @click="openUpload"
      >
        <font-awesome-icon icon="upload" class="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
      </button>

      <div class="tw-min-w-0 tw-flex-1">
        <ComposerTextarea
          embedded
          hide-ai-menu
          :ai-loading="isAiLoading"
          @multiline-change="isMultiline = $event"
        />
      </div>

      <div v-if="!isMultiline" class="tw-flex tw-shrink-0 tw-items-center tw-gap-2">
        <PromptAiMenu
          :current-prompt="typingPrompt"
          :disabled="isAiLoading"
          @apply-prompt="applyPrompt"
          @loading="isAiLoading = $event"
        />
        <GenerateCTA />
      </div>
    </div>

    <div
      v-if="isMultiline"
      class="tw-mt-2 tw-flex tw-items-center tw-justify-end tw-gap-2 tw-pl-12 sm:tw-pl-[3.25rem]"
    >
      <PromptAiMenu
        :current-prompt="typingPrompt"
        :disabled="isAiLoading"
        @apply-prompt="applyPrompt"
        @loading="isAiLoading = $event"
      />
      <GenerateCTA />
    </div>
  </div>
</template>
