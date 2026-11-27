/**
 * One run of the WebGL showcase: wait until the scene is near, load textures,
 * mount the stage under the DOM rows, hand over, loop while on screen, and undo
 * all of it. Every failure path leaves the DOM rows showing.
 */
import { createLogger } from '@/utils/logger';

import { loadImage, runVisibleLoop } from '@/components/Home/glRuntime';
import {
  allTiles,
  handOverToCanvas,
  readBackingColor,
  readShowcaseRows,
  restoreDomRows,
  styleCanvas,
  type ShowcaseRowEls,
} from '@/components/Home/glShowcaseDom';
import {
  clampFrameMs,
  measureRow,
  trackScrollEnergy,
  trackTileLooks,
  type TileBox,
  type TileLook,
} from '@/components/Home/glShowcaseMotion';
import {
  createShowcaseScene,
  type PrintQuad,
  type ShowcaseScene,
} from '@/components/Home/glShowcaseScene';
import { createGlStage, type GlStage } from '@/components/Home/glStage';

const LOG_OWNER = 'GlShowcaseMedia';
const log = createLogger(`Home:${LOG_OWNER}`);

/** Textures start loading about a screen before the scene arrives, never at page load. */
const NEAR_ROOT_MARGIN = '100% 0px';
const MS_PER_SECOND = 1000;

export interface ShowcaseSessionOptions {
  /** GlShowcaseMedia's root; it holds the DOM rows. */
  readonly root: HTMLElement;
  /** Box under the rows that the canvas fills. */
  readonly host: HTMLElement;
}

interface Running {
  readonly stage: GlStage;
  readonly scene: ShowcaseScene;
  readonly rows: readonly ShowcaseRowEls[];
  readonly root: HTMLElement;
  readonly onError: (error: Error) => void;
}

/** Resolves once `el` is within NEAR_ROOT_MARGIN of the viewport, or when `signal` aborts. */
function whenNear(el: HTMLElement, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        resolve();
      },
      { rootMargin: NEAR_ROOT_MARGIN },
    );
    observer.observe(el);
    signal.addEventListener('abort', () => {
      observer.disconnect();
      resolve();
    });
  });
}

/** Quads from each track's live rect (drift and focus nudge) plus the boxes measured on refresh. */
function placeQuads(
  rows: readonly ShowcaseRowEls[],
  frame: { canvas: HTMLCanvasElement; boxes: readonly TileBox[][]; looks: readonly TileLook[] },
): PrintQuad[] {
  const origin = frame.canvas.getBoundingClientRect();
  let flatIndex = 0;
  return rows.flatMap((row, rowIndex) => {
    const track = row.track.getBoundingClientRect();
    return (frame.boxes[rowIndex] ?? []).map((box) => {
      const look = frame.looks[flatIndex++] ?? { lift: 0, zoom: 1, dim: 1 };
      return {
        centerX: track.left - origin.left + box.x + box.width / 2,
        centerY: track.top - origin.top + box.y + box.height / 2 + look.lift,
        width: box.width,
        height: box.height,
        zoom: look.zoom,
        dim: look.dim,
      };
    });
  });
}

/** Sizes are measured on refresh (stage or track resize), never per frame. */
function watchBoxes(running: Running): { read: () => TileBox[][]; stop: () => void } {
  let boxes = running.rows.map(measureRow);
  const refresh = (): void => {
    boxes = running.rows.map(measureRow);
  };
  const observer = new ResizeObserver(refresh);
  running.rows.forEach((row) => observer.observe(row.track));
  const unsubscribe = running.stage.onResize(refresh);
  return {
    read: () => boxes,
    stop: () => {
      observer.disconnect();
      unsubscribe();
    },
  };
}

/** First frame drawn under the still-visible images, then they fade; the loop takes over. */
function goLive(running: Running): () => void {
  const { stage, scene, rows, root, onError } = running;
  const boxes = watchBoxes(running);
  const stepLooks = trackTileLooks(allTiles(rows));
  const stepEnergy = trackScrollEnergy();
  let last = performance.now();

  const frame = (now: number): void => {
    const frameMs = clampFrameMs(now - last);
    last = now;
    const looks = stepLooks(frameMs);
    const quads = placeQuads(rows, { canvas: stage.canvas, boxes: boxes.read(), looks });
    scene.render({ quads, ...stepEnergy(frameMs), time: now / MS_PER_SECOND });
  };

  styleCanvas(stage.canvas);
  frame(last);
  handOverToCanvas(rows);
  const stopLoop = runVisibleLoop({ target: root, frame, onError });
  return () => {
    stopLoop();
    boxes.stop();
  };
}

/**
 * Starts the WebGL showcase and returns a synchronous stop. Stopping at any
 * point, even mid-load, cancels the rest and restores the DOM rows.
 */
export function startShowcaseSession(options: ShowcaseSessionOptions): () => void {
  const abort = new AbortController();
  let rows: readonly ShowcaseRowEls[] = [];
  let stage: GlStage | null = null;
  let scene: ShowcaseScene | null = null;
  let stopLive: (() => void) | null = null;

  const showDom = (): void => {
    stopLive?.();
    stopLive = null;
    restoreDomRows(rows);
  };
  const teardown = (): void => {
    showDom();
    scene?.dispose();
    stage?.dispose();
    scene = null;
    stage = null;
  };
  const fail = (error: Error): void => {
    log.error('WebGL showcase failed; showing the DOM rows', error);
    teardown();
  };

  const mount = async (): Promise<void> => {
    await whenNear(options.root, abort.signal);
    if (abort.signal.aborted) return;
    // Read after the wait: a mobile round-trip re-renders the rows with new elements.
    rows = readShowcaseRows(options.root);
    const tiles = allTiles(rows);
    const [first] = tiles;
    if (!first) throw new Error('GlShowcaseMedia: the rows have no tiles');
    const backing = readBackingColor(first);
    const images = await Promise.all(tiles.map(({ img }) => loadImage(img.src, LOG_OWNER)));
    if (abort.signal.aborted) return;
    stage = await createGlStage({
      container: options.host,
      signal: abort.signal,
      onContextLost: showDom,
    });
    if (!stage || abort.signal.aborted) return teardown();
    scene = createShowcaseScene(stage, { images, backing });
    stopLive = goLive({ stage, scene, rows, root: options.root, onError: fail });
  };

  mount().catch(fail);

  return () => {
    abort.abort();
    teardown();
  };
}
