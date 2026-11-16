<script setup lang="ts">
import { computed } from 'vue';

import { formatPlate, type ShowcaseEntry } from '@/components/LandingV2/showcaseLayout';

const props = defineProps<{
  /** The tile being looked at, or null before the visitor has pointed at one. */
  entry: ShowcaseEntry | null;
  /** Shown until a tile is looked at, so a real prompt is always on the wall. */
  idleEntry: ShowcaseEntry;
  total: number;
}>();

const HINT = 'Point at or tab to any image to read its prompt.';

const shown = computed(() => props.entry ?? props.idleEntry);
const isIdle = computed(() => props.entry === null);
</script>

<!--
  The gallery wall label between the two rows. Purely visual: every tile button
  is already named by its prompt, so screen readers skip this copy.
-->
<template>
  <div class="label" aria-hidden="true">
    <div class="label__meta">
      <p class="lv2-eyebrow">Prompt</p>
      <p class="label__plate">
        <span class="label__no">{{ formatPlate(shown.index) }}</span>
        <span class="label__total">/ {{ formatPlate(total - 1) }}</span>
      </p>
      <p class="label__ratio">{{ shown.item.aspectRatio }}</p>
    </div>
    <div class="label__body">
      <!-- Old and new prompts cross-fade in one grid cell, so the hint below never jumps. -->
      <div class="label__prompts">
        <Transition name="label-swap">
          <p :key="shown.index" class="label__prompt">{{ shown.item.prompt }}</p>
        </Transition>
      </div>
      <!-- Always rendered (hidden by opacity) so swapping prompts never shifts the lower row. -->
      <p class="label__hint" :class="{ 'is-hidden': !isIdle }">{{ HINT }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.label {
  display: grid;
  grid-template-columns: minmax(8rem, 1fr) minmax(0, 4fr);
  gap: var(--lv2-space-xl);
  align-items: start;
  /* Same left edge as the other scenes' `.lv2-section` + `.lv2-container`. */
  width: min(100% - 2 * var(--lv2-gutter), var(--lv2-max-width));
  margin-inline: auto;
}

.label__body {
  --prompt-size: clamp(1.125rem, 0.9rem + 0.55vw, 1.5rem);
  --prompt-leading: 1.4;
  --hint-leading: 1.5;

  /*
   * Reserve four prompt lines plus the hint: the longest prompt fits, so
   * swapping never shifts the lower row, and the hint sits right under the text.
   */
  display: flex;
  flex-direction: column;
  gap: var(--lv2-space-sm);
  min-height: calc(
    4 * var(--prompt-size) * var(--prompt-leading) + var(--lv2-space-sm) + var(--lv2-text-small) *
      var(--hint-leading)
  );
}

.label__meta {
  display: grid;
  gap: var(--lv2-space-2xs);
}

.label__plate {
  margin: 0;
  font-family: var(--lv2-font-display);
  font-size: var(--lv2-text-title);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: rgb(var(--tw-ink-primary));
}

.label__total {
  font-size: var(--lv2-text-small);
  color: rgb(var(--tw-ink-faint));
}

.label__ratio {
  margin: 0;
  font-size: var(--lv2-text-label);
  letter-spacing: var(--lv2-tracking-label);
  color: rgb(var(--tw-ink-muted));
}

.label__prompts {
  display: grid;
}

.label__prompt {
  grid-area: 1 / 1;
  max-width: 54ch;
  margin: 0;
  font-family: var(--lv2-font-display);
  font-size: var(--prompt-size);
  line-height: var(--prompt-leading);
  color: rgb(var(--tw-ink-primary));
  text-wrap: pretty;
}

.label__hint {
  margin: 0;
  font-size: var(--lv2-text-small);
  line-height: var(--hint-leading);
  color: rgb(var(--tw-ink-muted));
  transition: opacity 220ms var(--lv2-ease-out);

  &.is-hidden {
    opacity: 0;
  }
}

.label-swap-enter-active,
.label-swap-leave-active {
  transition:
    opacity 220ms var(--lv2-ease-out),
    transform 220ms var(--lv2-ease-out);
}

.label-swap-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.label-swap-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .label-swap-enter-active,
  .label-swap-leave-active {
    transition: none;
  }
}
</style>
