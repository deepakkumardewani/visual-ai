import { describe, expect, it } from 'vitest';

import { INTRO_SLIDES } from './slides';

/** Media file numbers are fixed per feature, independent of display order. */
const MEDIA_ID_BY_SLIDE: Record<string, number> = {
  models: 1,
  styles: 2,
  sizes: 3,
  dashboard: 4,
  voice: 5,
  prompts: 6,
  explore: 7,
  tools: 8,
  reference: 9,
  'remove-background': 10,
};

const EXPECTED_IDS = [
  'dashboard',
  'models',
  'styles',
  'sizes',
  'voice',
  'prompts',
  'explore',
  'tools',
  'reference',
];

describe('INTRO_SLIDES', () => {
  it('has exactly 10 slides with the dashboard-first order for the first nine ids', () => {
    expect(INTRO_SLIDES).toHaveLength(10);
    expect(INTRO_SLIDES.slice(0, 9).map((s) => s.id)).toEqual(EXPECTED_IDS);
  });

  it('has unique ids', () => {
    expect(new Set(INTRO_SLIDES.map((s) => s.id)).size).toBe(10);
  });

  it.each(INTRO_SLIDES.map((s, i) => [i + 1, s] as const))(
    'slide %i carries full media metadata',
    (_position, s) => {
      const mediaId = MEDIA_ID_BY_SLIDE[s.id];
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(0);
      expect(s.alt.length).toBeGreaterThan(0);
      expect(s.sources).toEqual([
        { src: `/intro/slide-${mediaId}.webm`, type: 'video/webm' },
        { src: `/intro/slide-${mediaId}.mp4`, type: 'video/mp4' },
      ]);
      expect(s.poster).toBe(`/intro/slide-${mediaId}.webp`);
      expect(s.width).toBe(960);
      expect(s.height).toBe(600);
    },
  );
});
