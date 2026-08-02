/** Mean chroma below this → treat as monochrome (B&W / grayscale). */
const MONOCHROME_CHROMA_THRESHOLD = 12;

/** Max dimension for sampling canvas (keeps detection cheap). */
const SAMPLE_MAX_EDGE = 128;

/**
 * Client-side B&W heuristic — samples image pixels and checks average chroma.
 * No backend metadata exists for monochrome today.
 */
export async function detectMonochrome(src: string): Promise<boolean> {
  const image = await loadImage(src);
  const { width, height } = fitWithin(image.naturalWidth, image.naturalHeight, SAMPLE_MAX_EDGE);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;

  ctx.drawImage(image, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);

  let chromaSum = 0;
  let samples = 0;
  // Stride through RGBA to keep sampling light.
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const a = data[i + 3] ?? 255;
    if (a < 16) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    chromaSum += max - min;
    samples += 1;
  }

  if (samples === 0) return false;
  return chromaSum / samples < MONOCHROME_CHROMA_THRESHOLD;
}

function fitWithin(width: number, height: number, maxEdge: number) {
  const longest = Math.max(width, height) || 1;
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image for monochrome detection'));
    image.src = src;
  });
}
