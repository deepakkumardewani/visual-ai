<script setup lang="ts">
import { SONG_LYRICS_LIMITS, SONG_PROMPT_LIMITS } from '@visual-ai/shared';
import { computed } from 'vue';

import LyricsEditor from '@/components/Song/LyricsEditor.vue';
import StylePresets from '@/components/Song/StylePresets.vue';
import type { SongExampleIdea } from '@/components/Song/songPresets';

const prompt = defineModel<string>('prompt', { required: true });
const lyrics = defineModel<string>('lyrics', { required: true });

defineEmits<{ example: [idea: SongExampleIdea] }>();

const promptAtLimit = computed(() => prompt.value.length >= SONG_PROMPT_LIMITS.max);
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-6" data-testid="song-composer">
    <div class="tw-flex tw-flex-col tw-gap-2">
      <div class="tw-flex tw-items-baseline tw-justify-between tw-gap-3">
        <label for="song-style" class="tw-text-sm tw-font-semibold tw-text-ink-primary">
          Style
        </label>
        <span
          class="tw-text-xs"
          :class="promptAtLimit ? 'counter--limit' : 'tw-text-ink-muted'"
          data-testid="style-counter"
        >
          {{ prompt.length }}/{{ SONG_PROMPT_LIMITS.max }}
        </span>
      </div>
      <input
        id="song-style"
        v-model="prompt"
        type="text"
        class="style-input"
        :maxlength="SONG_PROMPT_LIMITS.max"
        placeholder="Genre, mood, instruments"
        data-testid="style-input"
      />
      <StylePresets
        :current-style="prompt"
        @chip="prompt = $event"
        @example="$emit('example', $event)"
      />
    </div>
    <LyricsEditor v-model="lyrics" />
  </div>
</template>

<style scoped lang="scss">
.counter--limit {
  color: rgb(var(--tw-danger, 190 40 30));
  font-weight: 600;
}

.style-input {
  min-height: 44px;
  padding: 0 1rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 0.75rem;
  background: rgb(var(--tw-surface-1));
  color: rgb(var(--tw-ink-primary));

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }
}
</style>
