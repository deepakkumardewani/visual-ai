<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { nextTick, onMounted, ref, watch } from 'vue';

import { useReducedMotion } from '@/composables/useReducedMotion';
import { useAsideStore } from '@/stores/aside';
import { useGenerateStore } from '@/stores/generate';

import PromptAiMenu from '@/components/Dashboard/ControlRail/PromptAiMenu.vue';

const props = withDefaults(
  defineProps<{
    embedded?: boolean;
  }>(),
  { embedded: false },
);

const PLACEHOLDER_EXAMPLES = [
  'Describe your image',
  'A serene mountain lake at golden hour…',
  'Cyberpunk portrait with neon reflections…',
];

const asideStore = useAsideStore();
const generateStore = useGenerateStore();
const reducedMotion = useReducedMotion();

const { typingPrompt } = storeToRefs(asideStore);
const { promptText } = storeToRefs(generateStore);

const isTyping = ref(false);
const isAiLoading = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const placeholderText = ref(PLACEHOLDER_EXAMPLES[0]);
const showPlaceholder = ref(true);

const isReadonly = computed(() => isTyping.value || isAiLoading.value);

function focusTextarea() {
  textareaRef.value?.focus();
}

function adjustHeight() {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.max(el.scrollHeight, 80)}px`;
}

function applyPrompt(text: string) {
  showPlaceholder.value = false;
  if (reducedMotion.value) {
    typingPrompt.value = text;
    promptText.value = text;
    nextTick(adjustHeight);
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
      nextTick(adjustHeight);
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
  showPlaceholder.value = true;
  focusTextarea();
}

function handleInput() {
  showPlaceholder.value = typingPrompt.value.length === 0;
  adjustHeight();
}

function handleFocus() {
  showPlaceholder.value = typingPrompt.value.length === 0;
}

function handleBlur() {
  showPlaceholder.value = typingPrompt.value.length === 0;
}

let placeholderTimer: ReturnType<typeof setInterval> | null = null;
const placeholderState = { exampleIndex: 0, charIndex: 0, deleting: false, pauseTicks: 0 };

function startPlaceholderCycle() {
  if (reducedMotion.value || typingPrompt.value) return;
  stopPlaceholderCycle();

  placeholderTimer = setInterval(
    () => {
      if (typingPrompt.value || isTyping.value) return;

      const target = PLACEHOLDER_EXAMPLES[placeholderState.exampleIndex];

      if (placeholderState.pauseTicks > 0) {
        placeholderState.pauseTicks--;
        return;
      }

      if (!placeholderState.deleting) {
        placeholderText.value = target.slice(0, placeholderState.charIndex + 1);
        placeholderState.charIndex++;
        if (placeholderState.charIndex >= target.length) {
          placeholderState.deleting = true;
          placeholderState.pauseTicks = 24;
        }
      } else {
        placeholderText.value = target.slice(0, placeholderState.charIndex - 1);
        placeholderState.charIndex--;
        if (placeholderState.charIndex <= 0) {
          placeholderState.deleting = false;
          placeholderState.exampleIndex =
            (placeholderState.exampleIndex + 1) % PLACEHOLDER_EXAMPLES.length;
        }
      }
    },
    placeholderState.deleting ? 20 : 35,
  );
}

function stopPlaceholderCycle() {
  if (placeholderTimer) {
    clearInterval(placeholderTimer);
    placeholderTimer = null;
  }
}

watch(typingPrompt, (value) => {
  promptText.value = value;
  nextTick(adjustHeight);
});

watch(isTyping, (typing) => {
  if (typing) stopPlaceholderCycle();
  else if (!typingPrompt.value) startPlaceholderCycle();
});

onMounted(() => {
  typingPrompt.value = promptText.value ?? '';
  nextTick(() => {
    adjustHeight();
    if (!typingPrompt.value && !reducedMotion.value) {
      startPlaceholderCycle();
    }
  });
});

onBeforeUnmount(stopPlaceholderCycle);
</script>

<template>
  <div data-testid="composer-textarea" :class="props.embedded ? 'tw-relative' : 'tw-relative'">
    <textarea
      ref="textareaRef"
      v-model.trim="typingPrompt"
      data-testid="composer-textarea-input"
      rows="1"
      :placeholder="reducedMotion ? PLACEHOLDER_EXAMPLES[0] : placeholderText"
      :readonly="isReadonly"
      class="tw-w-full tw-resize-none tw-rounded-md tw-border-0 tw-bg-transparent tw-px-1 tw-py-2 tw-pr-10 tw-text-body-base tw-text-ink tw-placeholder-ink-muted focus-visible:tw-outline-none disabled:tw-cursor-not-allowed disabled:tw-opacity-70"
      :aria-busy="isTyping || isAiLoading"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
    />

    <div class="tw-absolute tw-right-0 tw-top-1 tw-flex tw-items-start tw-gap-1">
      <button
        v-if="typingPrompt && !isReadonly"
        type="button"
        data-testid="composer-textarea-clear"
        class="tw-inline-flex tw-min-h-[32px] tw-min-w-[32px] tw-items-center tw-justify-center tw-rounded-sm tw-text-ink-muted hover:tw-text-ink focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
        aria-label="Clear prompt"
        @click="clearPrompt"
      >
        <font-awesome-icon icon="xmark" class="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
      </button>

      <PromptAiMenu
        :current-prompt="typingPrompt"
        :disabled="isReadonly"
        @apply-prompt="applyPrompt"
        @loading="isAiLoading = $event"
      />
    </div>

    <div
      v-if="isAiLoading"
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
