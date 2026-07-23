<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

import { useDashboardMotion } from '@/composables/useDashboardMotion';
import { useAsideStore } from '@/stores/aside';
import { useGenerateStore } from '@/stores/generate';

import ComposerTextarea from '@/components/Dashboard/Composer/ComposerTextarea.vue';
import GenerateCTA from '@/components/Dashboard/Composer/GenerateCTA.vue';
import ReferenceImageControl from '@/components/Dashboard/Composer/ReferenceImageControl.vue';
import PromptAiMenu from '@/components/Dashboard/ModelPicker/PromptAiMenu.vue';

const asideStore = useAsideStore();
const generateStore = useGenerateStore();
const { typingPrompt, referenceImage } = storeToRefs(asideStore);
const { promptText } = storeToRefs(generateStore);
const { interactiveTransition } = useDashboardMotion();

const isAiLoading = ref(false);
const isMultiline = ref(false);

function applyPrompt(text: string) {
  typingPrompt.value = text;
  promptText.value = text;
}

function removeReference() {
  asideStore.clearReferenceImage();
}
</script>

<template>
  <div
    data-testid="prompt-bar"
    class="tw-overflow-visible tw-rounded-xl tw-border tw-border-hairline tw-bg-surface-1 tw-p-2 tw-shadow-[0_1px_2px_rgba(0,0,0,0.25)] tw-transition-[border-color,box-shadow] tw-duration-base focus-within:tw-border-accent/60 focus-within:tw-shadow-[0_1px_2px_rgba(0,0,0,0.25),0_8px_18px_-12px_rgba(201,138,90,0.45)] motion-reduce:tw-transition-none"
  >
    <div :class="['tw-flex tw-gap-2', isMultiline ? 'tw-items-start' : 'tw-items-center']">
      <ReferenceImageControl />

      <div class="tw-min-w-0 tw-flex-1">
        <ComposerTextarea
          embedded
          hide-ai-menu
          :ai-loading="isAiLoading"
          @multiline-change="isMultiline = $event"
        />
      </div>

      <div v-if="!isMultiline" class="tw-flex tw-shrink-0 tw-items-center tw-gap-1.5">
        <PromptAiMenu
          :current-prompt="typingPrompt"
          :disabled="isAiLoading"
          @apply-prompt="applyPrompt"
          @loading="isAiLoading = $event"
        />
        <GenerateCTA />
      </div>
    </div>

    <!-- Second row: when multiline (actions) and/or a reference preview is set -->
    <div
      v-if="isMultiline || referenceImage"
      class="tw-mt-1.5 tw-flex tw-items-end tw-justify-between tw-gap-2"
    >
      <div class="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
        <div
          v-if="referenceImage"
          data-testid="reference-image-preview"
          class="tw-group tw-relative tw-h-10 tw-w-10 tw-shrink-0 tw-overflow-hidden tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2"
        >
          <img
            :src="referenceImage.previewUrl"
            :alt="`Reference: ${referenceImage.name}`"
            class="tw-h-full tw-w-full tw-object-cover"
          />
          <button
            type="button"
            data-testid="reference-image-remove"
            :class="[
              'tw-absolute tw-right-0.5 tw-top-0.5 tw-inline-flex tw-h-4 tw-w-4 tw-items-center tw-justify-center tw-rounded-full tw-bg-canvas/90 tw-text-ink tw-opacity-0 group-hover:tw-opacity-100 focus-visible:tw-opacity-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent',
              interactiveTransition,
            ]"
            aria-label="Remove reference image"
            @click="removeReference"
          >
            <font-awesome-icon icon="xmark" class="tw-h-2.5 tw-w-2.5" aria-hidden="true" />
          </button>
        </div>
        <span
          v-if="referenceImage"
          class="tw-truncate tw-text-caption tw-font-medium tw-text-ink-muted"
        >
          Image reference
        </span>
      </div>

      <div v-if="isMultiline" class="tw-flex tw-shrink-0 tw-items-center tw-gap-1.5">
        <PromptAiMenu
          :current-prompt="typingPrompt"
          :disabled="isAiLoading"
          @apply-prompt="applyPrompt"
          @loading="isAiLoading = $event"
        />
        <GenerateCTA />
      </div>
    </div>
  </div>
</template>
