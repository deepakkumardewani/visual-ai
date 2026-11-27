<script setup lang="ts">
import { useEventListener } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

import PromptPauseToggle from '@/components/LandingV2/PromptPauseToggle.vue';

const props = defineProps<{
  prompt: string;
  /** How many characters are shown as typed. The full prompt is always in the DOM. */
  typed: number;
  /**
   * Every prompt this box may show. Each is laid out invisibly in the same
   * grid cell, so the box takes the tallest one's height and never jumps as
   * prompts of different lengths swap in.
   */
  sizes: readonly string[];
  /** The prompts rotate on their own, so the box offers a pause control. */
  rotating: boolean;
  /** The visitor has paused the rotation. */
  paused: boolean;
}>();

const emit = defineEmits<{
  togglePause: [];
  /** True while the pointer rests on the prompt text or a selection touches it. */
  reading: [reading: boolean];
}>();

const textEl = ref<HTMLElement | null>(null);
const pointerOnText = ref(false);
const textSelected = ref(false);

/** A selection that touches the prompt; an erase would collapse it mid-copy. */
function selectionTouchesText(): boolean {
  const el = textEl.value;
  const selection = document.getSelection();
  if (!el || !selection || selection.isCollapsed || selection.rangeCount === 0) return false;
  return selection.getRangeAt(0).intersectsNode(el);
}

useEventListener(document, 'selectionchange', () => {
  textSelected.value = selectionTouchesText();
});

watch(
  () => pointerOnText.value || textSelected.value,
  (reading) => emit('reading', reading),
);

/*
 * Screen readers get the first prompt only, as a fixed example. The visible
 * text rotates every few seconds; tracking it here would rewrite this node
 * under a reader's virtual cursor each time.
 */
const spokenPrompt = computed(() => props.sizes[0] ?? props.prompt);

const typedText = computed(() => props.prompt.slice(0, props.typed));
const restText = computed(() => props.prompt.slice(props.typed));
const isTyping = computed(() => props.typed < props.prompt.length);
</script>

<template>
  <div class="prompt">
    <div class="prompt__head">
      <p class="prompt__label lv2-eyebrow">Prompt</p>
      <PromptPauseToggle
        v-if="rotating"
        class="prompt__toggle"
        :paused="paused"
        @toggle="emit('togglePause')"
      />
    </div>
    <p
      ref="textEl"
      class="prompt__text"
      @pointerenter="pointerOnText = true"
      @pointerleave="pointerOnText = false"
    >
      <span class="tw-sr-only prompt__spoken">{{ spokenPrompt }}</span>
      <span class="prompt__stack" aria-hidden="true">
        <span v-for="size in sizes" :key="size" class="prompt__sizer">{{ size }}</span>
        <!-- Untyped text stays in place, transparent, so the text never reflows while typing. -->
        <span class="prompt__live">
          <span>{{ typedText }}</span>
          <span class="prompt__caret" :class="{ 'prompt__caret--typing': isTyping }"></span>
          <span class="prompt__rest">{{ restText }}</span>
        </span>
      </span>
    </p>
  </div>
</template>

<style scoped lang="scss">
.prompt {
  display: grid;
  gap: var(--lv2-space-xs);
  max-width: 34rem;
  padding: var(--lv2-space-md) var(--lv2-space-lg) var(--lv2-space-md) var(--lv2-space-md);
  border: 1px solid rgb(var(--tw-hairline));
  border-radius: 12px;
  background-color: rgb(var(--tw-surface-1) / 0.82);
}

.prompt__head {
  position: relative;
}

.prompt__label {
  font-size: 0.68rem;
}

/*
 * Out of flow and centred on the label line: the 24px target is taller than
 * the label, and the box must not grow when the control appears.
 */
.prompt__toggle {
  position: absolute;
  top: 50%;
  right: 0;
  translate: 0 -50%;
}

.prompt__text {
  margin: 0;
  font-size: var(--lv2-text-small);
  line-height: 1.6;
  color: rgb(var(--tw-ink-secondary));
}

/* Selecting the visible prompt must not also copy this hidden one. */
.prompt__spoken {
  user-select: none;
}

.prompt__stack {
  display: grid;
}

.prompt__sizer,
.prompt__live {
  grid-area: 1 / 1;
}

.prompt__sizer {
  visibility: hidden;
}

.prompt__rest {
  color: transparent;
}

/* Zero-width so the caret never pushes text around. */
.prompt__caret {
  position: relative;
  display: inline-block;
  width: 0;
  height: 1em;
  vertical-align: text-bottom;

  &::after {
    content: '';
    position: absolute;
    left: 1px;
    top: 0.05em;
    width: 2px;
    height: 1.05em;
    background-color: var(--lv2-copper);
    opacity: 0;
  }
}

.prompt__caret--typing::after {
  opacity: 1;
}

@media (prefers-reduced-motion: no-preference) {
  .prompt__caret::after {
    animation: caret-fade 1.1s steps(1, end) 3;
  }

  .prompt__caret--typing::after {
    animation: none;
  }
}

@keyframes caret-fade {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>
