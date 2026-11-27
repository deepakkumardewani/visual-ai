/**
 * One run of the WebGL hero: load textures, mount the stage, hand over from the
 * DOM wall, loop while on screen, and undo all of it. Every failure path leaves
 * the DOM wall showing.
 */
import type { WallProgress, WallTile } from '@/components/Home/heroWallLayout';
import { createLogger } from '@/utils/logger';

import {
  CROSSFADE_MS,
  findClipBox,
  handOverToCanvas,
  restoreDomWall,
  styleCanvas,
} from '@/components/Home/glHeroDom';
import { trackHeroPointer, type HeroPointer } from '@/components/Home/glHeroPointer';
import { createHeroScene, type HeroScene, type RgbColor } from '@/components/Home/glHeroScene';
import { loadImage, runVisibleLoop } from '@/components/Home/glRuntime';
import { createGlStage, type GlStage } from '@/components/Home/glStage';

const LOG_OWNER = 'GlHeroWall';
const log = createLogger(`Home:${LOG_OWNER}`);

/** Shader effects ease in after the crossfade, so the handover itself shows the plain DOM look. */
const EFFECT_RAMP_MS = 900;
const MS_PER_SECOND = 1000;
/** The DOM rim's colour token (space-separated 0-255 channels), so both walls share one copper. */
const ACCENT_TOKEN = '--tw-accent';
const CHANNEL_MAX = 255;
const RGB_CHANNELS = 3;

export interface HeroSessionOptions {
  /** GlHeroWall's root; it holds the DOM HeroWall. */
  readonly root: HTMLElement;
  /** Read after every await: Vue may swap in the desktop tiles while textures load. */
  readonly getTiles: () => readonly WallTile[];
  readonly getProgress: () => WallProgress;
}

interface Running {
  readonly stage: GlStage;
  readonly scene: HeroScene;
  readonly options: HeroSessionOptions;
  /** Started with the session, so moves made while textures load are not missed. */
  readonly pointer: HeroPointer;
  /** A frame that throws stops the loop and hands back to the DOM wall. */
  readonly onError: (error: Error) => void;
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** The accent token as 0..1 RGB; throws (so the DOM wall stays) if the token is missing. */
function readAccentColor(root: HTMLElement): RgbColor {
  const raw = getComputedStyle(root).getPropertyValue(ACCENT_TOKEN).trim();
  const channels = raw.split(/\s+/).map(Number);
  if (channels.length !== RGB_CHANNELS || channels.some((value) => !Number.isFinite(value))) {
    throw new Error(`${LOG_OWNER}: ${ACCENT_TOKEN} is not three channels: "${raw}"`);
  }
  const [r = 0, g = 0, b = 0] = channels.map((value) => value / CHANNEL_MAX);
  return [r, g, b];
}

/** Frame loop, paused while offscreen; returns a stop function. */
function runLoop({ stage, scene, options, pointer, onError }: Running): () => void {
  const handOverAt = performance.now();

  const frame = (now: number): void => {
    const sample = pointer.step();
    const rect = stage.canvas.getBoundingClientRect();
    scene.render({
      progress: options.getProgress(),
      pointer: sample.parallax,
      lightAt: { x: sample.client.x - rect.left, y: sample.client.y - rect.top },
      lightLevel: sample.level,
      cursorMoving: sample.moving,
      time: now / MS_PER_SECOND,
      effect: clamp01((now - handOverAt - CROSSFADE_MS) / EFFECT_RAMP_MS),
    });
  };
  return runVisibleLoop({ target: options.root, frame, onError });
}

/** First frame drawn, then the crossfade; the loop takes over from there. */
function goLive(running: Running): () => void {
  const { stage, scene, options, pointer } = running;
  styleCanvas(stage.canvas);
  // The DOM wall has been easing toward the cursor all along; start the GL tiles there too.
  const sample = pointer.settle();
  scene.render({
    progress: options.getProgress(),
    pointer: sample.parallax,
    lightAt: { x: 0, y: 0 },
    lightLevel: 0,
    cursorMoving: false,
    time: performance.now() / MS_PER_SECOND,
    effect: 0,
  });
  handOverToCanvas(options.root, stage.canvas);
  return runLoop(running);
}

/**
 * Starts the WebGL hero and returns a synchronous stop. Stopping at any point,
 * even mid-load, cancels the rest and restores the DOM wall.
 */
export function startHeroSession(options: HeroSessionOptions): () => void {
  const abort = new AbortController();
  const pointer = trackHeroPointer();
  let stage: GlStage | null = null;
  let scene: HeroScene | null = null;
  let stopLive: (() => void) | null = null;

  const showDom = (): void => {
    stopLive?.();
    stopLive = null;
    restoreDomWall(options.root);
  };
  const teardown = (): void => {
    showDom();
    scene?.dispose();
    stage?.dispose();
    scene = null;
    stage = null;
  };
  const fail = (error: Error): void => {
    log.error('WebGL hero failed; showing the DOM wall', error);
    teardown();
  };

  const mount = async (): Promise<void> => {
    const tiles = options.getTiles();
    const images = await Promise.all(tiles.map((tile) => loadImage(tile.image.url, LOG_OWNER)));
    // A newer tile set means GlHeroWall is already starting a fresh session for it.
    if (abort.signal.aborted || tiles !== options.getTiles()) return;
    stage = await createGlStage({
      container: findClipBox(options.root),
      signal: abort.signal,
      onContextLost: showDom,
    });
    if (!stage || abort.signal.aborted) return teardown();
    scene = createHeroScene(stage, { tiles, images, rimColor: readAccentColor(options.root) });
    stopLive = goLive({ stage, scene, options, pointer, onError: fail });
  };

  mount().catch(fail);

  return () => {
    abort.abort();
    pointer.stop();
    teardown();
  };
}
