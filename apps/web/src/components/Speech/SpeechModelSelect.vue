<script setup lang="ts">
import { getMediaCreditCost, getModelDefinition, type SpeechModelKey } from '@visual-ai/shared';
import { nextTick, useTemplateRef } from 'vue';

interface SpeechModelOption {
  key: SpeechModelKey;
  /** One line on what the model is best at (R-TTS-2). */
  bestFor: string;
}

const MODEL_OPTIONS: readonly SpeechModelOption[] = [
  { key: 'INWORLD_TTS_2', bestFor: 'Most expressive. Steer delivery with written directions.' },
  { key: 'INWORLD_TTS_15_MAX', bestFor: 'Solid quality with emotion tags and pauses.' },
  { key: 'MINIMAX_SPEECH_28_HD', bestFor: 'Long scripts and many languages.' },
  { key: 'MINIMAX_SPEECH_28_TURBO', bestFor: 'Faster and cheaper Minimax, same languages.' },
  { key: 'CHATTERBOX_TURBO', bestFor: 'Short drafts at the lowest cost.' },
];

/** Credits shown per option are for this many characters, so models compare on the same script. */
const SAMPLE_CHARS = 1000;
const SAMPLE_COST = { kind: 'chars', chars: SAMPLE_CHARS } as const;

const props = defineProps<{ modelValue: SpeechModelKey }>();
/** A choice is a request: the page may open a conversion dialog before the model changes. */
const emit = defineEmits<{ select: [key: SpeechModelKey] }>();

const root = useTemplateRef<HTMLElement>('root');

function limitOf(key: SpeechModelKey) {
  return getModelDefinition(key).media?.textLimit ?? 0;
}

/** The radios are controlled: a declined switch must visibly snap back to the committed model. */
async function onSelect(key: SpeechModelKey) {
  emit('select', key);
  await nextTick();
  root.value?.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((input) => {
    input.checked = input.value === props.modelValue;
  });
}
</script>

<template>
  <fieldset
    ref="root"
    class="tw-m-0 tw-flex tw-min-w-0 tw-flex-col tw-gap-2 tw-border-0 tw-p-0"
    data-testid="speech-model-select"
  >
    <legend class="tw-mb-2 tw-p-0 tw-text-sm tw-font-semibold tw-text-ink-primary">Model</legend>
    <label
      v-for="option in MODEL_OPTIONS"
      :key="option.key"
      class="model-option"
      :class="{ 'model-option--on': modelValue === option.key }"
      data-testid="speech-model-option"
    >
      <input
        type="radio"
        name="speech-model"
        class="model-option__input"
        :value="option.key"
        :checked="modelValue === option.key"
        @change="onSelect(option.key)"
      />
      <span class="tw-flex tw-items-baseline tw-justify-between tw-gap-3">
        <span class="tw-font-medium tw-text-ink-primary">{{
          getModelDefinition(option.key).label
        }}</span>
        <span class="tw-text-xs tw-text-ink-secondary" data-testid="speech-model-cost">
          {{ getMediaCreditCost(option.key, SAMPLE_COST) }} credits / 1,000 chars
        </span>
      </span>
      <span class="tw-text-sm tw-text-ink-secondary">{{ option.bestFor }}</span>
      <span class="tw-text-xs tw-text-ink-muted">
        Up to {{ limitOf(option.key).toLocaleString() }} characters
      </span>
    </label>
  </fieldset>
</template>

<style scoped lang="scss">
.model-option {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-height: 44px;
  padding: 0.625rem 0.875rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 0.75rem;
  background: rgb(var(--tw-surface-1));
  color: rgb(var(--tw-ink-primary));
  cursor: pointer;
  transition: background-color 150ms ease-out;

  &:hover {
    background: rgb(var(--tw-surface-2));
  }

  &--on {
    border-color: rgb(var(--studio-accent));
    background: rgb(var(--tw-surface-2));
  }

  &:has(:focus-visible) {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}

/* Visually hidden but focusable, so arrow keys move between models natively. */
.model-option__input {
  position: absolute;
  opacity: 0;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  cursor: pointer;
}
</style>
