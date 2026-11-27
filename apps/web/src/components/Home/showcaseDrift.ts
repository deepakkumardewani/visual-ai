import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import {
  clampToRange,
  rowDriftRange,
  type DriftRange,
  type RowDirection,
} from '@/components/Home/showcaseLayout';

/** Per-frame share of the gap closed toward the scroll target; gives the drift a little weight. */
const DRIFT_EASE = 0.1;
/** How far each row always overhangs both screen edges, in px. */
const EDGE_MARGIN = 24;
/** Breathing room kept between a keyboard-focused tile and the screen edge, in px. */
const FOCUS_MARGIN = 48;

/** One drifting row: the clipping viewport, the focus-nudge wrapper and the moving track. */
export interface DriftRowEls {
  readonly direction: RowDirection;
  readonly viewport: HTMLElement;
  readonly focus: HTMLElement;
  readonly track: HTMLElement;
}

interface RowDriftOptions {
  readonly rows: readonly DriftRowEls[];
  /** Element whose visibility gates the frame loop. */
  readonly root: HTMLElement;
  readonly getProgress: () => number;
}

/** Lets direct input (drag, sideways wheel) move a row on top of the scroll drift. */
export interface RowDriftControl {
  /** Moves row `index` by `dx` px and holds it there until `release`. */
  readonly scrubBy: (index: number, dx: number) => void;
  /** Lets row `index` drift again with the scroll, from where it was left. */
  readonly release: (index: number) => void;
  readonly stop: () => void;
}

/** Below this many px of travel a row cannot move, so input is ignored. */
const MIN_SPAN_PX = 1;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

function measureRange(row: DriftRowEls): DriftRange {
  return rowDriftRange(
    row.direction,
    row.track.offsetWidth - row.viewport.clientWidth,
    EDGE_MARGIN,
  );
}

/**
 * Where each row sits, in drift progress (0 = range.from, 1 = range.to). A row
 * follows the shared scroll drift plus its own `bias`, the distance the visitor
 * moved it. While input is active the row is `held` at a fixed progress.
 */
function createRowState(count: number, getDrift: () => number) {
  const bias = Array.from({ length: count }, () => 0);
  const held: (number | null)[] = Array.from({ length: count }, () => null);

  const progressOf = (index: number): number => held[index] ?? clamp01(getDrift() + bias[index]);
  // Keep bias inside [0, 1] so scrolling back moves the row at once, with no dead zone.
  const normalize = (): void =>
    bias.forEach((value, index) => (bias[index] = clamp01(getDrift() + value) - getDrift()));
  const hold = (index: number, progress: number): void => void (held[index] = clamp01(progress));
  const release = (index: number): void => {
    const progress = held[index];
    if (progress === null) return;
    bias[index] = progress - getDrift();
    held[index] = null;
  };
  return { progressOf, normalize, hold, release };
}

/**
 * Drifts each row through its measured range as the scene scrolls, and lets
 * drag or wheel input push a row along that same range. Ranges are re-read on
 * every ScrollTrigger refresh and resize. Call inside a `useSceneMotion` setup.
 */
export function startRowDrift({ rows, root, getProgress }: RowDriftOptions): RowDriftControl {
  const ranges = rows.map(measureRange);
  const setters = rows.map((row) => gsap.quickSetter(row.track, 'x', 'px'));
  let drift = getProgress();
  const state = createRowState(rows.length, () => drift);

  const render = (): void =>
    setters.forEach((setX, index) => {
      const range = ranges[index];
      if (range) setX(gsap.utils.interpolate(range.from, range.to, state.progressOf(index)));
    });
  const refresh = (): void => {
    rows.forEach((row, index) => (ranges[index] = measureRange(row)));
    render();
  };
  const tick = (): void => {
    drift += (getProgress() - drift) * DRIFT_EASE;
    state.normalize();
    render();
  };

  render();
  const stopLoop = runWhileVisible(root, () => (drift = getProgress()), tick);
  const stopFocus = revealFocusedTiles(rows, (index) => ranges[index]);
  const resize = new ResizeObserver(refresh);
  rows.forEach((row) => [row.viewport, row.track].forEach((el) => resize.observe(el)));
  ScrollTrigger.addEventListener('refresh', refresh);

  const scrubBy = (index: number, dx: number): void => {
    const range = ranges[index];
    const span = range ? range.to - range.from : 0;
    if (Math.abs(span) < MIN_SPAN_PX) return;
    state.hold(index, state.progressOf(index) + dx / span);
    render();
  };

  return {
    scrubBy,
    release: state.release,
    stop: () => {
      ScrollTrigger.removeEventListener('refresh', refresh);
      resize.disconnect();
      stopLoop();
      stopFocus();
      rows.forEach((row) => gsap.set(row.track, { clearProps: 'transform' }));
    },
  };
}

/** Runs `tick` on the GSAP ticker only while `el` is on screen. */
function runWhileVisible(el: HTMLElement, onEnter: () => void, tick: () => void): () => void {
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) {
      gsap.ticker.remove(tick);
      return;
    }
    // Snap on entry so the rows never visibly slide in from a stale offset.
    onEnter();
    gsap.ticker.add(tick);
  });
  observer.observe(el);
  return () => {
    observer.disconnect();
    gsap.ticker.remove(tick);
  };
}

/** Offset that brings `rect` fully on screen with FOCUS_MARGIN to spare, or 0. */
function revealDelta(rect: DOMRect): number {
  const viewportWidth = document.documentElement.clientWidth;
  if (rect.left < FOCUS_MARGIN) return FOCUS_MARGIN - rect.left;
  if (rect.right > viewportWidth - FOCUS_MARGIN) return viewportWidth - FOCUS_MARGIN - rect.right;
  return 0;
}

/**
 * Drifting rows clip their tiles, so a tabbed-to tile may sit off screen.
 * Nudges the row's focus wrapper (transform only) until the tile is fully in
 * view, never past the row's drift range, so no edge gap opens.
 */
function revealFocusedTiles(
  rows: readonly DriftRowEls[],
  rangeOf: (index: number) => DriftRange | undefined,
): () => void {
  const onFocusIn = (event: FocusEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const index = rows.findIndex((row) => row.focus.contains(target));
    const row = rows[index];
    const range = rangeOf(index);
    const tile = target.closest('.tile');
    if (!row || !range || !tile) return;
    const trackX = Number(gsap.getProperty(row.track, 'x'));
    const focusX = new DOMMatrixReadOnly(getComputedStyle(row.focus).transform).m41;
    const wanted = trackX + focusX + revealDelta(tile.getBoundingClientRect());
    const nudge = clampToRange(wanted, range) - trackX;
    row.focus.style.transform = `translate3d(${nudge.toFixed(1)}px, 0, 0)`;
  };
  const onFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget;
    rows.forEach(({ focus }) => {
      if (!(next instanceof Node) || !focus.contains(next)) focus.style.removeProperty('transform');
    });
  };
  rows.forEach(({ focus }) => {
    focus.addEventListener('focusin', onFocusIn);
    focus.addEventListener('focusout', onFocusOut);
  });
  return () =>
    rows.forEach(({ focus }) => {
      focus.removeEventListener('focusin', onFocusIn);
      focus.removeEventListener('focusout', onFocusOut);
      focus.style.removeProperty('transform');
    });
}
