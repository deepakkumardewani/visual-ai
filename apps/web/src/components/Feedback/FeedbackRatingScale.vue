<script setup lang="ts">
import { nextTick, ref } from 'vue';

import { RATING_LABELS, RATING_VALUES } from '@/utils/feedbackUi';

const emit = defineEmits<{ select: [rating: number] }>();

const props = defineProps<{ labelledBy: string; selected?: number }>();

/** Arrow keys only move the roving focus; Enter, Space or a click commits (committing advances the step). */
const focused = ref<number>(props.selected || RATING_VALUES[0]);
const buttons = ref<HTMLButtonElement[]>([]);
const lastIndex = RATING_VALUES.length - 1;

const KEY_STEP: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

function focusIndex(index: number) {
  focused.value = RATING_VALUES[index];
  void nextTick(() => buttons.value[index]?.focus());
}

function onKeydown(event: KeyboardEvent, index: number) {
  if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    focusIndex(event.key === 'Home' ? 0 : lastIndex);
    return;
  }
  const step = KEY_STEP[event.key];
  if (!step) return;
  event.preventDefault();
  focusIndex(Math.min(lastIndex, Math.max(0, index + step)));
}
</script>

<template>
  <div role="radiogroup" :aria-labelledby="labelledBy" class="tw-flex tw-flex-col tw-gap-2">
    <div class="tw-grid tw-grid-cols-5 tw-gap-2">
      <button
        v-for="(value, index) in RATING_VALUES"
        :key="value"
        :ref="(el) => (buttons[index] = el as HTMLButtonElement)"
        type="button"
        role="radio"
        :aria-checked="selected === value"
        :aria-label="`${value} of ${RATING_VALUES.length}, ${RATING_LABELS[value]}`"
        :tabindex="focused === value ? 0 : -1"
        :data-testid="`feedback-rating-${value}`"
        :class="
          selected === value
            ? 'tw-border-accent tw-bg-accent-subtle tw-text-accent'
            : 'tw-border-border tw-bg-surface-2/60 tw-text-ink-primary'
        "
        class="tw-flex tw-h-12 tw-items-center tw-justify-center tw-rounded-full tw-border tw-font-display tw-text-lg tw-transition-[background-color,border-color,color,transform] tw-duration-fast hover:tw-border-accent/60 hover:tw-bg-accent-subtle hover:tw-text-accent active:tw-scale-95 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent motion-reduce:tw-transition-none motion-reduce:active:tw-scale-100"
        @click="emit('select', value)"
        @focus="focused = value"
        @keydown="onKeydown($event, index)"
      >
        {{ value }}
      </button>
    </div>
    <div class="tw-flex tw-justify-between tw-text-xs tw-text-ink-muted" aria-hidden="true">
      <span>{{ RATING_LABELS[RATING_VALUES[0]] }}</span>
      <span>{{ RATING_LABELS[RATING_VALUES[lastIndex]] }}</span>
    </div>
  </div>
</template>
