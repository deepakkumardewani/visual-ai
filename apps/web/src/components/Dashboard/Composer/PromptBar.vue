<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

import { useImageDrop, validateImageFile } from '@/composables/useImageDrop';
import { useAsideStore } from '@/stores/aside';
import { useGenerateStore } from '@/stores/generate';

import ComposerTextarea from '@/components/Dashboard/Composer/ComposerTextarea.vue';
import MicButton from '@/components/Dashboard/Composer/VoiceInput/MicButton.vue';
import GenerateCTA from '@/components/Dashboard/Composer/GenerateCTA.vue';
import { provideVoiceInput } from '@/composables/useVoiceInput';
import ReferenceImageControl from '@/components/Dashboard/Composer/ReferenceImageControl.vue';
import ReferenceThumbnails from '@/components/Dashboard/Composer/ReferenceThumbnails.vue';
import PromptAiMenu from '@/components/Dashboard/ModelPicker/PromptAiMenu.vue';

const asideStore = useAsideStore();
const generateStore = useGenerateStore();
const { typingPrompt, referenceImages, supportsImageInput, imageInputMax } =
  storeToRefs(asideStore);
const { promptText } = storeToRefs(generateStore);

const voice = provideVoiceInput();
const isAiLoading = ref(false);
const isMultiline = ref(false);
const dropError = ref('');

const canAcceptReference = computed(() => supportsImageInput.value);
const hasReferenceImages = computed(() => referenceImages.value.length > 0);

function stageReferenceFile(file: File) {
  const result = validateImageFile(file);
  if (!result.ok) {
    dropError.value = result.error;
    return;
  }

  const max = imageInputMax.value;
  if (referenceImages.value.length >= max) {
    dropError.value =
      max === 1 ? 'This model accepts up to 1 image' : `This model accepts up to ${max} images`;
    return;
  }

  dropError.value = '';
  if (max === 1) {
    asideStore.setReferenceImage(result.file);
  } else {
    asideStore.addReferenceImage(result.file);
  }
}

const { isDragging, handleDragOver, handleDragLeave, handleDrop } = useImageDrop({
  enabled: canAcceptReference,
  listenPaste: canAcceptReference,
  onImage: stageReferenceFile,
  onError: (message) => {
    dropError.value = message;
  },
});

function applyPrompt(text: string) {
  typingPrompt.value = text;
  promptText.value = text;
}

function removeReferenceAt(index: number) {
  asideStore.removeReferenceImageAt(index);
}
</script>

<template>
  <div
    data-testid="prompt-bar"
    data-tour="prompt-bar"
    :class="[
      'tw-overflow-visible tw-rounded-xl tw-border tw-bg-surface-1 tw-p-2 tw-shadow-[0_1px_2px_rgba(0,0,0,0.25)] tw-transition-[border-color,box-shadow] tw-duration-base focus-within:tw-border-accent/60 focus-within:tw-shadow-[0_1px_2px_rgba(0,0,0,0.25),0_8px_18px_-12px_rgba(201,138,90,0.45)] motion-reduce:tw-transition-none',
      isDragging ? 'tw-border-accent tw-bg-accent/5' : 'tw-border-hairline',
    ]"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <p
      v-if="dropError"
      data-testid="prompt-bar-drop-error"
      class="tw-mb-1.5 tw-text-caption tw-text-red-400"
      role="alert"
    >
      {{ dropError }}
    </p>
    <div :class="['tw-flex tw-gap-2', isMultiline ? 'tw-items-start' : 'tw-items-center']">
      <ReferenceImageControl />

      <div class="tw-min-w-0 tw-flex-1">
        <ComposerTextarea
          embedded
          hide-ai-menu
          :ai-loading="isAiLoading"
          :voice-busy="voice.isBusy.value"
          @multiline-change="isMultiline = $event"
        />
      </div>

      <div v-if="!isMultiline" class="tw-flex tw-shrink-0 tw-items-center tw-gap-1.5">
        <MicButton />
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
      v-if="isMultiline || hasReferenceImages"
      class="tw-mt-1.5 tw-flex tw-items-end tw-justify-between tw-gap-2"
    >
      <div class="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
        <ReferenceThumbnails :images="referenceImages" @remove="removeReferenceAt" />
        <span
          v-if="hasReferenceImages"
          class="tw-truncate tw-text-caption tw-font-medium tw-text-ink-muted"
        >
          Image reference{{ referenceImages.length > 1 ? 's' : '' }}
        </span>
      </div>

      <div v-if="isMultiline" class="tw-flex tw-shrink-0 tw-items-center tw-gap-1.5">
        <MicButton />
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
