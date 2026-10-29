import { describe, expect, it } from 'vitest';

import { INTRO_SLIDES } from './slides';

const EXPECTED_IDS = [
  'models',
  'styles',
  'sizes',
  'dashboard',
  'voice',
  'prompts',
  'explore',
  'tools',
  'reference',
];

describe('INTRO_SLIDES', () => {
  it('has exactly 10 slides with the spec order for the first nine ids', () => {
    expect(INTRO_SLIDES).toHaveLength(10);
    expect(INTRO_SLIDES.slice(0, 9).map((s) => s.id)).toEqual(EXPECTED_IDS);
  });

  it('has unique ids', () => {
    expect(new Set(INTRO_SLIDES.map((s) => s.id)).size).toBe(10);
  });

  it.each(INTRO_SLIDES.map((s, i) => [i + 1, s] as const))(
    'slide %i carries full media metadata',
    (position, s) => {
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(0);
      expect(s.alt.length).toBeGreaterThan(0);
      expect(s.sources).toEqual([
        { src: `/intro/slide-${position}.webm`, type: 'video/webm' },
        { src: `/intro/slide-${position}.mp4`, type: 'video/mp4' },
      ]);
      expect(s.poster).toBe(`/intro/slide-${position}.webp`);
      expect(s.width).toBe(960);
      expect(s.height).toBe(600);
    },
  );
});
