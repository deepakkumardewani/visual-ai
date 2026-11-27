/**
 * Per-frame state the WebGL showcase reads from the page: where each tile sits,
 * how the /v2 hover treatment has progressed, and how fast the page scrolls.
 */
import type { ShowcaseRowEls, ShowcaseTileEls } from '@/components/LandingV3/glShowcaseDom';

const ACTIVE_QUERY = ':hover, :focus-within';
/** Mirrors ShowcaseTile's hover `.tile__img { transform: scale(1.04) }` over 900ms. */
const ZOOM_ACTIVE = 1.04;
const ZOOM_MS = 900;
/** Mirrors ShowcaseRows' spotlight `opacity: 0.62` on the other tiles over 420ms. */
const DIM_LEVEL = 0.62;
const DIM_MS = 420;
/** An exponential ease is ~98% there after four time constants, as a CSS ease-out ends. */
const EASE_TIME_CONSTANTS = 4;
/** Scroll speed (px/s) at which the ripple and split reach full strength. */
const VELOCITY_FULL_PX_S = 2600;
const ENERGY_ATTACK_MS = 160;
/** Slower than the attack, so the print settles rather than snaps flat. */
const ENERGY_RELEASE_MS = 900;
/** Below this the effect snaps to exactly 0, so a resting frame matches the DOM pixel for pixel. */
const ENERGY_REST = 0.004;
const MS_PER_SECOND = 1000;
/** A paused loop (offscreen tab, IO pause) must not read as one huge scroll jump. */
const MAX_FRAME_MS = 100;

/** A tile's resting box inside its track, in CSS pixels. */
export interface TileBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** The /v2 hover treatment for one tile, as it stands this frame. */
export interface TileLook {
  /** Vertical lift in px (negative is up), read from the figure's live transform. */
  lift: number;
  zoom: number;
  /** 1 is full strength; DIM_LEVEL while another tile has the spotlight. */
  dim: number;
}

export interface ScrollEnergy {
  /** 0..1 eased scroll speed; exactly 0 at rest. */
  readonly energy: number;
  /** +1 scrolling down, -1 up. */
  readonly direction: number;
}

export const clampFrameMs = (ms: number): number => Math.min(Math.max(ms, 0), MAX_FRAME_MS);

function easeToward(value: number, target: number, frameMs: number, durationMs: number): number {
  const share = 1 - Math.exp((-frameMs * EASE_TIME_CONSTANTS) / durationMs);
  return value + (target - value) * share;
}

/** Measured on refresh only: offsets of every cell from its track, transforms cancel out. */
export function measureRow(row: ShowcaseRowEls): TileBox[] {
  const origin = row.track.getBoundingClientRect();
  return row.tiles.map(({ cell }) => {
    const rect = cell.getBoundingClientRect();
    return {
      x: rect.left - origin.left,
      y: rect.top - origin.top,
      width: rect.width,
      height: rect.height,
    };
  });
}

function readLift(figure: HTMLElement): number {
  return new DOMMatrixReadOnly(getComputedStyle(figure).transform).m42;
}

/** Tracks the hover lift, zoom and spotlight dim for every tile, in tile order. */
export function trackTileLooks(
  tiles: readonly ShowcaseTileEls[],
): (frameMs: number) => readonly TileLook[] {
  const looks: TileLook[] = tiles.map(() => ({ lift: 0, zoom: 1, dim: 1 }));
  return (frameMs) => {
    const active = tiles.map(({ figure }) => figure.matches(ACTIVE_QUERY));
    const spotlight = active.some(Boolean);
    looks.forEach((look, index) => {
      const isActive = active[index] ?? false;
      // The lift is a CSS transition; read it while it can be non-zero so the quad rides it exactly.
      const figure = tiles[index]?.figure;
      if (figure && (isActive || look.lift !== 0)) look.lift = readLift(figure);
      look.zoom = easeToward(look.zoom, isActive ? ZOOM_ACTIVE : 1, frameMs, ZOOM_MS);
      const dimTarget = spotlight && !isActive ? DIM_LEVEL : 1;
      look.dim = easeToward(look.dim, dimTarget, frameMs, DIM_MS);
    });
    return looks;
  };
}

/** Eased scroll speed from the window scroll position (Lenis drives it). */
export function trackScrollEnergy(): (frameMs: number) => ScrollEnergy {
  let lastY = window.scrollY;
  let energy = 0;
  let direction = 1;
  return (frameMs) => {
    const delta = window.scrollY - lastY;
    lastY = window.scrollY;
    if (frameMs <= 0) return { energy, direction };
    if (delta !== 0) direction = Math.sign(delta);
    const speed = (Math.abs(delta) / frameMs) * MS_PER_SECOND;
    const target = Math.min(1, speed / VELOCITY_FULL_PX_S);
    const duration = target > energy ? ENERGY_ATTACK_MS : ENERGY_RELEASE_MS;
    energy = easeToward(energy, target, frameMs, duration);
    if (target === 0 && energy < ENERGY_REST) energy = 0;
    return { energy, direction };
  };
}
