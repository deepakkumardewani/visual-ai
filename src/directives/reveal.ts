import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Directive } from "vue";

gsap.registerPlugin(ScrollTrigger);

const REVEAL_DISTANCE = 28;
const REVEAL_DURATION = 0.7;

interface RevealBinding {
  /** Seconds to delay the reveal — use for staggering siblings. */
  delay?: number;
  /** Vertical travel distance in px (default 28). */
  y?: number;
}

interface RevealElement extends HTMLElement {
  _revealTween?: gsap.core.Tween;
}

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * `v-reveal` — fades + lifts an element into view once on scroll.
 * Honors prefers-reduced-motion (element stays fully visible, no animation).
 * Usage: `v-reveal` or `v-reveal="{ delay: 0.12, y: 40 }"`.
 */
export const vReveal: Directive<RevealElement, RevealBinding | undefined> = {
  mounted(el, binding) {
    if (prefersReducedMotion()) return;

    const { delay = 0, y = REVEAL_DISTANCE } = binding.value ?? {};

    gsap.set(el, { opacity: 0, y });
    el._revealTween = gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: REVEAL_DURATION,
      delay,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  },
  unmounted(el) {
    el._revealTween?.scrollTrigger?.kill();
    el._revealTween?.kill();
  },
};
