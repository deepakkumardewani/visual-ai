/**
 * Eased cursor state for the WebGL hero. The parallax half copies HeroWall's
 * pointer handling (same normalisation, ease and fine-pointer gate) so the GL
 * tiles drift exactly as the DOM tiles would; HeroWall is read-only, hence the copy.
 */
import type { WallPointer } from '@/components/LandingV2/heroWallLayout';

const POINTER_FINE_QUERY = '(pointer: fine)';
/** Per-frame share of the gap closed toward the real pointer, as in HeroWall. */
const POINTER_EASE = 0.06;
/** The light catches up faster than the parallax, so it reads as following the cursor. */
const LIGHT_EASE = 0.14;
/** Per-frame share by which the light fades in after the first move. */
const LIGHT_LEVEL_EASE = 0.04;
/** Movement within this window counts as the cursor being in use; the prompt's spotlight yields to it. */
const CURSOR_IDLE_MS = 1400;

export interface PointerSample {
  /** -1..1 from the viewport centre, for parallax. */
  readonly parallax: WallPointer;
  /** Viewport (client) pixels, for the light. */
  readonly client: WallPointer;
  /** 0 until the pointer first moves, easing to 1. */
  readonly level: number;
  /** True while the pointer has moved within the last `CURSOR_IDLE_MS`. */
  readonly moving: boolean;
}

export interface HeroPointer {
  /** Advances the easing by one frame and returns the result. */
  step: () => PointerSample;
  /**
   * Jumps the parallax to where the DOM wall's own ease has (nearly) settled, so
   * the first GL frame lands on the DOM tiles instead of at zero parallax.
   */
  settle: () => PointerSample;
  stop: () => void;
}

const approach = (from: number, to: number, ease: number): number => from + (to - from) * ease;

export function trackHeroPointer(): HeroPointer {
  const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const parallax = { x: 0, y: 0 };
  const client = { ...target };
  let moved = false;
  let level = 0;
  let lastMoveAt = Number.NEGATIVE_INFINITY;
  const isMoving = (): boolean => performance.now() - lastMoveAt < CURSOR_IDLE_MS;

  const onMove = (event: PointerEvent): void => {
    target.x = event.clientX;
    target.y = event.clientY;
    if (!moved) Object.assign(client, target);
    moved = true;
    lastMoveAt = performance.now();
  };
  const fine = window.matchMedia(POINTER_FINE_QUERY).matches;
  if (fine) window.addEventListener('pointermove', onMove, { passive: true });

  const toParallax = (): WallPointer => ({
    x: (target.x / window.innerWidth) * 2 - 1,
    y: (target.y / window.innerHeight) * 2 - 1,
  });
  const step = (): PointerSample => {
    const goal = toParallax();
    parallax.x = approach(parallax.x, goal.x, POINTER_EASE);
    parallax.y = approach(parallax.y, goal.y, POINTER_EASE);
    client.x = approach(client.x, target.x, LIGHT_EASE);
    client.y = approach(client.y, target.y, LIGHT_EASE);
    level = approach(level, moved ? 1 : 0, LIGHT_LEVEL_EASE);
    return { parallax, client, level, moving: isMoving() };
  };

  const settle = (): PointerSample => {
    Object.assign(parallax, toParallax());
    Object.assign(client, target);
    return { parallax, client, level, moving: isMoving() };
  };

  return {
    step,
    settle,
    stop: () => {
      if (fine) window.removeEventListener('pointermove', onMove);
    },
  };
}
