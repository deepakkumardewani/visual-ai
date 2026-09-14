import { describe, expect, it } from 'vitest';

import { UPSCALER_SHOWCASE, getShowcaseEntry } from '@/utils/upscalerShowcase';

describe('upscalerShowcase', () => {
  it('maps five upscaler models to source and result assets', () => {
    expect(UPSCALER_SHOWCASE).toHaveLength(5);

    const keys = UPSCALER_SHOWCASE.map((entry) => entry.modelKey);
    expect(keys).toEqual([
      'UPSCALE_REAL_ESRGAN',
      'UPSCALE_PRUNA',
      'UPSCALE_RECRAFT',
      'UPSCALE_CLARITY_PRO',
      'UPSCALE_TOPAZ',
    ]);

    for (const entry of UPSCALER_SHOWCASE) {
      expect(entry.source).toMatch(/^\/showcase\/upscalers\/source\//);
      expect(entry.upscaled).toMatch(/^\/showcase\/upscalers\/upscaled\//);
    }
  });

  it('finds an entry by model key', () => {
    expect(getShowcaseEntry('UPSCALE_TOPAZ')?.source).toContain('topaz-source');
  });

  it('returns undefined for an unknown model key', () => {
    expect(getShowcaseEntry('UPSCALE_MISSING')).toBeUndefined();
    expect(getShowcaseEntry('')).toBeUndefined();
  });
});
