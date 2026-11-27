/**
 * The DOM touches the WebGL showcase needs from the /v2 `ShowcaseRows` it sits
 * under: which elements to track, what the tile backing colour is, and what to
 * hide during the handover. The rows themselves stay for layout, focus and labels.
 */
import { CROSSFADE_MS } from '@/components/LandingV3/glHeroDom';

const TRACK_SELECTOR = '.rows__track';
const CELL_SELECTOR = '.rows__cell';
const FIGURE_SELECTOR = '.tile--row';
const MEDIA_SELECTOR = '.tile__media';
const IMG_SELECTOR = '.tile__img';
const CROSSFADE_TRANSITION = `opacity ${CROSSFADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
const RGB_CHANNELS = 3;
const CHANNEL_MAX = 255;

/** One showcase tile: the untransformed cell (layout), the figure (hover lift) and its media. */
export interface ShowcaseTileEls {
  readonly cell: HTMLElement;
  readonly figure: HTMLElement;
  readonly media: HTMLElement;
  readonly img: HTMLImageElement;
}

/** One drifting row: its track moves with the drift and the focus nudge. */
export interface ShowcaseRowEls {
  readonly track: HTMLElement;
  readonly tiles: readonly ShowcaseTileEls[];
}

function required<T extends Element>(parent: ParentNode, selector: string): T {
  const el = parent.querySelector<T>(selector);
  if (!el) throw new Error(`GlShowcaseMedia: ShowcaseRows markup changed, ${selector} not found`);
  return el;
}

function readTile(cell: HTMLElement): ShowcaseTileEls {
  const figure = required<HTMLElement>(cell, FIGURE_SELECTOR);
  return {
    cell,
    figure,
    media: required<HTMLElement>(figure, MEDIA_SELECTOR),
    img: required<HTMLImageElement>(figure, IMG_SELECTOR),
  };
}

/** Reads the desktop rows fresh each session: a mobile round-trip replaces every element. */
export function readShowcaseRows(root: HTMLElement): ShowcaseRowEls[] {
  const tracks = Array.from(root.querySelectorAll<HTMLElement>(TRACK_SELECTOR));
  if (tracks.length === 0) throw new Error(`GlShowcaseMedia: no ${TRACK_SELECTOR} to track`);
  return tracks.map((track) => ({
    track,
    tiles: Array.from(track.querySelectorAll<HTMLElement>(CELL_SELECTOR)).map(readTile),
  }));
}

export const allTiles = (rows: readonly ShowcaseRowEls[]): ShowcaseTileEls[] =>
  rows.flatMap((row) => row.tiles);

/**
 * The tile's own backing colour (0..1 RGB), read before the handover clears it.
 * The /v2 spotlight dims an image over this colour, so GL dims toward it too.
 */
export function readBackingColor(tile: ShowcaseTileEls): readonly [number, number, number] {
  const channels = getComputedStyle(tile.media)
    .backgroundColor.match(/[\d.]+/g)
    ?.map(Number);
  if (!channels || channels.length < RGB_CHANNELS)
    throw new Error('GlShowcaseMedia: could not read the tile backing colour');
  const [r = 0, g = 0, b = 0] = channels.map((value) => value / CHANNEL_MAX);
  return [r, g, b];
}

/** Canvas is created by glStage, so scoped styles cannot reach it. */
export function styleCanvas(canvas: HTMLCanvasElement): void {
  Object.assign(canvas.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
}

/**
 * The canvas paints under the tiles, so the opaque backing goes now and the
 * images fade out over a canvas that already shows the same pixels.
 */
export function handOverToCanvas(rows: readonly ShowcaseRowEls[]): void {
  allTiles(rows).forEach(({ media, img }) => {
    media.style.backgroundColor = 'transparent';
    img.style.transition = CROSSFADE_TRANSITION;
    img.style.opacity = '0';
  });
}

/** Shows the DOM tiles again, at once; safe on rows Vue has already detached. */
export function restoreDomRows(rows: readonly ShowcaseRowEls[]): void {
  allTiles(rows).forEach(({ media, img }) => {
    media.style.removeProperty('background-color');
    img.style.removeProperty('transition');
    img.style.removeProperty('opacity');
  });
}
