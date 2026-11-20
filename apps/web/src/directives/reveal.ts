import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { unref, type Directive, type InjectionKey, type Ref } from 'vue';

gsap.registerPlugin(ScrollTrigger);

const REVEAL_DISTANCE = 28;
const REVEAL_DURATION = 0.7;

/**
 * Scroll container a surface (e.g. `AppModal`) offers to descendants whose reveal must
 * track it instead of the window. The window never scrolls while the modal panel does.
 */
export const REVEAL_SCROLLER_KEY: InjectionKey<Ref<HTMLElement | null>> = Symbol('revealScroller');

interface RevealBinding {
  /** Seconds to delay the reveal — use for staggering siblings. */
  delay?: number;
  /** Vertical travel distance in px (default 28). */
  y?: number;
  /**
   * Scroll container to observe; omitted means the window. A ref is read at mount because a
   * parent's template ref is not yet set while the child renders.
   */
  scroller?: HTMLElement | Ref<HTMLElement | null> | null;
}

interface RevealElement extends HTMLElement {
  _revealTween?: gsap.core.Tween;
}

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * `v-reveal` — fades + lifts an element into view once on scroll.
 * Honors prefers-reduced-motion (element stays fully visible, no animation).
 * Usage: `v-reveal` or `v-reveal="{ delay: 0.12, y: 40 }"`.
 */
export const vReveal: Directive<RevealElement, RevealBinding | undefined> = {
  mounted(el, binding) {
    if (prefersReducedMotion()) return;

    const { delay = 0, y = REVEAL_DISTANCE, scroller } = binding.value ?? {};

    gsap.set(el, { opacity: 0, y });
    el._revealTween = gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: REVEAL_DURATION,
      delay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        once: true,
        scroller: unref(scroller) ?? undefined,
      },
    });
  },
  unmounted(el) {
    el._revealTween?.scrollTrigger?.kill();
    el._revealTween?.kill();
  },
};
