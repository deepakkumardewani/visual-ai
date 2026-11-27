import { computed, onBeforeUnmount, ref, toValue, type MaybeRefOrGetter } from 'vue';

import { pauseSmoothScroll, resumeSmoothScroll } from '@/composables/useLenis';

/**
 * Which showcase image is open in the enlarged view. Opening focuses the tile
 * that asked for it first, so the dialog hands focus back to that tile when it
 * closes, and freezes smooth scroll so the page stays put underneath.
 */
export function useShowcaseLightbox(count: MaybeRefOrGetter<number>) {
  const openIndex = ref<number | null>(null);
  const isOpen = computed(() => openIndex.value !== null);

  function open(index: number, trigger: HTMLElement): void {
    // Safari never focuses a clicked button; the dialog restores whatever had focus.
    trigger.focus({ preventScroll: true });
    openIndex.value = index;
    pauseSmoothScroll();
  }

  function close(): void {
    if (openIndex.value === null) return;
    openIndex.value = null;
    resumeSmoothScroll();
  }

  /** Steps through the showcase in order, wrapping at both ends. */
  function step(by: number): void {
    const total = toValue(count);
    if (openIndex.value === null || total === 0) return;
    openIndex.value = (openIndex.value + by + total) % total;
  }

  onBeforeUnmount(close);

  return { openIndex, isOpen, open, close, next: () => step(1), prev: () => step(-1) };
}
