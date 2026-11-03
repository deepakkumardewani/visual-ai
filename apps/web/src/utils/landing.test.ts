import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { MODELS as CATALOG_MODELS, getFeaturedModels } from '@/utils/models';
import {
  FAQS,
  HERO_IMAGE,
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
  describe('asset references', () => {
    const LANDING_PREFIX = '/landing/';
    const PUBLIC_DIR = resolve(__dirname, '../../public');

    const toolMediaUrls = TOOLS.flatMap((tool) =>
      tool.media.kind === 'gallery' ? tool.media.images : [tool.media.before, tool.media.after],
    );
    const allUrls = [HERO_IMAGE, ...SHOWCASE.map((item) => item.url), ...toolMediaUrls];

    it('collects urls from every exported source', () => {
      expect(toolMediaUrls.length).toBeGreaterThan(0);
      expect(allUrls).toContain(HERO_IMAGE);
    });

    it.each(allUrls)('%s is served from /landing/ and not Cloudinary', (url) => {
      expect(url.startsWith(LANDING_PREFIX)).toBe(true);
      expect(url).not.toContain('res.cloudinary.com');
    });

    it.each([...new Set(allUrls)])('%s exists in public/', (url) => {
      expect(existsSync(resolve(PUBLIC_DIR, url.slice(1)))).toBe(true);
    });
  });
});
