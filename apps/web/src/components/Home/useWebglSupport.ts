import { createLogger } from '@/utils/logger';

const log = createLogger('Home:webgl');

// Refuse software renderers: a slow fallback context is worse than the DOM media.
const PROBE_ATTRIBUTES: WebGLContextAttributes = { failIfMajorPerformanceCaveat: true };
const LOSE_CONTEXT_EXTENSION = 'WEBGL_lose_context';

let cachedSupport: boolean | null = null;

function getProbeContext(
  canvas: HTMLCanvasElement,
): WebGLRenderingContext | WebGL2RenderingContext | null {
  return (
    canvas.getContext('webgl2', PROBE_ATTRIBUTES) ?? canvas.getContext('webgl', PROBE_ATTRIBUTES)
  );
}

function probeWebgl(): boolean {
  // Prerender and tests have no real canvas; treat them as unsupported.
  if (typeof document === 'undefined') return false;
  try {
    const context = getProbeContext(document.createElement('canvas'));
    if (!context) return false;
    // Release the probe at once so it does not count against the browser's context limit.
    context.getExtension(LOSE_CONTEXT_EXTENSION)?.loseContext();
    return true;
  } catch (error) {
    log.warn('WebGL probe threw; falling back to DOM media', error);
    return false;
  }
}

/**
 * Whether this browser can create a hardware-backed WebGL context.
 * Probed once per page load; later calls reuse the answer.
 */
export function useWebglSupport(): boolean {
  cachedSupport ??= probeWebgl();
  return cachedSupport;
}
