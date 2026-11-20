/** Max bytes per reference / upload image (client + API). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ACCEPTED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** Value for `<input accept>` and drag/drop hints. */
export const ACCEPTED_IMAGE_ACCEPT = ACCEPTED_IMAGE_MIME_TYPES.join(',');

/** Largest reference count any catalog model accepts today (Flux 2 Pro). */
export const MAX_REFERENCE_IMAGE_COUNT = 8;

export function isAcceptedImageMime(mime: string): boolean {
  return (ACCEPTED_IMAGE_MIME_TYPES as readonly string[]).includes(mime);
}
