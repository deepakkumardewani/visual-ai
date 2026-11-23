<script setup lang="ts">
import { computed, ref } from 'vue';

import { SONG_LYRICS_LIMITS } from '@visual-ai/shared';

import Popover from '@/components/primitives/Popover.vue';

import { useLyricsAssist } from '@/composables/useLyricsAssist';

const THEME_MAX_CHARS = 300;

const props = defineProps<{
  /** Caret offset in the lyrics, read when the user asks to rewrite a section. */
  getCaret: () => number;
}>();

const lyrics = defineModel<string>({ required: true });

const assist = useLyricsAssist({ lyrics, getCaret: () => props.getCaret() });

const isOpen = ref(false);
const themeFormOpen = ref(false);
const theme = ref('');

const overLimit = computed(() => lyrics.value.length > SONG_LYRICS_LIMITS.max);
const showSuggestion = computed(() => assist.phase.value === 'suggested');
const showUndo = computed(() => assist.phase.value === 'applied');

function closeMenu() {
  isOpen.value = false;
  themeFormOpen.value = false;
}

function onWriteFromTheme() {
  const text = theme.value;
  closeMenu();
  void assist.writeFromTheme(text);
}

function onRewriteSection() {
  closeMenu();
  void assist.rewriteSection();
}

function onFitToLimit() {
  closeMenu();
  void assist.fitToLimit();
}
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-2" data-testid="lyrics-ai-menu">
    <Popover v-model:open="isOpen" unstyled-trigger placement="bottom-start">
      <template #trigger="{ open, triggerProps }">
        <button
          v-bind="triggerProps as Record<string, unknown>"
          class="ai-trigger"
          :disabled="assist.isLoading.value"
          :aria-expanded="open"
          data-testid="lyrics-ai-trigger"
        >
          <span v-if="assist.isLoading.value" class="ai-spinner" aria-hidden="true" />
          {{ assist.isLoading.value ? 'Writing…' : 'AI help' }}
        </button>
      </template>

      <div class="tw-flex tw-flex-col tw-gap-1" data-testid="lyrics-ai-panel">
        <button
          v-if="!themeFormOpen"
          type="button"
          class="ai-item"
          data-testid="lyrics-ai-write"
          @click="themeFormOpen = true"
        >
          Write from a theme
        </button>
        <form
          v-else
          class="tw-flex tw-flex-col tw-gap-2"
          data-testid="lyrics-ai-theme-form"
          @submit.prevent="onWriteFromTheme"
        >
          <label for="lyrics-ai-theme" class="tw-text-xs tw-font-semibold tw-text-ink-muted">
            Theme
          </label>
          <input
            id="lyrics-ai-theme"
            v-model="theme"
            type="text"
            class="ai-input"
            :maxlength="THEME_MAX_CHARS"
            placeholder="A road trip at dawn"
            data-testid="lyrics-ai-theme"
          />
          <button type="submit" class="ai-item" :disabled="!theme.trim()">Write</button>
        </form>
        <button
          type="button"
          class="ai-item"
          data-testid="lyrics-ai-rewrite"
          @click="onRewriteSection"
        >
          Rewrite this section
        </button>
        <button
          v-if="overLimit"
          type="button"
          class="ai-item"
          data-testid="lyrics-ai-fit"
          @click="onFitToLimit"
        >
          Fit to limit
        </button>
      </div>
    </Popover>

    <div aria-live="polite">
      <section
        v-if="showSuggestion"
        class="suggestion"
        aria-label="Suggested lyrics"
        data-testid="lyrics-ai-suggestion"
      >
        <pre class="suggestion__text">{{ assist.suggestion.value }}</pre>
        <div class="tw-flex tw-gap-2">
          <button
            type="button"
            class="ai-action ai-action--primary"
            data-testid="lyrics-ai-accept"
            @click="assist.accept()"
          >
            Accept
          </button>
          <button
            type="button"
            class="ai-action"
            data-testid="lyrics-ai-discard"
            @click="assist.discard()"
          >
            Discard
          </button>
        </div>
      </section>
      <div v-else-if="showUndo" class="tw-flex tw-items-center tw-gap-3 tw-text-sm">
        <span class="tw-text-ink-muted">Lyrics replaced.</span>
        <button
          type="button"
          class="ai-action ai-action--primary"
          data-testid="lyrics-ai-undo"
          @click="assist.undo()"
        >
          Undo
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
// The menu panel is teleported to <body>, outside the page that defines --studio-accent, so panel
// items use global ink tokens; only inline controls (trigger, suggestion actions) use the accent.
.ai-trigger,
.ai-item,
.ai-action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-align: left;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.ai-item {
  color: rgb(var(--tw-ink-primary));

  &:focus-visible {
    outline: 2px solid rgb(var(--tw-ink-primary));
    outline-offset: 2px;
  }
}

.ai-trigger,
.ai-action {
  color: rgb(var(--studio-accent));
  border: 1px solid rgb(var(--studio-accent));
  border-radius: 0.5rem;

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }
}

.ai-trigger {
  align-self: flex-start;
}

.ai-action:not(.ai-action--primary) {
  color: rgb(var(--tw-ink-muted));
  border-color: rgb(var(--tw-border));
}

.ai-input {
  min-height: 44px;
  padding: 0 0.75rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 0.5rem;
  background: rgb(var(--tw-surface-1));
  color: rgb(var(--tw-ink-primary));

  &:focus-visible {
    outline: 2px solid rgb(var(--tw-ink-primary));
    outline-offset: 2px;
  }
}

.suggestion {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px dashed rgb(var(--studio-accent));
  border-radius: 0.75rem;
}

.suggestion__text {
  max-height: 12rem;
  margin: 0;
  overflow-y: auto;
  font-family: inherit;
  font-size: 0.9375rem;
  line-height: 1.6;
  white-space: pre-wrap;
  color: rgb(var(--tw-ink-primary));
}

.ai-spinner {
  width: 0.875rem;
  height: 0.875rem;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: ai-spin 0.75s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

@keyframes ai-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
