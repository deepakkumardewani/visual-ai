import type { CutoutPair, GalleryItem, ToolChapter } from '@/utils/landing';

import { GALLERY_RANGES, sliceGallery } from '@/components/LandingV2/galleryRanges';
import { toCssAspectRatio } from '@/components/LandingV2/heroWallLayout';

/**
 * Every tool frame shares one box so the stage never resizes between chapters.
 * The before/after pairs run 1.5 to 1.9 wide; 16:10 crops each one only a little.
 */
export const STAGE_RATIO_WIDTH = 16;
export const STAGE_RATIO_HEIGHT = 10;
export const STAGE_ASPECT_RATIO = `${STAGE_RATIO_WIDTH} / ${STAGE_RATIO_HEIGHT}`;

const PERCENT = 100;
const CENTER_PERCENT = 50;

/** How a cluster chapter's media arrives on the desktop stage. */
export type ClusterEntrance = 'deal' | 'rise';

/** A card's resting place, in percent of the stage box. */
export interface ClusterSlot {
  readonly left: number;
  readonly top: number;
  /** Share of the stage width. */
  readonly width: number;
  readonly rotation: number;
}

export interface ClusterCard extends ClusterSlot {
  readonly item: GalleryItem;
  /** CSS `aspect-ratio` value from the image's own ratio. */
  readonly aspectRatio: string;
}

export interface ClusterLayout {
  readonly entrance: ClusterEntrance;
  readonly cards: readonly ClusterCard[];
}

/**
 * Generate: a loose hand of prints, as if just dealt from the deck. It spans
 * the stage edge to edge (3% to 98% across, 0 to 94% down), so it carries the
 * same weight as the full-bleed before/after frames of the other chapters.
 */
const DEAL_SLOTS: readonly ClusterSlot[] = [
  { left: 3, top: 10, width: 29, rotation: -6 },
  { left: 33, top: 0, width: 29, rotation: 2 },
  { left: 49, top: 42, width: 49, rotation: 4 },
];

/** Remove background: three cutout cards hung square at stepped heights. */
const CUTOUT_SLOTS: readonly ClusterSlot[] = [
  { left: 4, top: 24, width: 28, rotation: 0 },
  { left: 36, top: 8, width: 28, rotation: 0 },
  { left: 68, top: 30, width: 28, rotation: 0 },
];

/**
 * The same three cards on the pinned desktop stage: wider and centred on the
 * stage (4% to 90% down), so they fill it like the other chapters' media.
 */
const STAGE_CUTOUT_SLOTS: readonly ClusterSlot[] = [
  { left: 1, top: 16, width: 31, rotation: 0 },
  { left: 34.5, top: 4, width: 31, rotation: 0 },
  { left: 68, top: 28, width: 31, rotation: 0 },
];

/** 'stage' is the pinned desktop stage; 'spread' everywhere else (stacked list, v1 pages). */
export type CutoutLayout = 'spread' | 'stage';

const CUTOUT_LAYOUTS: Record<CutoutLayout, readonly ClusterSlot[]> = {
  spread: CUTOUT_SLOTS,
  stage: STAGE_CUTOUT_SLOTS,
};

const TOOL_ITEMS = sliceGallery(GALLERY_RANGES.tools);

/** TOOLS stores bare URLs; the ratio and prompt live on the gallery record. */
export function galleryItemFor(url: string): GalleryItem {
  const item = TOOL_ITEMS.find((candidate) => candidate.url === url);
  if (!item) throw new Error(`toolsMedia: ${url} is outside the tools gallery range`);
  return item;
}

export function clusterLayout(tool: ToolChapter): ClusterLayout {
  if (tool.media.kind === 'cutout') {
    // Cutout cards only rise in; the timeline reads no per-card geometry for that.
    return { entrance: 'rise', cards: [] };
  }
  if (tool.media.kind !== 'gallery') {
    throw new Error(`toolsMedia: "${tool.id}" is not a cluster chapter`);
  }
  const cards = tool.media.images.map((url, index) => {
    const slot = DEAL_SLOTS[index];
    if (!slot) throw new Error(`toolsMedia: no slot ${index} for "${tool.id}"`);
    const item = galleryItemFor(url);
    return { ...slot, item, aspectRatio: toCssAspectRatio(item.aspectRatio) };
  });
  return { entrance: 'deal', cards };
}

export interface CutoutCard extends ClusterSlot {
  readonly pair: CutoutPair;
}

export function cutoutCards(
  pairs: readonly CutoutPair[],
  layout: CutoutLayout = 'spread',
): CutoutCard[] {
  const slots = CUTOUT_LAYOUTS[layout];
  return pairs.map((pair, index) => {
    const slot = slots[index];
    if (!slot) throw new Error(`toolsMedia: no cutout slot ${index}`);
    return { ...slot, pair };
  });
}

function ratioOf(aspectRatio: string): number {
  const [width, height] = aspectRatio.split('/').map(Number);
  if (!width || !height) throw new Error(`toolsMedia: invalid aspect ratio "${aspectRatio}"`);
  return height / width;
}

/**
 * The offset, in the card's own xPercent/yPercent, that puts its centre on the
 * stage centre. Dealing animates from here to 0, so the cards spread from one deck.
 */
export function deckOffset(card: ClusterCard): { xPercent: number; yPercent: number } {
  const heightShare =
    (card.width * ratioOf(card.aspectRatio) * STAGE_RATIO_WIDTH) / STAGE_RATIO_HEIGHT;
  const dx = CENTER_PERCENT - (card.left + card.width / 2);
  const dy = CENTER_PERCENT - (card.top + heightShare / 2);
  return {
    xPercent: (dx / card.width) * PERCENT,
    yPercent: (dy / heightShare) * PERCENT,
  };
}

/** Two-digit chapter number for the rail and labels: 1 -> "01". */
export function chapterNumber(index: number): string {
  return String(index + 1).padStart(2, '0');
}
