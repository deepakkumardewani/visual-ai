import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const useSeoMeta = vi.hoisted(() => vi.fn());
const useHead = vi.hoisted(() => vi.fn());

vi.mock('@unhead/vue', () => ({
  useSeoMeta,
  useHead,
}));

import { usePageSeo } from '@/composables/usePageSeo';
import { canonicalUrl, DEFAULT_OG_IMAGE, SITE_NAME } from '@/utils/seo';

function mountSeo(options: Parameters<typeof usePageSeo>[0]) {
  return mount({
    setup() {
      usePageSeo(options);
      return {};
    },
    template: '<div />',
  });
}

describe('usePageSeo', () => {
  it('maps title, description, and default robots/og image', () => {
    mountSeo({
      title: 'Pricing',
      description: 'Credit packs for Visual AI',
      path: '/pricing',
    });

    const seo = useSeoMeta.mock.calls[0]?.[0];
    expect(seo.title()).toBe('Pricing');
    expect(seo.description()).toBe('Credit packs for Visual AI');
    expect(seo.ogUrl()).toBe(canonicalUrl('/pricing'));
    expect(seo.ogImage()).toBe(DEFAULT_OG_IMAGE);
    expect(seo.ogSiteName).toBe(SITE_NAME);
    expect(seo.robots()).toBe('index,follow');
    expect(seo.twitterImage).toBe(DEFAULT_OG_IMAGE);
    expect(seo.ogTitle()).toBe('Pricing');
    expect(seo.ogType).toBe('website');
    expect(seo.twitterCard).toBe('summary_large_image');
    expect(seo.twitterTitle()).toBe('Pricing');
    expect(seo.twitterDescription()).toBe('Credit packs for Visual AI');
  });

  it('uses a custom image and robots, and emits JSON-LD', () => {
    const jsonLd = { '@type': 'FAQPage', mainEntity: [] };
    mountSeo({
      title: 'FAQ',
      description: 'Answers',
      path: 'faq',
      image: 'https://cdn.example/og.png',
      robots: 'noindex,nofollow',
      jsonLd,
    });

    const seo = useSeoMeta.mock.calls.at(-1)?.[0];
    expect(seo.ogImage()).toBe('https://cdn.example/og.png');
    expect(seo.robots()).toBe('noindex,nofollow');

    const head = useHead.mock.calls.at(-1)?.[0];
    expect(head.link()[0]).toEqual({ rel: 'canonical', href: canonicalUrl('faq') });
    expect(head.script()[0]).toMatchObject({
      type: 'application/ld+json',
      innerHTML: JSON.stringify(jsonLd),
    });
  });

  it('omits the JSON-LD script when none is provided', () => {
    mountSeo({
      title: 'Home',
      description: 'Generate images',
      path: '/',
    });

    const head = useHead.mock.calls.at(-1)?.[0];
    expect(head.script()).toEqual([]);
  });

  it('reacts to getter options', () => {
    const title = ref('Explore');
    mountSeo(() => ({
      title: title.value,
      description: 'Community feed',
      path: '/explore',
    }));

    const seo = useSeoMeta.mock.calls.at(-1)?.[0];
    expect(seo.title()).toBe('Explore');
    title.value = 'Explore · Visual AI';
    expect(seo.title()).toBe('Explore · Visual AI');
  });

  it('serializes a JSON-LD array and keeps the default twitter image', () => {
    const jsonLd = [{ '@type': 'WebPage' }, { '@type': 'FAQPage' }];
    mountSeo({
      title: 'Tools',
      description: 'Feature pages',
      path: '/tools',
      image: 'https://cdn.example/custom.png',
      jsonLd,
    });

    const seo = useSeoMeta.mock.calls.at(-1)?.[0];
    expect(seo.ogImage()).toBe('https://cdn.example/custom.png');
    expect(seo.twitterImage).toBe(DEFAULT_OG_IMAGE);

    const head = useHead.mock.calls.at(-1)?.[0];
    expect(head.script()[0].innerHTML).toBe(JSON.stringify(jsonLd));
  });
});
