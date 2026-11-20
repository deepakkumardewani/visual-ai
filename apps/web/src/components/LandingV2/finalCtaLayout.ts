/**
 * The final CTA's converging frame, as data plus one pure function.
 *
 * It is the hero wall's exit played in reverse, but slower and heavier: a
 * quintic settle with a wide stagger, so the closing shot lands rather than
 * replays. Nothing but `ctaTileFrame` may move a tile.
 */
import { FINAL_CTA_ITEMS } from '@/components/LandingV2/galleryRanges';
import type { GalleryItem } from '@/utils/landing';

export interface CtaSlot {
  /** Index into `FINAL_CTA_ITEMS`. */
  readonly item: number;
  /** Tile centre as a fraction (0-1) of the stage's width and height. */
  readonly x: number;
  readonly y: number;
  /** Tile width as a fraction of the stage width. Height follows the image ratio. */
  readonly width: number;
  /** How far (in tile sizes) the tile starts from its resting place, outward from the centre. */
  readonly fly: number;
  /** Arrival sequence position; 0 lands first. */
  readonly order: number;
}

export interface CtaTile extends CtaSlot {
  readonly image: GalleryItem;
}

export interface CtaFrame {
  /** Offsets are in tile-size units (1 = one tile width/height). */
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly opacity: number;
}

const STAGE_CENTRE = 0.5;
const ARRIVE_STAGGER = 0.04;
/** Each tile travels for this share of the scroll range; the last stagger still finishes at 1. */
const ARRIVE_SPAN = 0.6;
const START_SCALE = 1.35;
const FADE_IN_SHARE = 0.35;

/** Progress at which the frame is fully composed. */
export const CTA_COMPOSED = 1;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Heavy settle: fast departure, long soft landing. */
const quintOut = (t: number): number => 1 - (1 - t) ** 5;

const smoothstep = (t: number): number => t * t * (3 - 2 * t);

/**
 * Tiles arrive from the left, right and bottom only. Upward travel would carry
 * them above the section, over the FAQ, so it is dropped before normalising.
 */
function direction(slot: CtaSlot): { x: number; y: number } {
  const dx = slot.x - STAGE_CENTRE;
  const dy = Math.max(0, slot.y - STAGE_CENTRE);
  const length = Math.hypot(dx, dy);
  if (length === 0) return { x: 0, y: 1 };
  return { x: dx / length, y: dy / length };
}

/** Where a tile sits and how it looks at scroll progress 0-1. Pure: same input, same frame. */
export function ctaTileFrame(slot: CtaSlot, progress: number): CtaFrame {
  const local = clamp01((progress - slot.order * ARRIVE_STAGGER) / ARRIVE_SPAN);
  const settled = quintOut(local);
  const remaining = slot.fly * (1 - settled);
  const dir = direction(slot);

  return {
    x: dir.x * remaining,
    y: dir.y * remaining,
    scale: 1 + (START_SCALE - 1) * (1 - settled),
    opacity: smoothstep(clamp01(local / FADE_IN_SHARE)),
  };
}

export function ctaFrameToTransform(frame: CtaFrame): string {
  const x = (frame.x * 100).toFixed(2);
  const y = (frame.y * 100).toFixed(2);
  return `translate3d(-50%, -50%, 0) translate3d(${x}%, ${y}%, 0) scale(${frame.scale.toFixed(4)})`;
}

/** `"3:2"` from gallery.json to CSS `"3 / 2"`. */
export function toCssAspectRatio(ratio: string): string {
  const [width, height] = ratio.split(':');
  if (!width || !height) throw new Error(`Invalid gallery aspectRatio "${ratio}"`);
  return `${width} / ${height}`;
}

/*
 * Desktop: stage is 8:5. The copy owns x 0.3-0.7 and y 0.22-0.78, so no tile
 * reaches into that box; ten tiles frame it left, right, top and bottom.
 */
const DESKTOP_SLOTS: readonly CtaSlot[] = [
  { item: 4, x: 0.09, y: 0.3, width: 0.11, fly: 2.4, order: 0 },
  { item: 7, x: 0.91, y: 0.3, width: 0.11, fly: 2.4, order: 1 },
  { item: 0, x: 0.21, y: 0.6, width: 0.13, fly: 2.2, order: 2 },
  { item: 3, x: 0.79, y: 0.64, width: 0.13, fly: 2.2, order: 3 },
  { item: 2, x: 0.1, y: 0.88, width: 0.17, fly: 2.2, order: 4 },
  { item: 1, x: 0.9, y: 0.88, width: 0.17, fly: 2.2, order: 5 },
  { item: 5, x: 0.28, y: 0.1, width: 0.08, fly: 3, order: 6 },
  { item: 11, x: 0.72, y: 0.1, width: 0.08, fly: 3, order: 7 },
  { item: 6, x: 0.3, y: 0.9, width: 0.07, fly: 3, order: 8 },
  { item: 10, x: 0.7, y: 0.92, width: 0.1, fly: 3, order: 9 },
];

/*
 * Mobile: a static cluster of five, never animated. Two wide tiles sit behind,
 * the centre tile overlaps both of them on purpose, and two small tiles tuck
 * under it at the bottom corners. Later entries paint on top.
 */
const MOBILE_SLOTS: readonly CtaSlot[] = [
  { item: 0, x: 0.27, y: 0.36, width: 0.36, fly: 0, order: 0 },
  { item: 5, x: 0.73, y: 0.36, width: 0.36, fly: 0, order: 1 },
  { item: 4, x: 0.15, y: 0.8, width: 0.22, fly: 0, order: 2 },
  { item: 7, x: 0.85, y: 0.8, width: 0.22, fly: 0, order: 3 },
  { item: 3, x: 0.5, y: 0.58, width: 0.32, fly: 0, order: 4 },
];

function ctaItem(index: number): GalleryItem {
  const image = FINAL_CTA_ITEMS[index];
  if (!image) throw new Error(`Final CTA points past its gallery range: ${index}`);
  return image;
}

const resolveSlot = (slot: CtaSlot): CtaTile => ({ ...slot, image: ctaItem(slot.item) });

export const DESKTOP_CTA_TILES: readonly CtaTile[] = DESKTOP_SLOTS.map(resolveSlot);
export const MOBILE_CTA_TILES: readonly CtaTile[] = MOBILE_SLOTS.map(resolveSlot);
