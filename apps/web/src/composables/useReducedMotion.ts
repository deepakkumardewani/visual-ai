import { usePreferredReducedMotion } from "@vueuse/core";
import { computed, type ComputedRef } from "vue";

/**
 * Reactive flag for the user's reduced-motion preference.
 * All landing motion (Lenis, GSAP reveals, ambient drift) must respect this.
 */
export function useReducedMotion(): ComputedRef<boolean> {
  const preference = usePreferredReducedMotion();
  return computed(() => preference.value === "reduce");
}
