/**
 * Runtime pieces every home WebGL layer shares: decoding texture images and a
 * frame loop that only runs while its element is on screen. Imported only by
 * the GL sessions, so pages without WebGL never load it.
 */

/** Decodes `url` off the main thread; rejects with the owner named for the logs. */
export function loadImage(url: string, owner: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  return image.decode().then(
    () => image,
    (error: Error) => {
      throw new Error(`${owner}: could not decode ${url}`, { cause: error });
    },
  );
}

export interface VisibleLoopOptions {
  /** The loop pauses while this element is fully off screen. */
  readonly target: HTMLElement;
  /** Draws one frame; `now` is the rAF timestamp in ms. */
  readonly frame: (now: number) => void;
  /** A frame that throws stops the loop and reports here once. */
  readonly onError: (error: Error) => void;
}

const toError = (value: unknown): Error =>
  value instanceof Error ? value : new Error(String(value));

/** Runs `frame` on rAF while `target` intersects the viewport; returns a stop function. */
export function runVisibleLoop({ target, frame, onError }: VisibleLoopOptions): () => void {
  let frameId = 0;

  const tick = (now: number): void => {
    try {
      frame(now);
      frameId = requestAnimationFrame(tick);
    } catch (error) {
      onError(toError(error));
    }
  };
  const pause = (): void => cancelAnimationFrame(frameId);
  const observer = new IntersectionObserver(([entry]) => {
    pause();
    if (entry?.isIntersecting) frameId = requestAnimationFrame(tick);
  });
  observer.observe(target);

  return () => {
    observer.disconnect();
    pause();
  };
}
