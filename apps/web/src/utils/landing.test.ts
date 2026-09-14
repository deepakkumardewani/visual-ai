import { describe, expect, it } from 'vitest';

import { MODELS as CATALOG_MODELS, getFeaturedModels } from '@/utils/models';
import {
  FAQS,
  MODELS,
  NAV_LINKS,
  SHOWCASE,
  STATS,
  TOOLS,
  getLandingStats,
  toolBySeoPath,
} from '@/utils/landing';

describe('landing', () => {
  it('counts still-image models in the stats row', () => {
    const stillCount = CATALOG_MODELS.filter((model) => !model.id.startsWith('UPSCALE_')).length;
    const stats = getLandingStats();

    expect(stats).toHaveLength(3);
    expect(stats[2]).toEqual({ value: String(stillCount), label: 'Still-image models' });
    expect(STATS).toEqual(stats);
  });

  it('showcases the first twelve gallery items', () => {
    expect(SHOWCASE).toHaveLength(12);
    for (const item of SHOWCASE) {
      expect(item.url).toBeTruthy();
      expect(item.aspectRatio).toBeTruthy();
      expect(item.prompt).toBeTruthy();
    }
  });

  it('defines five tool chapters with gallery or compare media', () => {
    expect(TOOLS.map((tool) => tool.id)).toEqual([
      'generate',
      'upscale',
      'colorize',
      'revive',
      'remove-bg',
    ]);

    for (const tool of TOOLS) {
      expect(tool.ctaTo.startsWith('/')).toBe(true);
      expect(tool.points.length).toBeGreaterThan(0);
      expect(['gallery', 'compare']).toContain(tool.media.kind);
    }
  });

  it('resolves a tool by its SEO path', () => {
    expect(toolBySeoPath('/image-upscaler')?.id).toBe('upscale');
    expect(toolBySeoPath('/missing')).toBeUndefined();
  });

  it('re-exports featured still-image models for marketing', () => {
    expect(MODELS).toEqual(getFeaturedModels());
    expect(MODELS.length).toBeGreaterThan(0);
  });

  it('keeps FAQ and nav copy complete', () => {
    expect(FAQS.length).toBeGreaterThanOrEqual(6);
    for (const faq of FAQS) {
      expect(faq.question).toBeTruthy();
      expect(faq.answer).toBeTruthy();
    }
    expect(NAV_LINKS.map((link) => link.href)).toEqual([
      '#tools',
      '#showcase',
      '#models',
      '#pricing',
      '#faq',
    ]);
  });
});
