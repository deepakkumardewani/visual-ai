<script setup lang="ts">
import { ref } from 'vue';

import { SONG_LYRICS_LIMITS } from '@visual-ai/shared';

import LyricsAiMenu from '@/components/Song/LyricsAiMenu.vue';

/** Structure tags the model understands; the ruler inserts them at the caret. */
const STRUCTURE_TAGS = ['[Intro]', '[Verse]', '[Chorus]', '[Bridge]', '[Outro]'] as const;

const lyrics = defineModel<string>({ required: true });
const textarea = ref<HTMLTextAreaElement | null>(null);

const caretOffset = () => textarea.value?.selectionStart ?? lyrics.value.length;
const atLimit = () => lyrics.value.length >= SONG_LYRICS_LIMITS.max;

function insertTag(tag: string) {
  const el = textarea.value;
  const start = el?.selectionStart ?? lyrics.value.length;
  const end = el?.selectionEnd ?? start;
  const before = lyrics.value.slice(0, start);
  const lead = before && !before.endsWith('\n') ? '\n' : '';
  const inserted = `${lead}${tag}\n`;
  lyrics.value = before + inserted + lyrics.value.slice(end);
  const caret = start + inserted.length;
  requestAnimationFrame(() => {
    el?.focus();
    el?.setSelectionRange(caret, caret);
  });
}
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-2" data-testid="lyrics-editor">
    <div class="tw-flex tw-items-baseline tw-justify-between tw-gap-3">
      <label for="song-lyrics" class="tw-text-sm tw-font-semibold tw-text-ink-primary">
        Lyrics
      </label>
      <span
        class="tw-text-xs"
        :class="atLimit() ? 'counter--limit' : 'tw-text-ink-muted'"
        data-testid="lyrics-counter"
      >
        {{ lyrics.length }}/{{ SONG_LYRICS_LIMITS.max }}
      </span>
    </div>
    <div role="group" aria-label="Insert a section tag" class="tw-flex tw-flex-wrap tw-gap-2">
      <button
        v-for="tag in STRUCTURE_TAGS"
        :key="tag"
        type="button"
        class="tag-btn"
        data-testid="lyrics-tag"
        @click="insertTag(tag)"
      >
        {{ tag }}
      </button>
    </div>
    <LyricsAiMenu v-model="lyrics" :get-caret="caretOffset" />
    <textarea
      id="song-lyrics"
      ref="textarea"
      v-model="lyrics"
      class="notebook"
      rows="12"
      placeholder="[Verse]&#10;Write or paste your lyrics here"
      data-testid="lyrics-input"
    />
  </div>
</template>

<style scoped lang="scss">
$line: 1.75rem;

.counter--limit {
  color: rgb(var(--tw-danger, 190 40 30));
  font-weight: 600;
}

.tag-btn {
  min-height: 44px;
  padding: 0 0.75rem;
  border-bottom: 1px solid rgb(var(--studio-accent));
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgb(var(--studio-accent));

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }
}

// Ruled lines every line-height, like a notebook page.
.notebook {
  width: 100%;
  min-height: 21rem;
  padding: 0 1rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 0.75rem;
  background-color: rgb(var(--tw-surface-1));
  background-image: linear-gradient(
    to bottom,
    transparent calc(#{$line} - 1px),
    rgb(var(--tw-hairline)) calc(#{$line} - 1px)
  );
  background-size: 100% $line;
  background-attachment: local;
  color: rgb(var(--tw-ink-primary));
  font-size: 1rem;
  line-height: $line;
  resize: vertical;

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }
}
</style>
