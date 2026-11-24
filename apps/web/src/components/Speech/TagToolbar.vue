<script setup lang="ts">
import type { SpeechModelKey, TtsTagGroup } from '@visual-ai/shared';
import { computed } from 'vue';

import { tagItemsForModel, type TtsTagItem } from '@/composables/useTtsEditor';

const GROUP_LABELS: Record<TtsTagGroup, string> = {
  emotion: 'Emotion',
  'non-verbal': 'Non-verbal',
  delivery: 'Delivery',
  pause: 'Pause',
  direction: 'Direction',
};

const props = defineProps<{ modelKey: SpeechModelKey }>();
const emit = defineEmits<{ insert: [item: TtsTagItem] }>();

/** Direction presets live in the slash menu; the toolbar offers one editable direction chip. */
const DIRECTION_TOOLBAR_LABEL = 'direction';

const groups = computed(() => {
  const byGroup = new Map<TtsTagGroup, TtsTagItem[]>();
  for (const item of tagItemsForModel(props.modelKey)) {
    if (item.group === 'direction' && byGroup.has('direction')) continue;
    byGroup.set(item.group, [...(byGroup.get(item.group) ?? []), item]);
  }
  return [...byGroup.entries()];
});

const buttonLabel = (item: TtsTagItem) =>
  item.group === 'direction' ? DIRECTION_TOOLBAR_LABEL : item.label;
</script>

<template>
  <div
    role="toolbar"
    aria-label="Insert a tag"
    class="tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-2"
    data-testid="tag-toolbar"
  >
    <div
      v-for="[group, items] in groups"
      :key="group"
      role="group"
      :aria-label="GROUP_LABELS[group]"
      class="tw-flex tw-flex-wrap tw-items-center tw-gap-1.5"
    >
      <span
        class="tw-text-[0.6875rem] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-ink-muted"
      >
        {{ GROUP_LABELS[group] }}
      </span>
      <button
        v-for="item in items"
        :key="item.key"
        type="button"
        class="tag-btn"
        :class="`tag-btn--${group}`"
        data-testid="tag-insert"
        :data-tag="item.label"
        @mousedown.prevent
        @click="emit('insert', item)"
      >
        {{ buttonLabel(item) }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tag-btn {
  min-height: 44px;
  padding: 0 0.875rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 9999px;
  background: rgb(var(--tw-surface-1));
  color: rgb(var(--tw-ink-primary));
  font-size: 0.8125rem;
  text-transform: capitalize;
  transition: background-color 150ms ease-out;

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
</style>
