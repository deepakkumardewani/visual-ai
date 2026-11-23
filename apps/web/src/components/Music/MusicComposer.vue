<script setup lang="ts">
import {
  getModelDefinition,
  MEDIA_PROMPT_MAX_CHARS,
  STABLE_AUDIO_CFG_SCALE,
  STABLE_AUDIO_STEPS,
  type MusicStudioModelKey,
} from '@visual-ai/shared';
import { computed } from 'vue';

import DurationControl from '@/components/Music/DurationControl.vue';
import MusicModelSelect from '@/components/Music/MusicModelSelect.vue';

const MOOD_CHIPS = [
  'Calm piano, rainy evening',
  'Dark ambient drone',
  'Upbeat lo-fi beat, 90 BPM',
  'Epic orchestral build',
  'Warm acoustic guitar loop',
] as const;

const NEGATIVE_MAX_CHARS = 500;
const LYRIA_ENGLISH_HINT = 'Works best with prompts written in English.';

const modelKey = defineModel<MusicStudioModelKey>('modelKey', { required: true });
const prompt = defineModel<string>('prompt', { required: true });
const durationSec = defineModel<number>('durationSec', { required: true });
const negativePrompt = defineModel<string>('negativePrompt', { required: true });
const steps = defineModel<number>('steps', { required: true });
const cfgScale = defineModel<number>('cfgScale', { required: true });

const media = computed(() => getModelDefinition(modelKey.value).media);
const accepts = (field: string) => Boolean(media.value && Object.hasOwn(media.value.inputs, field));

const durationRange = computed(() => media.value?.durationSec);
const promptMax = computed(() => media.value?.prompt?.max ?? MEDIA_PROMPT_MAX_CHARS);
const isInstrumentalOnly = computed(() => accepts('instrumental'));
const hasAdvanced = computed(() => accepts('steps') || accepts('cfgScale'));
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-6" data-testid="music-composer">
    <div class="tw-flex tw-flex-col tw-gap-2">
      <div class="tw-flex tw-items-baseline tw-justify-between tw-gap-3">
        <label for="music-prompt" class="tw-text-sm tw-font-semibold tw-text-ink-primary">
          Describe the music
        </label>
        <span class="tw-text-xs tw-text-ink-muted">{{ prompt.length }}/{{ promptMax }}</span>
      </div>
      <textarea
        id="music-prompt"
        v-model="prompt"
        class="field"
        rows="3"
        :maxlength="promptMax"
        placeholder="Mood, genre, instruments, tempo"
        data-testid="music-prompt"
      />
      <div role="group" aria-label="Mood quick starts" class="tw-flex tw-flex-wrap tw-gap-2">
        <button
          v-for="chip in MOOD_CHIPS"
          :key="chip"
          type="button"
          class="chip"
          :aria-pressed="prompt === chip"
          data-testid="music-chip"
          @click="prompt = chip"
        >
          {{ chip }}
        </button>
      </div>
    </div>

    <MusicModelSelect v-model="modelKey" />

    <p
      v-if="isInstrumentalOnly"
      class="tw-m-0 tw-text-sm tw-text-ink-muted"
      data-testid="instrumental-note"
    >
      Instrumental only: lyrics are not used, and a style prompt is required.
    </p>
    <p
      v-if="modelKey === 'LYRIA_2'"
      class="tw-m-0 tw-text-sm tw-text-ink-muted"
      data-testid="lyria-hint"
    >
      {{ LYRIA_ENGLISH_HINT }}
    </p>

    <DurationControl
      v-if="accepts('durationSec') && durationRange"
      v-model="durationSec"
      :min="durationRange.min"
      :max="durationRange.max"
    />

    <div v-if="accepts('negativePrompt')" class="tw-flex tw-flex-col tw-gap-2">
      <label for="music-avoid" class="tw-text-sm tw-font-semibold tw-text-ink-primary">
        Avoid
      </label>
      <input
        id="music-avoid"
        v-model="negativePrompt"
        type="text"
        class="field field--line"
        :maxlength="NEGATIVE_MAX_CHARS"
        placeholder="Sounds to keep out, such as vocals or drums"
        data-testid="music-avoid"
      />
    </div>

    <details v-if="hasAdvanced" class="advanced" data-testid="music-advanced">
      <summary class="advanced__summary">Advanced</summary>
      <div class="tw-mt-3 tw-flex tw-flex-wrap tw-gap-6">
        <label class="tw-flex tw-flex-col tw-gap-1 tw-text-sm tw-text-ink-primary">
          Steps
          <input
            v-model.number="steps"
            type="number"
            class="field field--line field--num"
            :min="STABLE_AUDIO_STEPS.min"
            :max="STABLE_AUDIO_STEPS.max"
          />
        </label>
        <label class="tw-flex tw-flex-col tw-gap-1 tw-text-sm tw-text-ink-primary">
          Prompt strength
          <input
            v-model.number="cfgScale"
            type="number"
            class="field field--line field--num"
            :min="STABLE_AUDIO_CFG_SCALE.min"
            :max="STABLE_AUDIO_CFG_SCALE.max"
          />
        </label>
      </div>
    </details>
  </div>
</template>

<style scoped lang="scss">
.field {
  width: 100%;
  padding: 0.625rem 1rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 0.75rem;
  background: rgb(var(--tw-surface-1));
  color: rgb(var(--tw-ink-primary));
  resize: vertical;

  &--line {
    min-height: 44px;
    padding-block: 0;
  }

  &--num {
    width: 6rem;
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }
}

.chip {
  min-height: 44px;
  padding: 0 1rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 9999px;
  font-size: 0.8125rem;
  color: rgb(var(--tw-ink-primary));
  transition: background-color 150ms ease-out;

  &[aria-pressed='true'] {
    border-color: rgb(var(--studio-accent));
    color: rgb(var(--studio-accent));
  }

  &:hover {
    background: rgb(var(--tw-surface-2));
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}

.advanced__summary {
  display: flex;
  align-items: center;
  min-height: 44px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }
}
</style>
