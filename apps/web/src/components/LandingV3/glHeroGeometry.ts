/**
 * Pure maths that turns the shared hero wall layout into on-screen quads, so the
 * WebGL wall lands every tile exactly where the DOM `HeroWall` would.
 */
import {
  STILL_INPUT,
  tileFrame,
  type TileFrame,
  type WallLayer,
  type WallPointer,
  type WallTile,
} from '@/components/LandingV2/heroWallLayout';

import type { GlStageSize } from '@/components/LandingV3/glStage';

/** Matches HeroWall's per-layer `border-radius`. */
const LAYER_RADIUS_PX: Readonly<Record<WallLayer, number>> = { 0: 8, 1: 12, 2: 16 };

/** Matches HeroWall's per-layer `box-shadow` (offset-y, blur, alpha). */
export interface TileShadow {
  readonly offsetY: number;
  readonly blur: number;
  readonly alpha: number;
}

const LAYER_SHADOW: Readonly<Record<WallLayer, TileShadow>> = {
  0: { offsetY: 0, blur: 0, alpha: 0 },
  1: { offsetY: 12, blur: 32, alpha: 0.45 },
  2: { offsetY: 30, blur: 80, alpha: 0.6 },
};

/** One tile's quad for one frame, in CSS pixels from the canvas's top-left corner. */
export interface TileQuad {
  readonly centerX: number;
  readonly centerY: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly opacity: number;
}

/** `"3:2"` from gallery.json as width over height. */
export function parseAspect(ratio: string): number {
  const [width, height] = ratio.split(':').map(Number);
  if (!width || !height) throw new Error(`Invalid gallery aspectRatio "${ratio}"`);
  return width / height;
}

/**
 * Mirrors HeroWall's CSS: the slot's top-left sits at (x, y) of the band, and
 * `translate(frame - 50%) scale(frame.scale)` around the centre moves it from there.
 */
export function tileQuad(tile: WallTile, frame: TileFrame, size: GlStageSize): TileQuad {
  if (tile.band !== 'full')
    throw new Error(`GlHeroWall only lays out full-band tiles: ${tile.band}`);
  const width = tile.width * size.width;
  const height = width / parseAspect(tile.image.aspectRatio);
  return {
    centerX: tile.x * size.width + frame.x * width,
    centerY: tile.y * size.height + frame.y * height,
    width: width * frame.scale,
    height: height * frame.scale,
    radius: LAYER_RADIUS_PX[tile.layer] * frame.scale,
    opacity: frame.opacity,
  };
}

export function tileShadow(tile: WallTile): TileShadow {
  return LAYER_SHADOW[tile.layer];
}

/** Unit direction a tile flies on exit, read off the shared frame function itself. */
export function exitDirection(tile: WallTile): WallPointer {
  const rest = tileFrame(tile, STILL_INPUT);
  const gone = tileFrame(tile, { ...STILL_INPUT, scroll: 1 });
  const dx = gone.x - rest.x;
  const dy = gone.y - rest.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return { x: 0, y: -1 };
  return { x: dx / length, y: dy / length };
}

/**
 * UV scale that reproduces `object-fit: cover` for an image of `imageAspect`
 * inside a box of `boxAspect` (both width over height).
 */
export function coverScale(boxAspect: number, imageAspect: number): readonly [number, number] {
  if (imageAspect > boxAspect) return [boxAspect / imageAspect, 1];
  return [1, imageAspect / boxAspect];
}

/** Extra quad margin (px) each side so the soft shadow is not cut off. */
export function shadowPadding(shadow: TileShadow): number {
  return shadow.alpha === 0 ? 1 : shadow.offsetY + shadow.blur;
}
