import { describe, expect, it } from 'vitest';

import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_ORIGIN,
  breadcrumbJsonLd,
  canonicalUrl,
  faqPageJsonLd,
  itemListJsonLd,
  organizationJsonLd,
  webApplicationJsonLd,
} from '@/utils/seo';

describe('canonicalUrl', () => {
  it('returns the site origin for empty and root paths', () => {
    expect(canonicalUrl('')).toBe(SITE_ORIGIN);
    expect(canonicalUrl('/')).toBe(SITE_ORIGIN);
  });

  it('prefixes a leading slash when missing', () => {
    expect(canonicalUrl('pricing')).toBe(`${SITE_ORIGIN}/pricing`);
    expect(canonicalUrl('/pricing')).toBe(`${SITE_ORIGIN}/pricing`);
  });
});

describe('json-ld helpers', () => {
  it('describes the organization and default OG image', () => {
    expect(organizationJsonLd()).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_ORIGIN,
      logo: DEFAULT_OG_IMAGE,
    });
    expect(DEFAULT_OG_IMAGE).toBe(`${SITE_ORIGIN}/og-image.png`);
  });

  it('describes the web application', () => {
    const json = webApplicationJsonLd();
    expect(json['@type']).toBe('WebApplication');
    expect(json.applicationCategory).toBe('MultimediaApplication');
    expect(json.creator).toEqual({
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_ORIGIN,
    });
  });

  it('strips HTML from FAQ answers', () => {
    const json = faqPageJsonLd([{ question: 'Free?', answer: 'Yes. <b>50</b>  credits' }]);

    expect(json.mainEntity).toEqual([
      {
        '@type': 'Question',
        name: 'Free?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes. 50 credits' },
      },
    ]);
  });

  it('builds breadcrumbs with canonical item urls', () => {
    const json = breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Pricing', path: 'pricing' },
    ]);

    expect(json.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
      { '@type': 'ListItem', position: 2, name: 'Pricing', item: `${SITE_ORIGIN}/pricing` },
    ]);
  });

  it('omits optional item-list fields when they are absent', () => {
    expect(itemListJsonLd({ name: 'Tools', items: [{ name: 'Upscale' }] })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Tools',
      itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Upscale' }],
    });
  });

  it('includes description and item urls when provided', () => {
    const json = itemListJsonLd({
      name: 'Tools',
      description: 'Studio tools',
      items: [{ name: 'Upscale', path: '/image-upscaler', description: '4K' }],
    });

    expect(json.description).toBe('Studio tools');
    expect(json.itemListElement[0]).toEqual({
      '@type': 'ListItem',
      position: 1,
      name: 'Upscale',
      description: '4K',
      url: `${SITE_ORIGIN}/image-upscaler`,
    });
  });
});
