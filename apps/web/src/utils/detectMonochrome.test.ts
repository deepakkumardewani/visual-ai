import { afterEach, describe, expect, it, vi } from 'vitest';

import { detectMonochrome } from '@/utils/detectMonochrome';

type FakeImage = {
  crossOrigin: string;
  naturalWidth: number;
  naturalHeight: number;
  onload: (() => void) | null;
  onerror: (() => void) | null;
  src: string;
};

function stubImage(options: { fail?: boolean; width?: number; height?: number } = {}) {
  vi.stubGlobal(
    'Image',
    class {
      crossOrigin = '';
      naturalWidth = options.width ?? 16;
      naturalHeight = options.height ?? 16;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => {
          if (options.fail) this.onerror?.();
          else this.onload?.();
        });
      }
    } as unknown as typeof Image,
  );
}

function stubCanvas(pixels: number[]) {
  const data = Uint8ClampedArray.from(pixels);
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    if (tag === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: () => ({
          drawImage: vi.fn(),
          getImageData: () => ({ data }),
        }),
      } as unknown as HTMLCanvasElement;
    }
    return document.createElement(tag);
  });
}

describe('detectMonochrome', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns true when sampled chroma is below the threshold', async () => {
    stubImage();
    stubCanvas([120, 120, 120, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    await expect(detectMonochrome('https://cdn.example/bw.jpg')).resolves.toBe(true);
  });

  it('returns false when sampled pixels are colorful', async () => {
    stubImage();
    stubCanvas([255, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    await expect(detectMonochrome('https://cdn.example/red.jpg')).resolves.toBe(false);
  });

  it('skips nearly transparent samples and returns false when none remain', async () => {
    stubImage();
    stubCanvas([255, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    await expect(detectMonochrome('https://cdn.example/clear.png')).resolves.toBe(false);
  });

  it('returns false when a 2d context is unavailable', async () => {
    stubImage();
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => null,
        } as unknown as HTMLCanvasElement;
      }
      return document.createElement(tag);
    });

    await expect(detectMonochrome('https://cdn.example/x.jpg')).resolves.toBe(false);
  });

  it('downsamples large images to a 128px edge before reading pixels', async () => {
    stubImage({ width: 256, height: 128 });
    let canvas: { width: number; height: number } | undefined;
    const data = Uint8ClampedArray.from([10, 10, 10, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') {
        canvas = { width: 0, height: 0 };
        return {
          get width() {
            return canvas!.width;
          },
          set width(value: number) {
            canvas!.width = value;
          },
          get height() {
            return canvas!.height;
          },
          set height(value: number) {
            canvas!.height = value;
          },
          getContext: () => ({
            drawImage: vi.fn(),
            getImageData: () => ({ data }),
          }),
        } as unknown as HTMLCanvasElement;
      }
      return document.createElement(tag);
    });

    await detectMonochrome('https://cdn.example/wide.jpg');
    expect(canvas).toEqual({ width: 128, height: 64 });
  });

  it('rejects when the image fails to load', async () => {
    stubImage({ fail: true });
    await expect(detectMonochrome('https://cdn.example/missing.jpg')).rejects.toThrow(
      'Failed to load image for monochrome detection',
    );
  });

  it('marks loaded images as anonymous for canvas sampling', async () => {
    let instance: FakeImage | undefined;
    vi.stubGlobal(
      'Image',
      class {
        crossOrigin = '';
        naturalWidth = 8;
        naturalHeight = 8;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor() {
          instance = this as unknown as FakeImage;
        }
        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      } as unknown as typeof Image,
    );
    stubCanvas([0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    await detectMonochrome('https://cdn.example/x.jpg');
    expect(instance?.crossOrigin).toBe('anonymous');
  });
});
