const CLOUDINARY_HOST = 'res.cloudinary.com';
const IMAGE_UPLOAD_SEGMENT = '/image/upload/';
const THUMB_TRANSFORM = 'q_auto,f_auto,w_400,c_limit';

/**
 * Adds a 400px-wide optimized transformation to a Cloudinary image URL for grid thumbnails.
 * Non-Cloudinary, video, malformed, empty and already-thumbnailed URLs are returned unchanged.
 */
export function thumbUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (!url.includes(CLOUDINARY_HOST) || url.includes(THUMB_TRANSFORM)) return url;

  const markerIndex = url.indexOf(IMAGE_UPLOAD_SEGMENT);
  if (markerIndex === -1) return url;

  const insertAt = markerIndex + IMAGE_UPLOAD_SEGMENT.length;
  return `${url.slice(0, insertAt)}${THUMB_TRANSFORM}/${url.slice(insertAt)}`;
}
