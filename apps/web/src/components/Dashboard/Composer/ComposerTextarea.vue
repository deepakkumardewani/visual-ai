<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { useAsideStore } from '@/stores/aside';
import { useGenerateStore } from '@/stores/generate';

import PromptAiMenu from '@/components/Dashboard/ModelPicker/PromptAiMenu.vue';

const PLACEHOLDER = 'Describe your image';
const MAX_HEIGHT = 200; // pixels

const props = defineProps<{
  embedded?: boolean;
  hideAiMenu?: boolean;
  aiLoading?: boolean;
}>();

const emit = defineEmits<{
  'multiline-change': [value: boolean];
}>();

const asideStore = useAsideStore();
const generateStore = useGenerateStore();

const { typingPrompt } = storeToRefs(asideStore);
const { promptText } = storeToRefs(generateStore);

const isAiLoading = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const isReadonly = computed(() => isAiLoading.value || Boolean(props.aiLoading));
const showAiLoadingBar = computed(() => isAiLoading.value || Boolean(props.aiLoading));

function focusTextarea() {
  textareaRef.value?.focus();
}

function emitMultilineState() {
  const el = textareaRef.value;
  if (!props.embedded || !el) return;

  const style = window.getComputedStyle(el);
  const lineHeight = Number.parseFloat(style.lineHeight) || 20;
  const padding = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
  const singleLineMax = lineHeight + padding;

  emit('multiline-change', el.scrollHeight > singleLineMax + 2);
}

function adjustHeight() {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  emitMultilineState();
}

function applyPrompt(text: string) {
  typingPrompt.value = text;
  promptText.value = text;
  nextTick(adjustHeight);
  focusTextarea();
}

function clearPrompt() {
  if (isReadonly.value) return;
  typingPrompt.value = '';
  focusTextarea();
}

function handleInput() {
  adjustHeight();
}

watch(typingPrompt, (value) => {
  promptText.value = value;
  nextTick(adjustHeight);
});

onMounted(() => {
  typingPrompt.value = promptText.value ?? '';
  nextTick(adjustHeight);
});
</script>

<template>
  <div data-testid="composer-textarea" class="tw-relative">
    <textarea
      ref="textareaRef"
      v-model.trim="typingPrompt"
      data-testid="composer-textarea-input"
      rows="1"
      :placeholder="PLACEHOLDER"
      :readonly="isReadonly"
      :class="[
        'tw-w-full tw-resize-none tw-border-0 tw-bg-transparent tw-text-body-base tw-leading-normal tw-text-ink tw-placeholder-ink-muted focus-visible:tw-outline-none disabled:tw-cursor-not-allowed disabled:tw-opacity-70',
        embedded
          ? 'tw-rounded-none tw-px-0 tw-py-1.5 tw-pr-8'
          : 'tw-rounded-md tw-px-1 tw-py-1 tw-pr-9',
      ]"
      :aria-busy="isAiLoading"
      @input="handleInput"
    />

    <div
      class="tw-absolute tw-right-0 tw-top-1/2 tw-flex -tw-translate-y-1/2 tw-items-center tw-gap-1"
    >
      <button
        v-if="typingPrompt && !isReadonly"
        type="button"
        data-testid="composer-textarea-clear"
        class="tw-inline-flex tw-min-h-[28px] tw-min-w-[28px] tw-items-center tw-justify-center tw-rounded-md tw-text-ink-muted hover:tw-text-ink focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
        aria-label="Clear prompt"
        @click="clearPrompt"
      >
        <font-awesome-icon icon="xmark" class="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
      </button>

      <PromptAiMenu
        v-if="!hideAiMenu"
        :current-prompt="typingPrompt"
        :disabled="isReadonly"
        @apply-prompt="applyPrompt"
        @loading="isAiLoading = $event"
      />
    </div>

    <div
      v-if="showAiLoadingBar"
      data-testid="composer-textarea-ai-loading"
      class="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-0.5 tw-overflow-hidden"
      aria-hidden="true"
    >
      <div
        class="tw-h-full tw-w-1/3 tw-animate-pulse tw-bg-accent/60 motion-reduce:tw-animate-none"
      />
    </div>
  </div>
</template>
