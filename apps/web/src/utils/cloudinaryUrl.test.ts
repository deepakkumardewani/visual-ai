import { describe, expect, it } from 'vitest';
import { thumbUrl } from '@/utils/cloudinaryUrl';

describe('thumbUrl', () => {
  it('inserts the thumbnail transform after /image/upload/', () => {
    expect(thumbUrl('https://res.cloudinary.com/demo/image/upload/v123/folder/pic.png')).toBe(
      'https://res.cloudinary.com/demo/image/upload/q_auto,f_auto,w_400,c_limit/v123/folder/pic.png',
    );
  });

  it('preserves existing transformations that come after the marker', () => {
    expect(thumbUrl('https://res.cloudinary.com/demo/image/upload/e_blur/pic.png')).toBe(
      'https://res.cloudinary.com/demo/image/upload/q_auto,f_auto,w_400,c_limit/e_blur/pic.png',
    );
  });

  it('is idempotent for already-thumbnailed URLs', () => {
    const once = thumbUrl('https://res.cloudinary.com/demo/image/upload/v1/pic.png');
    expect(thumbUrl(once)).toBe(once);
  });

  it('returns non-Cloudinary URLs unchanged', () => {
    const url = 'https://example.com/image/upload/pic.png';
    expect(thumbUrl(url)).toBe(url);
  });

  it('returns Cloudinary video URLs unchanged', () => {
    const url = 'https://res.cloudinary.com/demo/video/upload/v1/clip.mp4';
    expect(thumbUrl(url)).toBe(url);
  });

  it('returns malformed Cloudinary URLs without an upload segment unchanged', () => {
    const url = 'https://res.cloudinary.com/demo/pic.png';
    expect(thumbUrl(url)).toBe(url);
  });

  it.each([
    ['empty string', ''],
    ['null', null],
    ['undefined', undefined],
  ])('returns an empty string for %s', (_label, input) => {
    expect(thumbUrl(input)).toBe('');
  });
});
