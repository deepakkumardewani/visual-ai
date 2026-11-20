/**
 * The handful of DOM touches the WebGL hero needs from the DOM `HeroWall` it sits
 * in: where to mount (its clip box, under its feather) and what to hide.
 */

/** HeroWall's clipped tile box; a canvas inside it shares the 3px clip guard and sits under the feather. */
const CLIP_BOX_SELECTOR = '.wall__tiles';
/** Bands, not tiles: HeroWall rewrites tile opacity every frame, but never touches bands. */
const DOM_LAYER_SELECTOR = '.wall__band, .wall__img';
/** Above HeroWall's tile layers (z-index 0-2) inside the clip box's stacking context. */
const CANVAS_Z_INDEX = '3';
export const CROSSFADE_MS = 600;
const CROSSFADE_TRANSITION = `opacity ${CROSSFADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;

export function findClipBox(root: HTMLElement): HTMLElement {
  const box = root.querySelector<HTMLElement>(CLIP_BOX_SELECTOR);
  if (!box) throw new Error(`GlHeroWall: HeroWall markup changed, ${CLIP_BOX_SELECTOR} not found`);
  return box;
}

/** Canvas is created by glStage, so scoped styles cannot reach it. */
export function styleCanvas(canvas: HTMLCanvasElement): void {
  Object.assign(canvas.style, {
    position: 'absolute',
    inset: '0',
    zIndex: CANVAS_Z_INDEX,
    pointerEvents: 'none',
    opacity: '0',
    transition: CROSSFADE_TRANSITION,
  });
}

function domLayers(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(DOM_LAYER_SELECTOR));
}

/** Fades the canvas in and the DOM tiles out together. */
export function handOverToCanvas(root: HTMLElement, canvas: HTMLCanvasElement): void {
  domLayers(root).forEach((el) => {
    el.style.transition = CROSSFADE_TRANSITION;
    el.style.opacity = '0';
  });
  canvas.style.opacity = '1';
}

/** Shows the DOM tiles again, at once (revert or a lost context). */
export function restoreDomWall(root: HTMLElement): void {
  domLayers(root).forEach((el) => {
    el.style.removeProperty('transition');
    el.style.removeProperty('opacity');
  });
}
