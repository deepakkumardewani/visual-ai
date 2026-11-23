<script setup lang="ts">
import type { PlayerTrack } from '@/stores/player';

import TrackCard from '@/components/Audio/TrackCard.vue';
import {
  SONG_EXAMPLE_IDEAS,
  SONG_SAMPLE_LOOP_URL,
  SONG_STYLE_CHIPS,
  type SongExampleIdea,
} from '@/components/Song/songPresets';

const SAMPLE_TRACK: PlayerTrack = {
  id: 'song-sample-loop',
  title: 'Sample song loop',
  src: SONG_SAMPLE_LOOP_URL,
};

defineProps<{ currentStyle: string }>();
defineEmits<{ chip: [style: string]; example: [idea: SongExampleIdea] }>();
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-4" data-testid="style-presets">
    <div role="group" aria-label="Style quick starts" class="tw-flex tw-flex-wrap tw-gap-2">
      <button
        v-for="chip in SONG_STYLE_CHIPS"
        :key="chip"
        type="button"
        class="preset-chip"
        :aria-pressed="currentStyle === chip"
        data-testid="style-chip"
        @click="$emit('chip', chip)"
      >
        {{ chip }}
      </button>
    </div>
    <div class="tw-flex tw-flex-col tw-gap-2">
      <p class="tw-m-0 tw-text-xs tw-uppercase tw-tracking-wide tw-text-ink-muted">Example ideas</p>
      <ul class="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0">
        <li v-for="idea in SONG_EXAMPLE_IDEAS" :key="idea.id">
          <button
            type="button"
            class="idea-btn"
            data-testid="song-example-idea"
            @click="$emit('example', idea)"
          >
            <span class="tw-font-medium tw-text-ink-primary">{{ idea.label }}</span>
            <span class="tw-text-ink-muted">{{ idea.genre }}, {{ idea.mood }}</span>
          </button>
        </li>
      </ul>
    </div>
    <TrackCard v-if="SONG_SAMPLE_LOOP_URL" :track="SAMPLE_TRACK" data-testid="song-sample-loop" />
  </div>
</template>

<style scoped lang="scss">
.preset-chip {
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

  &:focus-visible,
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

.idea-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
  width: 100%;
  min-height: 44px;
  padding: 0.5rem 0.75rem;
  border: 1px dashed rgb(var(--tw-border));
  border-radius: 0.75rem;
  text-align: left;
  font-size: 0.875rem;

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }
}
</style>
