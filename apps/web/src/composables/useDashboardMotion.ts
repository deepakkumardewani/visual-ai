import { computed, type ComputedRef } from 'vue';

import { useReducedMotion } from '@/composables/useReducedMotion';

export interface DashboardMotionClasses {
  reducedMotion: ComputedRef<boolean>;
  interactiveTransition: ComputedRef<string>;
  pressable: ComputedRef<string>;
  chevronTransition: ComputedRef<string>;
  imageHoverZoom: ComputedRef<string>;
  cardHover: ComputedRef<string>;
}

/**
 * Token-aligned interaction classes for the dashboard, gated by reduced-motion preference.
 */
export function useDashboardMotion(): DashboardMotionClasses {
  const reducedMotion = useReducedMotion();

  const interactiveTransition = computed(
    () => 'tw-transition-colors tw-duration-fast motion-reduce:tw-transition-none',
  );

  const pressable = computed(() =>
    reducedMotion.value
      ? 'active:tw-opacity-90'
      : 'tw-transition-transform tw-duration-fast tw-ease-soft active:tw-scale-[0.98] motion-reduce:tw-transition-none motion-reduce:active:tw-scale-100',
  );

  const chevronTransition = computed(() =>
    reducedMotion.value
      ? ''
      : 'tw-transition-transform tw-duration-base tw-ease-soft motion-reduce:tw-transition-none',
  );

  const imageHoverZoom = computed(() =>
    reducedMotion.value
      ? ''
      : 'tw-transition-transform tw-duration-fast group-hover:tw-scale-[1.02] motion-reduce:tw-transition-none motion-reduce:group-hover:tw-scale-100',
  );

  const cardHover = computed(() =>
    reducedMotion.value
      ? ''
      : 'tw-transition-[border-color,box-shadow] tw-duration-fast hover:tw-border-accent/30 hover:tw-shadow-elevated motion-reduce:tw-transition-none',
  );

  return {
    reducedMotion,
    interactiveTransition,
    pressable,
    chevronTransition,
    imageHoverZoom,
    cardHover,
  };
}
