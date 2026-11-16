import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import {
  clampToRange,
  rowDriftRange,
  type DriftRange,
  type RowDirection,
} from '@/components/LandingV2/showcaseLayout';

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

function measureRange(row: DriftRowEls): DriftRange {
  return rowDriftRange(
    row.direction,
    row.track.offsetWidth - row.viewport.clientWidth,
    EDGE_MARGIN,
  );
}

/**
 * Drifts each row between its measured range as the scene scrolls. Ranges are
 * function-based tween values, re-read on every ScrollTrigger refresh and
 * resize. Call inside a `useSceneMotion` setup so matchMedia reverts the tweens.
 */
export function startRowDrift({ rows, root, getProgress }: RowDriftOptions): () => void {
  const ranges = rows.map(measureRange);
  const tweens = rows.map((row, index) =>
    gsap.fromTo(
      row.track,
      { x: () => ranges[index]?.from ?? 0 },
      { x: () => ranges[index]?.to ?? 0, ease: 'none', paused: true },
    ),
  );
  let drift = getProgress();

  const render = (): void => tweens.forEach((tween) => tween.progress(drift));
  const refresh = (): void => {
    rows.forEach((row, index) => (ranges[index] = measureRange(row)));
    tweens.forEach((tween) => tween.invalidate());
    render();
  };
  const tick = (): void => {
    drift += (getProgress() - drift) * DRIFT_EASE;
    render();
  };

  render();
  const stopLoop = runWhileVisible(root, () => (drift = getProgress()), tick);
  const stopFocus = revealFocusedTiles(rows, (index) => ranges[index]);
  const resize = new ResizeObserver(refresh);
  rows.forEach((row) => [row.viewport, row.track].forEach((el) => resize.observe(el)));
  ScrollTrigger.addEventListener('refresh', refresh);

  return () => {
    ScrollTrigger.removeEventListener('refresh', refresh);
    resize.disconnect();
    stopLoop();
    stopFocus();
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
