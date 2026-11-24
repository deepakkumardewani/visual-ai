<script setup lang="ts">
import { getModelDefinition, type SpeechModelKey } from '@visual-ai/shared';
import { EditorContent } from '@tiptap/vue-3';
import { computed } from 'vue';

import TagToolbar from '@/components/Speech/TagToolbar.vue';

import type { TtsEditorApi } from '@/composables/useTtsEditor';

const INWORLD_2_KEY: SpeechModelKey = 'INWORLD_TTS_2';
const MENU_ID = 'tts-slash-menu';
const MENU_OFFSET_PX = 6;

const props = defineProps<{ tts: TtsEditorApi; modelKey: SpeechModelKey }>();

const modelLabel = computed(() => getModelDefinition(props.modelKey).label);
const menu = computed(() => props.tts.slashMenu.value);
const menuStyle = computed(() => {
  const rect = menu.value?.rect;
  if (!rect) return {};
  return { left: `${rect.left}px`, top: `${rect.bottom + MENU_OFFSET_PX}px` };
});
const optionId = (index: number) => `${MENU_ID}-${index}`;
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-3" data-testid="tts-editor">
    <TagToolbar :model-key="modelKey" @insert="tts.insertTag($event.node)" />
    <div class="editor-frame">
      <EditorContent :editor="tts.editor" class="editor-content" data-testid="tts-editor-content" />
    </div>
    <p class="tw-m-0 tw-text-xs tw-text-ink-muted" data-testid="tts-hint">
      Type / to insert a tag.
      <template v-if="modelKey === INWORLD_2_KEY">
        Tags for {{ modelLabel }} go before the text they affect.
      </template>
    </p>

    <ul
      v-if="menu"
      :id="MENU_ID"
      role="listbox"
      aria-label="Tags"
      class="slash-menu"
      :style="menuStyle"
      data-testid="tts-slash-menu"
    >
      <li
        v-for="(item, index) in menu.items"
        :id="optionId(index)"
        :key="item.key"
        role="option"
        :aria-selected="index === menu.index"
        class="slash-menu__item"
        :class="{ 'slash-menu__item--on': index === menu.index }"
        data-testid="tts-slash-option"
        @mousedown.prevent="menu.choose(item)"
      >
        <span>{{ item.label }}</span>
        <span class="tw-text-xs tw-text-ink-muted">{{ item.group }}</span>
      </li>
      <li v-if="!menu.items.length" class="slash-menu__empty" data-testid="tts-slash-empty">
        No matching tag for {{ modelLabel }}
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.editor-frame {
  border: 1px solid rgb(var(--tw-border));
  border-radius: 0.75rem;
  background: rgb(var(--tw-surface-1));

  &:focus-within {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }
}

.editor-content :deep(.ProseMirror) {
  min-height: 10rem;
  padding: 0.75rem 1rem;
  color: rgb(var(--tw-ink-primary));
  line-height: 1.7;
  outline: none;
  white-space: pre-wrap;
  overflow-wrap: anywhere;

  p {
    margin: 0 0 0.5rem;
  }

  p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    height: 0;
    color: rgb(var(--tw-ink-muted));
    pointer-events: none;
  }
}

.slash-menu {
  position: fixed;
  z-index: 50;
  display: flex;
  flex-direction: column;
  max-width: calc(100vw - 1rem);
  max-height: 16rem;
  margin: 0;
  padding: 0.25rem;
  overflow-y: auto;
  list-style: none;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 0.75rem;
  background: rgb(var(--tw-surface-1));
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.18);

  &__item,
  &__empty {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    min-height: 44px;
    padding: 0 0.75rem;
    border-radius: 0.5rem;
    color: rgb(var(--tw-ink-primary));
    font-size: 0.875rem;
    text-transform: capitalize;
    cursor: pointer;
  }

  &__empty {
    color: rgb(var(--tw-ink-muted));
    text-transform: none;
    cursor: default;
  }

  &__item--on {
    background: rgb(var(--tw-surface-2));
    box-shadow: inset 3px 0 0 rgb(var(--studio-accent));
  }
}

/* Chips are built as plain DOM by the node view, so their styles reach in through :deep. */
.editor-content :deep(.tts-chip) {
  --chip-tint: var(--studio-accent);
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-inline: 0.125rem;
  padding: 0 0.25rem 0 0.625rem;
  min-height: 1.75rem;
  border: 1px solid rgb(var(--chip-tint));
  border-radius: 9999px;
  background: color-mix(in srgb, rgb(var(--chip-tint)) 14%, rgb(var(--tw-surface-1)));
  color: rgb(var(--tw-ink-primary));
  font-size: 0.8125rem;
  line-height: 1;
  vertical-align: baseline;
  white-space: nowrap;
  user-select: none;

  &.ProseMirror-selectednode {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 1px;
  }
}

.editor-content :deep(.tts-chip--pause),
.editor-content :deep(.tts-chip--direction) {
  border-style: dashed;
}

.editor-content :deep(.tts-chip--emotion) {
  background: color-mix(in srgb, rgb(var(--chip-tint)) 26%, rgb(var(--tw-surface-1)));
}

.editor-content :deep(.tts-chip--delivery) {
  border-width: 2px;
}

.editor-content :deep(.tts-chip__label) {
  text-transform: capitalize;
}

.editor-content :deep(.tts-chip__value) {
  width: 3.5ch;
  min-height: 1.5rem;
  padding: 0 0.25rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 0.375rem;
  background: rgb(var(--tw-surface-1));
  color: inherit;
  font: inherit;

  &[aria-invalid='true'] {
    border-color: rgb(var(--tw-danger, 190 40 30));
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 1px;
  }
}

.editor-content :deep(.tts-chip--direction .tts-chip__value) {
  width: auto;
  min-width: 8ch;
}

.editor-content :deep(.tts-chip__error) {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  background: rgb(var(--tw-surface-2));
  color: rgb(var(--tw-danger, 190 40 30));
  font-size: 0.75rem;
  white-space: normal;
}

.editor-content :deep(.tts-chip__remove) {
  min-width: 1.5rem;
  min-height: 1.5rem;
  border: 0;
  border-radius: 9999px;
  background: transparent;
  color: inherit;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: rgb(var(--tw-surface-2));
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 1px;
  }
}

/* Touch targets: chip controls reach 44px on narrow screens. */
@media (max-width: 640px) {
  .editor-content :deep(.tts-chip) {
    min-height: 44px;
  }

  .editor-content :deep(.tts-chip__value),
  .editor-content :deep(.tts-chip__remove) {
    min-height: 44px;
  }

  .editor-content :deep(.tts-chip__remove) {
    min-width: 44px;
  }
}
</style>
