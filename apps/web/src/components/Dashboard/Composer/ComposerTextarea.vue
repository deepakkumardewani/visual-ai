<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { useAsideStore } from '@/stores/aside';
import { useGenerateStore } from '@/stores/generate';

import PromptAiMenu from '@/components/Dashboard/ModelPicker/PromptAiMenu.vue';

const PLACEHOLDER = 'Describe your image';
const MAX_HEIGHT = 200;
const FOCUSED_MIN_HEIGHT = 72;
const CHAR_COUNT_THRESHOLD = 300;

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
const isFocused = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const isReadonly = computed(() => isAiLoading.value || Boolean(props.aiLoading));
const showAiLoadingBar = computed(() => isAiLoading.value || Boolean(props.aiLoading));
const charCount = computed(() => typingPrompt.value.length);
const showCharCount = computed(() => charCount.value > CHAR_COUNT_THRESHOLD);

function focusTextarea() {
  textareaRef.value?.focus();
}

function getSingleLineMax(el: HTMLTextAreaElement) {
  const style = window.getComputedStyle(el);
  const lineHeight = Number.parseFloat(style.lineHeight) || 20;
  const padding = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
  return lineHeight + padding;
}

function hasLongContent(el: HTMLTextAreaElement) {
  return el.scrollHeight > getSingleLineMax(el) + 2;
}

function emitMultilineState(expanded: boolean) {
  if (!props.embedded) return;
  emit('multiline-change', expanded);
}

function adjustHeight() {
  const el = textareaRef.value;
  if (!el) return;

  el.style.height = 'auto';
  const contentHeight = el.scrollHeight;
  const contentIsLong = hasLongContent(el) || typingPrompt.value.includes('\n');
  const shouldExpand = isFocused.value || contentIsLong;

  if (shouldExpand) {
    const minHeight = isFocused.value ? FOCUSED_MIN_HEIGHT : 0;
    el.style.height = `${Math.min(Math.max(contentHeight, minHeight), MAX_HEIGHT)}px`;
  } else {
    el.style.height = `${Math.min(contentHeight, getSingleLineMax(el))}px`;
  }

  emitMultilineState(shouldExpand || contentHeight > getSingleLineMax(el) + 2);
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

function handleFocus() {
  isFocused.value = true;
  nextTick(adjustHeight);
}

function handleBlur() {
  isFocused.value = false;
  nextTick(adjustHeight);
}

watch(typingPrompt, (value) => {
  promptText.value = value;
  nextTick(adjustHeight);
});

onMounted(() => {
  // Prefer aside prompt (may already be restored from localStorage)
  if (typingPrompt.value) {
    promptText.value = typingPrompt.value;
  } else {
    typingPrompt.value = promptText.value ?? '';
  }
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
        'tw-w-full tw-resize-none tw-border-0 tw-bg-transparent tw-text-body-base tw-leading-normal tw-text-ink tw-placeholder-ink-muted tw-transition-[height] tw-duration-fast tw-ease-soft focus-visible:tw-outline-none disabled:tw-cursor-not-allowed disabled:tw-opacity-70 motion-reduce:tw-transition-none',
        embedded
          ? 'tw-rounded-none tw-px-0 tw-py-1.5 tw-pr-8'
          : 'tw-rounded-md tw-px-1 tw-py-1 tw-pr-9',
        showCharCount ? 'tw-pb-5' : '',
      ]"
      :aria-busy="showAiLoadingBar"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
    />

    <div class="tw-absolute tw-right-0 tw-top-1.5 tw-flex tw-items-center tw-gap-1">
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

    <span
      v-if="showCharCount"
      data-testid="composer-textarea-char-count"
      class="tw-pointer-events-none tw-absolute tw-bottom-0.5 tw-right-1 tw-text-eyebrow tw-tabular-nums tw-text-ink-faint"
      aria-live="polite"
    >
      {{ charCount }}
    </span>

    <div
      v-if="showAiLoadingBar"
      data-testid="composer-textarea-ai-loading"
      class="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-0.5 tw-overflow-hidden tw-rounded-full tw-bg-accent/15"
      aria-hidden="true"
    >
      <div class="prompt-ai-indeterminate tw-h-full tw-w-1/3 tw-rounded-full tw-bg-accent" />
    </div>
  </div>
</template>

<style scoped>
@keyframes prompt-ai-indeterminate {
  0% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(320%);
  }
}

.prompt-ai-indeterminate {
  animation: prompt-ai-indeterminate 1.1s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .prompt-ai-indeterminate {
    animation: none;
    width: 100%;
    opacity: 0.7;
  }
}
</style>
