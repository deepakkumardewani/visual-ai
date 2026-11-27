/**
 * The hero wall's look, as data plus one pure function.
 *
 * Renderers (the DOM `HeroWall` and the WebGL `GlHeroWall`) place each
 * tile at its slot and apply `tileFrame(tile, input)` every frame. Nothing else
 * may move a tile, so every renderer stays in step with the same scroll story.
 */
import { HERO_ITEMS } from '@/components/Home/galleryRanges';
import type { GalleryItem } from '@/utils/landing';

/** 0 is the far layer, 2 the near layer. */
export type WallLayer = 0 | 1 | 2;

/** The box a tile is positioned in: the whole hero, or a band above/below the copy. */
export type WallBand = 'full' | 'top' | 'bottom';

export interface WallSlot {
  /** Index into `HERO_ITEMS`. */
  readonly item: number;
  readonly band: WallBand;
  /** Tile centre as a fraction (0-1) of its band's width and height. */
  readonly x: number;
  readonly y: number;
  /** Tile width as a fraction of its band's width. Height follows the image ratio. */
  readonly width: number;
  readonly layer: WallLayer;
  /** Bloom sequence position; 0 blooms first. */
  readonly order: number;
  /** Leave through the copy's half instead of flying outward; see `WallCrossing`. */
  readonly crossing?: WallCrossing;
}

/**
 * An exit that sweeps through the left half once the copy has mostly faded, so
 * the half the copy vacates is never empty while the rest of the wall leaves.
 */
export interface WallCrossing {
  /** Band point (0-1) the tile aims through; it keeps going until it leaves the band. */
  readonly toward: WallPointer;
  /** Share of the scroll exit at which it sets off; it holds its slot until then. */
  readonly start: number;
}

/** A slot resolved to its real gallery image: the "layout item" renderers consume. */
export interface WallTile extends WallSlot {
  readonly image: GalleryItem;
}

/** Pointer position normalised to -1..1 from the viewport centre. */
export interface WallPointer {
  readonly x: number;
  readonly y: number;
}

/** Non-reactive progress the hero scene hands to the wall each frame. */
export interface WallProgress {
  /** Entrance bloom, 0 (nothing) to 1 (wall composed). */
  readonly bloom: number;
  /** Scroll exit, 0 (resting) to 1 (end of the exit); every tile is gone a little before 1. */
  readonly scroll: number;
  /** `HERO_ITEMS` index of the tile the rotating prompt describes; `NO_SPOTLIGHT` for none. */
  readonly spotlight: number;
  /** 0 (no spotlight) to 1 (the spotlit tile lifted, every other tile dimmed). */
  readonly spotlightLevel: number;
}

export interface WallInput extends WallProgress {
  readonly pointer: WallPointer;
  /** Seconds, for the ambient drift. Pass 0 for a still wall. */
  readonly time: number;
}

/**
 * Props every hero wall renderer accepts (the DOM `HeroWall` and the WebGL `GlHeroWall`).
 * `getProgress` is read once per frame and is deliberately not reactive.
 */
export interface HeroWallProps {
  tiles: readonly WallTile[];
  getProgress: () => WallProgress;
}

/** Offsets are in tile-size units (1 = one tile width/height), so no measuring is needed. */
export interface TileFrame {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly opacity: number;
  /** 0-1 warm rim on the spotlit tile; renderers draw it their own way. */
  readonly glow: number;
  /** 0-1 brightness multiplier; below 1 while another tile holds the spotlight. */
  readonly brightness: number;
}

interface LayerStyle {
  readonly opacity: number;
  readonly parallax: number;
  readonly drift: number;
  /**
   * Share of the radial exit (see RADIAL_EXIT_SHARE) at which this layer is fully gone. Near tiles pass
   * the camera first and far tiles trail, so the wall thins out rather than vanishing at once.
   */
  readonly exitEnd: number;
  /** Extra scale gained on exit; near tiles grow most, as if passing the camera. */
  readonly grow: number;
  /**
   * Share of the tile's own exit after which it fades. Far tiles fade late, so
   * they read as flying out of frame and carry the hand-over to the next scene.
   * Near tiles grow about threefold and their long straight edges would read as
   * cut lines at the frame edge, so they are mostly gone before they reach it.
   */
  readonly fadeStart: number;
}

const LAYER_STYLES: Readonly<Record<WallLayer, LayerStyle>> = {
  0: { opacity: 0.42, parallax: 0.03, drift: 0.018, exitEnd: 1, grow: 0.3, fadeStart: 0.75 },
  1: { opacity: 0.72, parallax: 0.06, drift: 0.026, exitEnd: 0.88, grow: 0.85, fadeStart: 0.65 },
  2: { opacity: 1, parallax: 0.1, drift: 0.034, exitEnd: 0.75, grow: 1.9, fadeStart: 0.45 },
};

/** Exit travel is measured from this point of each band, so tiles part around the copy. */
const BAND_ORIGINS: Readonly<Record<WallBand, WallPointer>> = {
  full: { x: 0.36, y: 0.5 },
  top: { x: 0.5, y: 1 },
  bottom: { x: 0.5, y: 0 },
};

const BLOOM_STAGGER = 0.05;
const BLOOM_SPAN = 0.32;
const BLOOM_START_SCALE = 0.72;
/** Tiles start this far (in tile sizes) back toward the origin and bloom outward. */
const BLOOM_PULL = 0.35;
const DRIFT_SPEED = 0.35;
const DRIFT_PHASE_STEP = 1.7;
const EXPO_FACTOR = -10;
/**
 * The narrowest band (width / height) a wall is laid out in: a 4:3 desktop. A
 * tile's height is smallest against such a band, so clearing it vertically
 * there clears it at every wider aspect up to 21:9 as well.
 */
const MIN_BAND_ASPECT = 4 / 3;
/** Extra travel (tile sizes) on top of the edge distance, covering drift and pointer parallax. */
const EXIT_SLACK = 0.25;
/**
 * Share of the scroll exit by which the outward-flying (radial) wall is gone,
 * scaling every layer's `exitEnd`. HeroScene's exit lasts about 1.7 viewports
 * and its pin about 0.9, so the far layer finishes near the pin's end. After
 * that the hero rises and its bottom clip edge is on screen, where it would
 * cut flat any tile still flying down through it; the crossing tiles, which
 * never reach that edge, carry the rest of the exit.
 */
export const RADIAL_EXIT_SHARE = 0.55;
/**
 * Share of the scroll exit at which the first crossing tile sets off: about
 * 0.78 viewport into HeroScene's exit (about 1.7 viewports), just past the
 * copy's half-faded point (see COPY_HOLD_SHARE there). The copy is near a
 * quarter opacity by then, so no tile reaches its column while the text is
 * still readable.
 */
const CROSSING_START = 0.45;
/** Gap between crossing tiles' starts, so they sweep across one after another. */
const CROSSING_STAGGER = 0.03;
/** Share of the scroll exit by which every crossing tile is gone; they carry the hand-over. */
const CROSSING_END = 1;
/**
 * Crossing tiles pass beside the camera rather than through it: a near tile
 * growing threefold would bury the whole left half under one image.
 */
const CROSSING_GROW = 0.35;
/** Share of a crossing tile's own path after which it fades, as it nears the left edge. */
const CROSSING_FADE_START = 0.7;

/** `WallProgress.spotlight` when no tile is lit. */
export const NO_SPOTLIGHT = -1;
/** Extra scale on the spotlit tile: a lift, small enough to stay clear of its neighbours. */
const SPOTLIGHT_LIFT = 0.06;
/** Rise of the spotlit tile, in tile heights, so the lift reads as coming forward. */
const SPOTLIGHT_RISE = 0.025;
/** Brightness of every other tile at full spotlight. */
const SPOTLIGHT_DIM = 0.7;

export const STILL_INPUT: WallInput = {
  bloom: 1,
  scroll: 0,
  spotlight: NO_SPOTLIGHT,
  spotlightLevel: 0,
  time: 0,
  pointer: { x: 0, y: 0 },
};

export const HIDDEN_INPUT: WallInput = { ...STILL_INPUT, bloom: 0 };

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const expoOut = (t: number): number => (t >= 1 ? 1 : 1 - 2 ** (EXPO_FACTOR * t));

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** `"3:2"` from gallery.json as its two numbers. */
function parseRatio(ratio: string): readonly [number, number] {
  const [width, height] = ratio.split(':').map(Number);
  if (!width || !height) throw new Error(`Invalid gallery aspectRatio "${ratio}"`);
  return [width, height];
}

function exitDirection(tile: WallSlot): WallPointer {
  const origin = BAND_ORIGINS[tile.band];
  const dx = tile.x - origin.x;
  const dy = tile.y - origin.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return { x: 0, y: -1 };
  return { x: dx / length, y: dy / length };
}

/** Travel along one axis (in tile sizes, along `dir`) until the tile's near edge leaves the band. */
function axisClearance(centre: number, dir: number, size: number, scale: number): number {
  if (dir === 0) return Number.POSITIVE_INFINITY;
  const toEdge = dir > 0 ? 1 - centre : centre;
  return (toEdge / size + scale / 2) / Math.abs(dir);
}

/** Tile height as a fraction of its band's height, against the narrowest band. */
function heightShare(tile: WallTile): number {
  const [ratioWidth, ratioHeight] = parseRatio(tile.image.aspectRatio);
  return (tile.width * MIN_BAND_ASPECT * ratioHeight) / ratioWidth;
}

/** How far (in tile sizes) a tile grown by `grow` must fly along `dir` to sit wholly outside its band. */
function exitDistance(tile: WallTile, dir: WallPointer, grow: number): number {
  const endScale = 1 + grow;
  const across = axisClearance(tile.x, dir.x, tile.width, endScale);
  const down = axisClearance(tile.y, dir.y, heightShare(tile), endScale);
  return Math.min(across, down) + EXIT_SLACK;
}

/** One frame of a tile's exit: where it heads, how far along it is, and what that does to it. */
interface ExitMotion {
  readonly dir: WallPointer;
  /** Distance travelled, in tile sizes. */
  readonly travel: number;
  /** Extra scale gained so far. */
  readonly growth: number;
  /** 0 (fully shown) to 1 (faded out). */
  readonly fade: number;
}

/** The default exit: fly outward from the band origin, eased in, nearer layers first. */
function radialExit(tile: WallTile, scroll: number): ExitMotion {
  const layer = LAYER_STYLES[tile.layer];
  const dir = exitDirection(tile);
  const share = clamp01(scroll / (layer.exitEnd * RADIAL_EXIT_SHARE));
  // Eased in, so tiles leave slowly at first and are fastest as they pass the edge.
  const eased = share * share;
  return {
    dir,
    travel: exitDistance(tile, dir, layer.grow) * eased,
    growth: layer.grow * eased,
    fade: smoothstep(layer.fadeStart, 1, share),
  };
}

/** Unit direction (in tile sizes) from the tile's slot toward a band point. */
function crossingDirection(tile: WallTile, toward: WallPointer): WallPointer {
  const dx = (toward.x - tile.x) / tile.width;
  const dy = (toward.y - tile.y) / heightShare(tile);
  const length = Math.hypot(dx, dy);
  if (length === 0) return { x: -1, y: 0 };
  return { x: dx / length, y: dy / length };
}

/** Hold the slot until `crossing.start`, then sweep at an even pace through the left half and out. */
function crossingExit(tile: WallTile, crossing: WallCrossing, scroll: number): ExitMotion {
  const dir = crossingDirection(tile, crossing.toward);
  // Linear, not eased in: the point is to be seen crossing, not to dart past.
  const share = clamp01((scroll - crossing.start) / (CROSSING_END - crossing.start));
  return {
    dir,
    travel: exitDistance(tile, dir, CROSSING_GROW) * share,
    growth: CROSSING_GROW * share,
    fade: smoothstep(CROSSING_FADE_START, 1, share),
  };
}

/** The tile's own 0-1 share of the global bloom, eased. */
function tileBloom(tile: WallSlot, bloom: number): number {
  const start = tile.order * BLOOM_STAGGER;
  return expoOut(clamp01((bloom - start) / BLOOM_SPAN));
}

/**
 * The spotlight's share for this frame. It is off once the scroll exit starts:
 * the exit's travel maths (`exitDistance`) assumes the resting scale, and a
 * lifted tile would reach the hero's clip edge before it had faded.
 */
export function spotlightShare(input: WallProgress): number {
  return input.scroll > 0 ? 0 : clamp01(input.spotlightLevel);
}

/** Lifts the spotlit tile to full opacity and dims every other tile. */
function withSpotlight(frame: TileFrame, tile: WallTile, input: WallInput): TileFrame {
  const level = spotlightShare(input);
  if (level === 0) return frame;
  if (tile.item !== input.spotlight) {
    return { ...frame, brightness: 1 - (1 - SPOTLIGHT_DIM) * level };
  }
  // Mid-layer tiles rest at 0.72 opacity; the lit one must out-read every dimmed near tile.
  const layerOpacity = LAYER_STYLES[tile.layer].opacity;
  const lifted = layerOpacity + (1 - layerOpacity) * level;
  return {
    ...frame,
    y: frame.y - SPOTLIGHT_RISE * level,
    scale: frame.scale * (1 + SPOTLIGHT_LIFT * level),
    opacity: frame.opacity * (lifted / layerOpacity),
    glow: level,
  };
}

/**
 * Glow from which the lit tile draws above every other tile, so no neighbour
 * cuts its rim. Mid-ramp, so the order swap lands inside the lift and rim
 * change rather than on a still tile. Glow is 0 once the scroll exit starts,
 * so the exit keeps its layer order.
 */
const RAISE_GLOW = 0.5;

export function isRaised(frame: TileFrame): boolean {
  return frame.glow >= RAISE_GLOW;
}

/** Where a tile sits and how it looks for one frame. Pure: same input, same frame. */
export function tileFrame(tile: WallTile, input: WallInput): TileFrame {
  return withSpotlight(placeTile(tile, input), tile, input);
}

/** Bloom, drift, parallax and exit: the tile's frame before any spotlight. */
function placeTile(tile: WallTile, input: WallInput): TileFrame {
  const layer = LAYER_STYLES[tile.layer];
  const exit = tile.crossing
    ? crossingExit(tile, tile.crossing, input.scroll)
    : radialExit(tile, input.scroll);
  // The bloom always opens outward from the origin, whichever way the tile later leaves.
  const bloomDir = exitDirection(tile);
  const bloomed = tileBloom(tile, input.bloom);
  const pull = BLOOM_PULL * (1 - bloomed);
  const phase = tile.order * DRIFT_PHASE_STEP + input.time * DRIFT_SPEED;

  return {
    x:
      exit.dir.x * exit.travel -
      bloomDir.x * pull +
      Math.sin(phase) * layer.drift -
      input.pointer.x * layer.parallax,
    y:
      exit.dir.y * exit.travel -
      bloomDir.y * pull +
      Math.cos(phase * 0.8) * layer.drift -
      input.pointer.y * layer.parallax,
    scale: (BLOOM_START_SCALE + (1 - BLOOM_START_SCALE) * bloomed) * (1 + exit.growth),
    opacity: layer.opacity * bloomed * (1 - exit.fade),
    glow: 0,
    brightness: 1,
  };
}

/** CSS transform for a tile whose top-left is anchored at its slot centre. */
export function frameToTransform(frame: TileFrame): string {
  const x = (frame.x - 0.5) * 100;
  const y = (frame.y - 0.5) * 100;
  return `translate3d(${x.toFixed(2)}%, ${y.toFixed(2)}%, 0) scale(${frame.scale.toFixed(4)})`;
}

/** `"3:2"` from gallery.json to CSS `"3 / 2"`. */
export function toCssAspectRatio(ratio: string): string {
  const [width, height] = parseRatio(ratio);
  return `${width} / ${height}`;
}

/** Index (within HERO_ITEMS) of the prompt that types out and blooms first. */
export const HERO_PROMPT_ITEM = 11;

/**
 * The hero prompt's rotation, as HERO_ITEMS indices, in order. Each is a
 * desktop near or mid tile, and consecutive ones sit in different parts of the
 * wall so the spotlight visibly moves: the bloom image (centre right), the
 * pirate ship (top), the crystal cave (top right), the garden (low right) and
 * the alien planet (top, beside the copy). Every gallery prompt runs 160-190
 * characters; these are as short as the wall allows.
 */
const HERO_PROMPT_CYCLE_ITEMS: readonly number[] = [HERO_PROMPT_ITEM, 12, 16, 13, 0];

/*
 * Desktop: the copy owns the left half (x < 0.5, y 0.2-0.86) and the fixed nav's
 * links own the top right strip, so no tile centres sit there. Near tiles crowd
 * the right half around the prompt's image; far tiles only peek in at the edges.
 * Five tiles cross the copy's half on the way out, each aimed at a different
 * height. The outer ones set off first and the two beside the copy after them,
 * so every tile reaches the copy's column only as the text finishes fading.
 * The low right tile goes last: the unpinned hero rises while it crosses, and
 * sitting low in the box it stays on screen longest. It travels up and left,
 * away from the hero's bottom clip edge, so that edge never cuts it.
 */
const DESKTOP_SLOTS: readonly WallSlot[] = [
  {
    item: HERO_PROMPT_ITEM,
    band: 'full',
    x: 0.7,
    y: 0.53,
    width: 0.235,
    layer: 2,
    order: 0,
    crossing: { toward: { x: 0.22, y: 0.52 }, start: CROSSING_START },
  },
  { item: 16, band: 'full', x: 0.925, y: 0.24, width: 0.14, layer: 2, order: 1 },
  {
    item: 13,
    band: 'full',
    x: 0.905,
    y: 0.86,
    width: 0.18,
    layer: 2,
    order: 2,
    crossing: { toward: { x: 0.3, y: 0.82 }, start: CROSSING_START + 4 * CROSSING_STAGGER },
  },
  {
    item: 0,
    band: 'full',
    x: 0.555,
    y: 0.17,
    width: 0.11,
    layer: 1,
    order: 3,
    crossing: { toward: { x: 0.2, y: 0.28 }, start: CROSSING_START + 3 * CROSSING_STAGGER },
  },
  {
    item: 7,
    band: 'full',
    x: 0.535,
    y: 0.83,
    width: 0.075,
    layer: 1,
    order: 4,
    crossing: { toward: { x: 0.2, y: 0.74 }, start: CROSSING_START + 2 * CROSSING_STAGGER },
  },
  {
    item: 12,
    band: 'full',
    x: 0.78,
    y: 0.15,
    width: 0.12,
    layer: 1,
    order: 5,
    crossing: { toward: { x: 0.3, y: 0.4 }, start: CROSSING_START + CROSSING_STAGGER },
  },
  { item: 4, band: 'full', x: 0.985, y: 0.555, width: 0.085, layer: 1, order: 6 },
  { item: 2, band: 'full', x: 0.2, y: 0.96, width: 0.16, layer: 0, order: 7 },
  { item: 15, band: 'full', x: 0.52, y: 0.5, width: 0.06, layer: 0, order: 8 },
  { item: 19, band: 'full', x: 0.66, y: 0.97, width: 0.06, layer: 0, order: 9 },
  { item: 14, band: 'full', x: 0.4, y: 0.965, width: 0.1, layer: 0, order: 10 },
  { item: 8, band: 'full', x: 0.31, y: 0.99, width: 0.07, layer: 0, order: 11 },
  { item: 5, band: 'full', x: 0.0, y: 0.97, width: 0.1, layer: 0, order: 12 },
  { item: 17, band: 'full', x: 0.79, y: 0.97, width: 0.055, layer: 0, order: 13 },
];

/* Mobile: six tiles in two layers, three above the copy and three below it. */
const MOBILE_SLOTS: readonly WallSlot[] = [
  { item: HERO_PROMPT_ITEM, band: 'top', x: 0.66, y: 0.62, width: 0.42, layer: 2, order: 0 },
  { item: 15, band: 'top', x: 0.2, y: 0.56, width: 0.27, layer: 1, order: 1 },
  { item: 12, band: 'top', x: 0.99, y: 0.42, width: 0.3, layer: 1, order: 2 },
  { item: 13, band: 'bottom', x: 0.32, y: 0.46, width: 0.52, layer: 2, order: 3 },
  { item: 7, band: 'bottom', x: 0.84, y: 0.52, width: 0.24, layer: 1, order: 4 },
  { item: 4, band: 'bottom', x: 0.0, y: 0.2, width: 0.2, layer: 1, order: 5 },
];

function heroItem(index: number): GalleryItem {
  const image = HERO_ITEMS[index];
  if (!image) throw new Error(`Hero wall points past the hero gallery range: ${index}`);
  return image;
}

const resolveSlot = (slot: WallSlot): WallTile => ({ ...slot, image: heroItem(slot.item) });

export const DESKTOP_WALL: readonly WallTile[] = DESKTOP_SLOTS.map(resolveSlot);
export const MOBILE_WALL: readonly WallTile[] = MOBILE_SLOTS.map(resolveSlot);
/** One stop of the prompt rotation: the tile to light and the text that describes it. */
export interface HeroPromptStop {
  readonly item: number;
  readonly prompt: string;
}

export const HERO_PROMPT_CYCLE: readonly HeroPromptStop[] = HERO_PROMPT_CYCLE_ITEMS.map((item) => ({
  item,
  prompt: heroItem(item).prompt,
}));
