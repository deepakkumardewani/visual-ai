<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

import type { ExploreFeedItem } from '@/types';

import { useDashboardMotion } from '@/composables/useDashboardMotion';

const props = defineProps<{
  items: ExploreFeedItem[];
  activeId: string;
}>();

const emit = defineEmits<{
  select: [id: string];
}>();

const { interactiveTransition, pressable } = useDashboardMotion();

const scrollerRef = ref<HTMLElement | null>(null);

/** Scroll only the filmstrip track — never the document (avoids page wiggle). */
function scrollActiveIntoView(id: string) {
  const scroller = scrollerRef.value;
  if (!scroller || !id) return;
  const active = scroller.querySelector<HTMLElement>(`[data-filmstrip-id="${id}"]`);
  if (!active) return;

  const targetLeft = active.offsetLeft - scroller.clientWidth / 2 + active.offsetWidth / 2;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  scroller.scrollTo({
    left: Math.max(0, targetLeft),
    behavior: reduced ? 'auto' : 'smooth',
  });
}

watch(
  () => props.activeId,
  async (id) => {
    await nextTick();
    scrollActiveIntoView(id);
  },
  { immediate: true },
);

function handleSelect(id: string, event: MouseEvent) {
  // Drop focus ring so keyboard nav afterward doesn't look like a selection border.
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.blur();
  }
  emit('select', id);
}
</script>

<template>
  <nav
    v-if="items.length > 1"
    data-testid="explore-viewer-filmstrip"
    class="filmstrip tw-shrink-0 tw-border-t tw-border-hairline tw-bg-canvas/80"
    aria-label="Browse creations"
  >
    <div
      ref="scrollerRef"
      class="filmstrip__scroller tw-flex tw-gap-2 tw-overflow-x-auto tw-px-3 tw-py-2.5 sm:tw-px-4 sm:tw-py-3"
      role="list"
    >
      <button
        v-for="(thumb, index) in items"
        :key="thumb.id"
        type="button"
        role="listitem"
        :data-filmstrip-id="thumb.id"
        data-testid="explore-filmstrip-thumb"
        class="filmstrip__thumb tw-relative tw-h-14 tw-w-14 tw-shrink-0 tw-overflow-hidden tw-rounded-lg tw-bg-surface-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-2 sm:tw-h-16 sm:tw-w-16"
        :class="[
          interactiveTransition,
          pressable,
          thumb.id === activeId ? 'filmstrip__thumb--active' : 'filmstrip__thumb--idle',
        ]"
        :aria-label="`Show creation ${index + 1} by ${thumb.author}`"
        :aria-current="thumb.id === activeId ? 'true' : undefined"
        @click="handleSelect(thumb.id, $event)"
      >
        <img
          :src="thumb.imageUrl"
          :alt="''"
          loading="lazy"
          decoding="async"
          class="tw-h-full tw-w-full tw-object-cover"
          draggable="false"
        />
      </button>
    </div>
  </nav>
</template>

<style scoped lang="scss">
.filmstrip__scroller {
  /* Keep overflow for programmatic scroll-into-view; hide the visible bar. */
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
    height: 0;
    width: 0;
  }
}

.filmstrip__thumb--idle {
  opacity: 0.5;

  &:hover {
    opacity: 0.85;
  }
}

/* Active = brighter only — no accent border (avoids competing with the main image). */
.filmstrip__thumb--active {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .filmstrip__thumb {
    transition: none;
  }
}
</style>
