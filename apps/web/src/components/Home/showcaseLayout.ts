import type { GalleryItem } from '@/utils/landing';

export { toCssAspectRatio } from '@/components/LandingV2/heroWallLayout';

/**
 * Contract for anything that renders the showcase media layer: the DOM rows
 * here, or a WebGL layer in /v3. Progress is read through a getter on every
 * frame, so it is never a reactive ref.
 */
export interface ShowcaseMediaProps {
  readonly items: readonly GalleryItem[];
  /** Scroll progress of the scene through the viewport, 0 (entering) to 1 (leaving). */
  readonly getProgress: () => number;
}

/** Which way a row travels as the page scrolls down. */
export type RowDirection = 'left' | 'right';

export interface ShowcaseEntry {
  readonly item: GalleryItem;
  /** Position in the full showcase, used for the "No. 04" label. */
  readonly index: number;
}

export interface ShowcaseRow {
  readonly direction: RowDirection;
  readonly entries: readonly ShowcaseEntry[];
}

/**
 * Row heights relative to the first row while drifting. Must match the ratio
 * of `--row-height-*` in ShowcaseRows.vue so the balance below holds.
 */
const ROW_SCALES = [1, 0.75] as const;
const ROW_DIRECTIONS = ['left', 'right'] as const satisfies readonly RowDirection[];

/** `"3:2"` to 1.5. */
export function aspectValue(ratio: string): number {
  const [width, height] = ratio.split(':').map(Number);
  if (!width || !height) throw new Error(`Invalid gallery aspectRatio "${ratio}"`);
  return width / height;
}

/**
 * Splits items into two rows of similar rendered width (sum of aspect ratio
 * times row height), keeping gallery order inside each row. Alternating by
 * index would leave one row far shorter than the other and stall its drift.
 */
export function splitRows(items: readonly GalleryItem[]): [ShowcaseRow, ShowcaseRow] {
  const widths: [number, number] = [0, 0];
  const buckets: [ShowcaseEntry[], ShowcaseEntry[]] = [[], []];
  items.forEach((item, index) => {
    const target = widths[0] <= widths[1] ? 0 : 1;
    widths[target] += aspectValue(item.aspectRatio) * ROW_SCALES[target];
    buckets[target].push({ item, index });
  });
  return [
    { direction: ROW_DIRECTIONS[0], entries: buckets[0] },
    { direction: ROW_DIRECTIONS[1], entries: buckets[1] },
  ];
}

/** Sum of the row's aspect ratios: its width in units of its own height. */
export function rowAspectSum(entries: readonly ShowcaseEntry[]): number {
  return entries.reduce((sum, entry) => sum + aspectValue(entry.item.aspectRatio), 0);
}

/** Row translateX in px at scroll progress 0 (`from`) and 1 (`to`). */
export interface DriftRange {
  readonly from: number;
  readonly to: number;
}

/**
 * Keeps a full-bleed row overhanging both screen edges by at least `margin`
 * at every progress, so neither edge ever shows an empty gap. `overflow` is
 * the row's width minus the viewport's. Too little overflow to drift centres
 * the row and holds it still.
 */
export function rowDriftRange(
  direction: RowDirection,
  overflow: number,
  margin: number,
): DriftRange {
  if (overflow <= 2 * margin) {
    const centred = -Math.max(0, overflow) / 2;
    return { from: centred, to: centred };
  }
  const flushLeft = -margin;
  const flushRight = -(overflow - margin);
  return direction === 'left'
    ? { from: flushLeft, to: flushRight }
    : { from: flushRight, to: flushLeft };
}

/** Clamps a row offset into its drift range, whichever way the row travels. */
export function clampToRange(x: number, range: DriftRange): number {
  return Math.min(Math.max(x, Math.min(range.from, range.to)), Math.max(range.from, range.to));
}

/** `3` to `"03"`, for the gallery-label numbering. */
export function formatPlate(index: number): string {
  return String(index + 1).padStart(2, '0');
}
