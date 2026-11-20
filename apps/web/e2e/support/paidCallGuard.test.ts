import { describe, expect, it } from 'vitest';

import { isPaidCall } from './paidCallGuard';

describe('isPaidCall', () => {
  it.each([
    'https://api.test/generate/image',
    'https://api.test/generate/image?x=1',
    'https://api.test/generate/upscale/image',
    'https://api.test/generate/remove-bg/image/',
    'https://api.test/generate/video',
  ])('flags POST %s', (url) => {
    expect(isPaidCall('POST', url)).toBe(true);
    expect(isPaidCall('post', url)).toBe(true);
  });

  it('ignores non-POST methods, the reference upload, and unrelated or malformed URLs', () => {
    expect(isPaidCall('GET', 'https://api.test/generate/image')).toBe(false);
    expect(isPaidCall('OPTIONS', 'https://api.test/generate/image')).toBe(false);
    expect(isPaidCall('POST', 'https://api.test/generate/reference-images')).toBe(false);
    expect(isPaidCall('POST', 'https://api.test/images/generate/image/download')).toBe(false);
    expect(isPaidCall('POST', 'not a url')).toBe(false);
  });
});
