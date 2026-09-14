import { describe, expect, it } from 'vitest';

import { FeatureType } from '@/types';
import {
  FEATURE_LANDINGS,
  featureLandingByPath,
  otherFeatureLandings,
} from '@/utils/featureLandings';

describe('featureLandings', () => {
  it('covers every studio feature exactly once', () => {
    const features = FEATURE_LANDINGS.map((item) => item.feature);
    expect(features).toEqual([
      FeatureType.IMAGE,
      FeatureType.UPSCALE,
      FeatureType.COLORIZE,
      FeatureType.REVIVE,
      FeatureType.REMOVE_BG,
    ]);
    expect(new Set(FEATURE_LANDINGS.map((item) => item.path)).size).toBe(FEATURE_LANDINGS.length);
  });

  it('requires SEO and how-to fields on every landing', () => {
    for (const landing of FEATURE_LANDINGS) {
      expect(landing.path.startsWith('/')).toBe(true);
      expect(landing.createPath.startsWith('/')).toBe(true);
      expect(landing.title).toContain('Visual AI');
      expect(landing.h1).toBeTruthy();
      expect(landing.definition.split(/\s+/).length).toBeGreaterThan(20);
      expect(landing.steps.length).toBeGreaterThanOrEqual(3);
      expect(landing.faqs.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('looks up a landing by path', () => {
    expect(featureLandingByPath('/colorize-photo')?.feature).toBe(FeatureType.COLORIZE);
    expect(featureLandingByPath('/missing')).toBeUndefined();
  });

  it('returns the other four landings for related-tool links', () => {
    const others = otherFeatureLandings('/text-to-image');
    expect(others).toHaveLength(4);
    expect(others.every((item) => item.path !== '/text-to-image')).toBe(true);
    expect(otherFeatureLandings('/unknown')).toHaveLength(FEATURE_LANDINGS.length);
  });
});
