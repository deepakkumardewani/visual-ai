<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';

import { useReducedMotion } from '@/composables/useReducedMotion';
import { useAsideStore } from '@/stores/aside';
import { useGenerateStore } from '@/stores/generate';

import Heading from '@/components/Aside/Heading.vue';
import PromptAiMenu from '@/components/Dashboard/ControlRail/PromptAiMenu.vue';

const PROMPT_INFO = 'Describe style, subject, colors, mood, and composition of your desired image';

const asideStore = useAsideStore();
const generateStore = useGenerateStore();
const { mobile } = useDisplay();
const reducedMotion = useReducedMotion();

const { typingPrompt } = storeToRefs(asideStore);
const { promptText } = storeToRefs(generateStore);

const isTyping = ref(false);
const isAiLoading = ref(false);
const textAreaFocused = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const textareaRows = computed(() => {
  if (!mobile.value) return 3;
  return textAreaFocused.value ? 3 : 1;
});

const isReadonly = computed(() => isTyping.value || isAiLoading.value);

function focusTextarea() {
  textareaRef.value?.focus();
}

function applyPrompt(text: string) {
  if (reducedMotion.value) {
    typingPrompt.value = text;
    promptText.value = text;
    focusTextarea();
    return;
  }

  typePrompt(text);
}

function typePrompt(text: string) {
  isTyping.value = true;
  typingPrompt.value = '';

  let index = 0;
  const interval = setInterval(() => {
    if (index < text.length) {
      typingPrompt.value += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);
      isTyping.value = false;
      focusTextarea();
    }
  }, 5);
}

function clearPrompt() {
  if (isReadonly.value) return;
  typingPrompt.value = '';
  focusTextarea();
}

function handleFocus() {
  textAreaFocused.value = true;
}

function handleBlur() {
  textAreaFocused.value = false;
}

watch(typingPrompt, (value) => {
  promptText.value = value;
});

onMounted(() => {
  typingPrompt.value = promptText.value ?? '';
});
</script>

<template>
  <div data-testid="prompt-box">
    <div class="tw-flex tw-items-center tw-justify-between tw-gap-2">
      <div class="tw-flex tw-items-center tw-gap-1">
        <Heading title="Prompt" />
        <button
          type="button"
          data-testid="prompt-info"
          class="tw-inline-flex tw-min-h-[44px] tw-min-w-[44px] tw-items-center tw-justify-center tw-rounded-sm tw-text-ink-muted hover:tw-text-ink focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
          :title="PROMPT_INFO"
          :aria-label="PROMPT_INFO"
        >
          <font-awesome-icon icon="circle-info" class="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
        </button>
      </div>

      <PromptAiMenu
        :current-prompt="typingPrompt"
        :disabled="isReadonly"
        @apply-prompt="applyPrompt"
        @loading="isAiLoading = $event"
      />
    </div>

    <div class="tw-relative tw-mt-1" :aria-busy="isTyping || isAiLoading">
      <textarea
        ref="textareaRef"
        v-model.trim="typingPrompt"
        data-testid="prompt-textarea"
        :rows="textareaRows"
        placeholder="Describe your image"
        :readonly="isReadonly"
        class="tw-w-full tw-resize-none tw-rounded-md tw-border tw-border-hairline tw-bg-surface-1 tw-px-3 tw-py-2 tw-pr-9 tw-text-body-sm tw-text-ink tw-placeholder-ink-muted focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px] disabled:tw-cursor-not-allowed disabled:tw-opacity-70"
        @focus="handleFocus"
        @blur="handleBlur"
      />

      <button
        v-if="typingPrompt && !isReadonly"
        type="button"
        data-testid="prompt-clear"
        class="tw-absolute tw-right-2 tw-top-2 tw-inline-flex tw-min-h-[32px] tw-min-w-[32px] tw-items-center tw-justify-center tw-rounded-sm tw-text-ink-muted hover:tw-text-ink focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
        aria-label="Clear prompt"
        @click="clearPrompt"
      >
        <font-awesome-icon icon="xmark" class="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
      </button>

      <div
        v-if="isAiLoading"
        data-testid="prompt-ai-loading"
        class="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-0.5 tw-overflow-hidden tw-rounded-b-md"
        aria-hidden="true"
      >
        <div
          class="tw-h-full tw-w-1/3 tw-animate-pulse tw-bg-accent/60 motion-reduce:tw-animate-none"
        />
      </div>
    </div>
  </div>
</template>
