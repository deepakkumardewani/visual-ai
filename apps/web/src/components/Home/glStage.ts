import type { OGLRenderingContext, Renderer } from 'ogl';

import { createLogger } from '@/utils/logger';

const log = createLogger('Home:glStage');

// Above 2x the extra pixels cost fill rate without a visible gain.
const MAX_DEVICE_PIXEL_RATIO = 2;
const CONTEXT_LOST_EVENT = 'webglcontextlost';
const LOSE_CONTEXT_EXTENSION = 'WEBGL_lose_context';

export type OglModule = typeof import('ogl');

export interface GlStageSize {
  readonly width: number;
  readonly height: number;
}

export type GlStageResizeListener = (size: GlStageSize) => void;

export interface GlStageOptions {
  /** Element the canvas is appended to; its content box drives the canvas size. */
  readonly container: HTMLElement;
  /** Called once after the context is lost and the stage has disposed itself. */
  readonly onContextLost: () => void;
  /** Aborting before setup resolves makes `createGlStage` clean up and return null. */
  readonly signal?: AbortSignal;
}

export interface GlStage {
  readonly ogl: OglModule;
  readonly renderer: Renderer;
  readonly gl: OGLRenderingContext;
  readonly canvas: HTMLCanvasElement;
  getSize: () => GlStageSize;
  /** Registers a listener for container resizes; returns an unsubscribe function. */
  onResize: (listener: GlStageResizeListener) => () => void;
  /** Idempotent: stops observing, frees the context and removes the canvas. */
  dispose: () => void;
}

interface StageInternals {
  readonly ogl: OglModule;
  readonly renderer: Renderer;
  readonly options: GlStageOptions;
}

async function loadOgl(): Promise<OglModule | null> {
  try {
    // The only `ogl` import in the app, so the library ships in its own lazy chunk.
    return await import('ogl');
  } catch (error) {
    log.error('Failed to load ogl; keeping DOM media', error);
    return null;
  }
}

function createRenderer(ogl: OglModule): Renderer | null {
  try {
    return new ogl.Renderer({
      dpr: Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO),
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });
  } catch (error) {
    // ogl throws a TypeError after failing getContext (it dereferences a null gl).
    log.warn('ogl could not create a WebGL context; keeping DOM media', error);
    return null;
  }
}

function readSize(container: HTMLElement): GlStageSize {
  return { width: container.clientWidth, height: container.clientHeight };
}

function releaseContext(gl: OGLRenderingContext): void {
  // Free the GPU context now instead of waiting for GC, to stay under the per-page limit.
  gl.getExtension(LOSE_CONTEXT_EXTENSION)?.loseContext();
}

function buildStage({ ogl, renderer, options }: StageInternals): GlStage {
  const { gl } = renderer;
  const { canvas } = gl;
  const listeners = new Set<GlStageResizeListener>();
  let size = readSize(options.container);
  let disposed = false;

  const applySize = (): void => {
    size = readSize(options.container);
    renderer.setSize(size.width, size.height);
    listeners.forEach((listener) => listener(size));
  };
  const observer = new ResizeObserver(applySize);

  const teardown = (freeContext: boolean): void => {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    canvas.removeEventListener(CONTEXT_LOST_EVENT, handleContextLost);
    listeners.clear();
    if (freeContext) releaseContext(gl);
    canvas.remove();
  };

  function handleContextLost(event: Event): void {
    // No restore path: the caller shows the DOM media again instead.
    event.preventDefault();
    log.warn('WebGL context lost; disposing stage');
    teardown(false);
    options.onContextLost();
  }

  canvas.addEventListener(CONTEXT_LOST_EVENT, handleContextLost);
  options.container.appendChild(canvas);
  applySize();
  observer.observe(options.container);

  return {
    ogl,
    renderer,
    gl,
    canvas,
    getSize: () => size,
    onResize: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose: () => teardown(true),
  };
}

/**
 * Lazily loads `ogl` and mounts a DPR-capped, self-resizing canvas in `container`.
 * Returns null when `ogl` fails to load, no context can be created, or `signal`
 * aborts while loading; in every null case nothing is left mounted.
 */
export async function createGlStage(options: GlStageOptions): Promise<GlStage | null> {
  const ogl = await loadOgl();
  if (!ogl || options.signal?.aborted) return null;

  const renderer = createRenderer(ogl);
  if (!renderer) return null;
  return buildStage({ ogl, renderer, options });
}
