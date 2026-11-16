import galleryData from '@/utils/gallery.json';
import type { GalleryItem } from '@/utils/landing';

export interface GalleryRange {
  /** First index, inclusive. */
  readonly start: number;
  /** Last index, inclusive. */
  readonly end: number;
}

/**
 * Which slice of `gallery.json` each /v2 scene may use. Kept disjoint so no
 * image repeats between the hero and the scenes right after it. Tools (0-5)
 * and showcase (0-11) are already fixed by `TOOLS` and `SHOWCASE` in
 * `utils/landing.ts` and are listed here only to document the reservation.
 */
export const GALLERY_RANGES = {
  tools: { start: 0, end: 5 },
  showcase: { start: 0, end: 11 },
  hero: { start: 12, end: 31 },
  finalCta: { start: 32, end: 43 },
} as const satisfies Record<string, GalleryRange>;

const GALLERY_ITEMS = galleryData as readonly GalleryItem[];

export function sliceGallery(range: GalleryRange): readonly GalleryItem[] {
  return GALLERY_ITEMS.slice(range.start, range.end + 1);
}

export const HERO_ITEMS = sliceGallery(GALLERY_RANGES.hero);
export const FINAL_CTA_ITEMS = sliceGallery(GALLERY_RANGES.finalCta);
