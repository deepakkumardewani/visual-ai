import type { GalleryItem, ToolChapter } from '@/utils/landing';

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

/** How a gallery chapter's images arrive on the desktop stage. */
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

/** Generate: a loose hand of prints, as if just dealt from the deck. */
const DEAL_SLOTS: readonly ClusterSlot[] = [
  { left: 6, top: 14, width: 26, rotation: -6 },
  { left: 33, top: 4, width: 26, rotation: 2 },
  { left: 53, top: 42, width: 41, rotation: 4 },
];

/**
 * Remove background: plain prints hung square at stepped heights. No cutout
 * styling on purpose; public/landing has no real background-removal pair.
 */
const HUNG_SLOTS: readonly ClusterSlot[] = [
  { left: 4, top: 24, width: 28, rotation: 0 },
  { left: 36, top: 8, width: 28, rotation: 0 },
  { left: 68, top: 30, width: 28, rotation: 0 },
];

const ENTRANCE_SLOTS: Record<ClusterEntrance, readonly ClusterSlot[]> = {
  deal: DEAL_SLOTS,
  rise: HUNG_SLOTS,
};

const TOOL_ITEMS = sliceGallery(GALLERY_RANGES.tools);

/** TOOLS stores bare URLs; the ratio and prompt live on the gallery record. */
export function galleryItemFor(url: string): GalleryItem {
  const item = TOOL_ITEMS.find((candidate) => candidate.url === url);
  if (!item) throw new Error(`toolsMedia: ${url} is outside the tools gallery range`);
  return item;
}

export function clusterLayout(tool: ToolChapter): ClusterLayout {
  if (tool.media.kind !== 'gallery') {
    throw new Error(`toolsMedia: "${tool.id}" is not a gallery chapter`);
  }
  const entrance: ClusterEntrance = tool.id === 'generate' ? 'deal' : 'rise';
  const slots = ENTRANCE_SLOTS[entrance];
  const cards = tool.media.images.map((url, index) => {
    const slot = slots[index];
    if (!slot) throw new Error(`toolsMedia: no slot ${index} for "${tool.id}"`);
    const item = galleryItemFor(url);
    return { ...slot, item, aspectRatio: toCssAspectRatio(item.aspectRatio) };
  });
  return { entrance, cards };
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
