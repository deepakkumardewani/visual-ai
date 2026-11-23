<script setup lang="ts">
import { getMediaCreditCost, type MusicStudioModelKey } from '@visual-ai/shared';

interface MusicModelOption {
  key: MusicStudioModelKey;
  label: string;
  /** One line on what the model is best at (R-MUS-2). */
  bestFor: string;
  length: string;
  /** Instrumental-only models say so up front: the studio never sends lyrics. */
  note?: string;
}

const MODEL_OPTIONS: readonly MusicModelOption[] = [
  {
    key: 'STABLE_AUDIO_25',
    label: 'Stable Audio 2.5',
    bestFor: 'Loops, SFX, ambient. Longer is the same price.',
    length: 'up to 190 s',
  },
  {
    key: 'LYRIA_2',
    label: 'Lyria 2',
    bestFor: 'Polished 30-second clips. English prompts, SynthID-watermarked.',
    length: '30 s',
  },
  {
    key: 'MINIMAX_MUSIC_26',
    label: 'Minimax 2.6 Instrumental',
    bestFor: 'Full instrumental tracks with BPM and key in the prompt.',
    length: 'up to 6 min',
    note: 'Instrumental only: lyrics are not used.',
  },
];

const FILE_COST = { kind: 'file' } as const;

const modelKey = defineModel<MusicStudioModelKey>({ required: true });
</script>

<template>
  <fieldset class="tw-m-0 tw-flex tw-min-w-0 tw-flex-col tw-gap-2 tw-border-0 tw-p-0">
    <legend class="tw-mb-2 tw-p-0 tw-text-sm tw-font-semibold tw-text-ink-primary">Model</legend>
    <label
      v-for="option in MODEL_OPTIONS"
      :key="option.key"
      class="model-option"
      :class="{ 'model-option--on': modelKey === option.key }"
      data-testid="music-model-option"
    >
      <input
        v-model="modelKey"
        type="radio"
        name="music-model"
        class="model-option__input"
        :value="option.key"
      />
      <span class="tw-flex tw-items-baseline tw-justify-between tw-gap-3">
        <span class="tw-font-medium tw-text-ink-primary">{{ option.label }}</span>
        <span class="tw-text-xs tw-text-ink-secondary" data-testid="music-model-cost">
          {{ getMediaCreditCost(option.key, FILE_COST) }} credits &middot; {{ option.length }}
        </span>
      </span>
      <span class="tw-text-sm tw-text-ink-secondary">{{ option.bestFor }}</span>
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
  /* Explicit surface and ink so a card never inherits the label's default colours in either theme. */
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
