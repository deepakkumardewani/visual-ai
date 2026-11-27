<script setup lang="ts">
import { useReducedMotion } from '@/composables/useReducedMotion';
import ShowcaseTile from '@/components/Home/ShowcaseTile.vue';
import type { GalleryItem } from '@/utils/landing';

defineProps<{
  items: readonly GalleryItem[];
}>();

const emit = defineEmits<{
  open: [index: number, trigger: HTMLElement];
}>();

const CELL_SELECTOR = '.rail__cell';

const reduced = useReducedMotion();

/**
 * Keyboard users tab into cards the rail has not snapped to yet. Bring the
 * whole card in, not just the focused button, and jump rather than glide when
 * motion is reduced.
 */
function revealFocusedCell(event: FocusEvent): void {
  if (!(event.target instanceof Element)) return;
  const cell = event.target.closest<HTMLElement>(CELL_SELECTOR);
  cell?.scrollIntoView({
    inline: 'nearest',
    block: 'nearest',
    behavior: reduced.value ? 'instant' : 'smooth',
  });
}
</script>

<!-- Mobile: one native scroll-snap rail. It scrolls inside itself; the page never scrolls sideways. -->
<template>
  <ul
    class="rail"
    role="list"
    aria-label="Showcase images and their prompts"
    @focusin="revealFocusedCell"
  >
    <li v-for="(item, index) in items" :key="item.url" class="rail__cell">
      <ShowcaseTile
        :item="item"
        variant="rail"
        :open-label="`View image ${index + 1} of ${items.length} larger`"
        @open="(trigger) => emit('open', index, trigger)"
      />
    </li>
  </ul>
</template>

<style scoped lang="scss">
.rail {
  display: flex;
  gap: var(--home-space-lg);
  /* Stretch so every card is as tall as the longest; copy buttons share one baseline. */
  align-items: stretch;
  margin: 0;
  padding: var(--home-space-2xs) var(--home-gutter) var(--home-space-md);
  list-style: none;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: var(--home-gutter);
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.rail__cell {
  display: flex;
  flex: none;
  scroll-snap-align: start;
}
</style>
