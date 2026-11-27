/**
 * One run of the home handover veil: mount a full-screen stage, then draw only
 * while the visitor scrolls across a boundary between two scenes. Between
 * handovers, and once scrolling settles, no frames are requested at all.
 */
import { createLogger } from '@/utils/logger';

import { createGlStage, type GlStage } from '@/components/Home/glStage';
import { createTransitionScene, type TransitionScene } from '@/components/Home/glTransitionScene';

const log = createLogger('Home:GlTransition');

/** Where in the viewport (fraction of its height from the top) a handover peaks. */
const HANDOVER_ANCHOR = 0.5;
/** How far a scene boundary may be from the anchor (fraction of viewport height) and still veil. */
const HANDOVER_BAND = 0.4;
/** Scrolling has settled once no scroll event arrived for this long; the veil then fades out. */
const SETTLE_MS = 180;
/** Time constant of the veil's fade towards its target, in ms. */
const FADE_TAU_MS = 140;
/** Below this the veil is invisible, so the loop draws one clear frame and stops. */
const IDLE_STRENGTH = 0.004;
const MS_PER_SECOND = 1000;

export interface TransitionSessionOptions {
  /** The page's `<main>`; its element children are the scenes. */
  readonly main: HTMLElement;
  /** Fixed full-screen box the canvas fills. */
  readonly host: HTMLElement;
}

const smoothstep = (t: number): number => t * t * (3 - 2 * t);

/** 0..1: how close the nearest scene boundary is to the handover anchor. */
export function measureHandover(main: HTMLElement): number {
  const viewport = window.innerHeight;
  const anchor = viewport * HANDOVER_ANCHOR;
  const band = viewport * HANDOVER_BAND;
  // Read fresh each time: pins wrap scenes in spacers that matchMedia flips recreate.
  // The first child's top is the page top, not a handover.
  const boundaries = Array.from(main.children).slice(1);
  return boundaries.reduce((strongest, scene) => {
    const distance = Math.abs(scene.getBoundingClientRect().top - anchor) / band;
    return distance >= 1 ? strongest : Math.max(strongest, 1 - smoothstep(distance));
  }, 0);
}

/** Eases `current` towards `target`, frame-rate independent. */
function approach(current: number, target: number, frameMs: number): number {
  return target + (current - target) * Math.exp(-frameMs / FADE_TAU_MS);
}

/** Scroll-gated loop; returns a stop function. */
function runHandoverLoop(main: HTMLElement, scene: TransitionScene): () => void {
  let frameId = 0;
  let strength = 0;
  let lastScroll = 0;
  let lastFrame = 0;

  const tick = (now: number): void => {
    const scrolling = now - lastScroll < SETTLE_MS;
    const target = scrolling ? measureHandover(main) : 0;
    strength = approach(strength, target, now - lastFrame);
    lastFrame = now;
    const idle = target === 0 && strength < IDLE_STRENGTH;
    if (idle) strength = 0;
    // An idle frame still draws: it clears the last grain frame off the canvas.
    scene.render({ strength, time: now / MS_PER_SECOND });
    frameId = idle ? 0 : requestAnimationFrame(tick);
  };
  const onScroll = (): void => {
    lastScroll = performance.now();
    if (frameId !== 0 || measureHandover(main) === 0) return;
    lastFrame = lastScroll;
    frameId = requestAnimationFrame(tick);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  return () => {
    window.removeEventListener('scroll', onScroll);
    cancelAnimationFrame(frameId);
    frameId = 0;
  };
}

/**
 * Starts the veil and returns a synchronous stop. Stopping at any point, even
 * mid-load, cancels the rest. Failure only loses the veil; there is no DOM to restore.
 */
export function startTransitionSession(options: TransitionSessionOptions): () => void {
  const abort = new AbortController();
  let stage: GlStage | null = null;
  let scene: TransitionScene | null = null;
  let stopLoop: (() => void) | null = null;

  const teardown = (): void => {
    stopLoop?.();
    scene?.dispose();
    stage?.dispose();
    stopLoop = null;
    scene = null;
    stage = null;
  };
  const stopOnContextLost = (): void => {
    stopLoop?.();
    stopLoop = null;
  };

  const mount = async (): Promise<void> => {
    stage = await createGlStage({
      container: options.host,
      signal: abort.signal,
      onContextLost: stopOnContextLost,
    });
    if (!stage || abort.signal.aborted) return teardown();
    scene = createTransitionScene(stage);
    stopLoop = runHandoverLoop(options.main, scene);
  };

  mount().catch((error: Error) => {
    log.error('WebGL handover veil failed; continuing without it', error);
    teardown();
  });

  return () => {
    abort.abort();
    teardown();
  };
}
