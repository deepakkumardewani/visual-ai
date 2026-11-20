import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onBeforeUnmount, onMounted, type Ref } from 'vue';

gsap.registerPlugin(ScrollTrigger);

export const DESKTOP_QUERY = '(min-width: 900px)';
export const MOTION_OK_QUERY = '(prefers-reduced-motion: no-preference)';

export interface SceneConditions {
  /** Viewport is at least 900px wide. */
  readonly isDesktop: boolean;
  /** The visitor has not asked for reduced motion. */
  readonly motionOk: boolean;
}

/** Return a function to undo anything GSAP does not track itself (listeners, observers). */
export type SceneSetup = (conditions: SceneConditions, root: HTMLElement) => void | (() => void);

/**
 * Shared motion gate for every /v2 scene. Read-only for scene builders.
 *
 *   useSceneMotion(rootRef, ({ isDesktop, motionOk }, root) => {
 *     if (!motionOk) return;             // static layout, no tweens
 *     if (isDesktop) { ...pin / scrub... }
 *     return () => { ...remove listeners... };
 *   });
 *
 * - Runs `setup` after mount inside `gsap.matchMedia()`, scoped to `root`, so
 *   selector text in tweens only matches inside the scene.
 * - Re-runs `setup` whenever either condition flips; everything GSAP created in
 *   the previous run (tweens, timelines, ScrollTriggers, pins) is reverted first.
 * - Reverts everything on unmount. Do not nest `gsap.context()` inside `setup`.
 * - Pin and scrub only when `isDesktop && motionOk`.
 */
export function useSceneMotion(root: Ref<HTMLElement | null>, setup: SceneSetup): void {
  let media: gsap.MatchMedia | null = null;

  onMounted(() => {
    const el = root.value;
    if (!el) throw new Error('useSceneMotion: root element is not mounted');

    media = gsap.matchMedia();
    media.add(
      { isDesktop: DESKTOP_QUERY, motionOk: MOTION_OK_QUERY },
      (context) => {
        const { isDesktop = false, motionOk = false } = context.conditions ?? {};
        return setup({ isDesktop, motionOk }, el);
      },
      el,
    );
  });

  onBeforeUnmount(() => {
    media?.revert();
    media = null;
  });
}
