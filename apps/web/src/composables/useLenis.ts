import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { onBeforeUnmount, onMounted } from "vue";

import { useReducedMotion } from "@/composables/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

// Module-scoped so any component (e.g. the nav) can drive smooth anchor scrolls
// without creating a second Lenis instance.
let instance: Lenis | null = null;

/** Smoothly scroll to an element or selector; falls back to native scroll. */
export function scrollToSection(target: string | HTMLElement) {
  if (instance) {
    instance.scrollTo(target, { offset: -8 });
    return;
  }
  const el = typeof target === "string" ? document.querySelector(target) : target;
  el?.scrollIntoView({ behavior: "auto", block: "start" });
}

/**
 * Momentum smooth-scroll for the landing page, synced to GSAP's ticker so
 * ScrollTrigger reveals stay perfectly in step. Disabled entirely under
 * prefers-reduced-motion — native browser scroll takes over. Call once, from
 * the page-level component.
 */
export function useLenis() {
  const reduced = useReducedMotion();
  let tick: ((time: number) => void) | null = null;

  onMounted(() => {
    if (reduced.value) return;

    instance = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    instance.on("scroll", () => ScrollTrigger.update());

    tick = (time) => instance?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
  });

  onBeforeUnmount(() => {
    if (tick) gsap.ticker.remove(tick);
    instance?.destroy();
    instance = null;
    tick = null;
  });
}
