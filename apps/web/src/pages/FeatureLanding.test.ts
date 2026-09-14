import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

const route = { path: '/text-to-image' };
const usePageSeo = vi.fn((options: unknown) =>
  typeof options === 'function' ? options() : options,
);

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRoute: () => route,
  };
});

vi.mock('@/composables/usePageSeo', () => ({
  usePageSeo: (options: unknown) => usePageSeo(options),
}));

vi.mock('@/composables/useLenis', () => ({
  useLenis: () => undefined,
  scrollToSection: vi.fn(),
}));

import FeatureLanding from '@/pages/FeatureLanding.vue';

const stubs = {
  AmbientCanvas: { template: '<div class="ambient-stub" />' },
  LandingNav: { template: '<nav class="nav-stub" />' },
  FeatureLandingHero: { template: '<section class="hero-stub" />', props: ['landing', 'tool'] },
  FeatureLandingSteps: {
    template: '<section class="steps-stub" />',
    props: ['heading', 'headingId', 'steps'],
  },
  FaqSection: { template: '<div class="faq-stub" />', props: ['faqs', 'heading'] },
  FeatureLandingMore: { template: '<div class="more-stub" />', props: ['pages'] },
  LandingFooter: { template: '<footer class="footer-stub" />' },
};

describe('FeatureLanding', () => {
  it('renders feature sections for a known SEO path', () => {
    route.path = '/text-to-image';
    usePageSeo.mockClear();
    const wrapper = mount(FeatureLanding, { global: { stubs } });

    expect(wrapper.find('.fl').exists()).toBe(true);
    expect(wrapper.find('.hero-stub').exists()).toBe(true);
    expect(wrapper.find('.steps-stub').exists()).toBe(true);
    expect(wrapper.find('.faq-stub').exists()).toBe(true);

    const seo = usePageSeo.mock.results.at(-1)?.value as { title: string; jsonLd: unknown[] };
    expect(seo.title).toBeTruthy();
    expect(Array.isArray(seo.jsonLd)).toBe(true);
    expect(seo.jsonLd.length).toBeGreaterThan(0);
  });

  it('renders nothing when the path is unknown and noindexes the page', () => {
    route.path = '/not-a-feature';
    usePageSeo.mockClear();
    const wrapper = mount(FeatureLanding, { global: { stubs } });
    expect(wrapper.find('.fl').exists()).toBe(false);

    const seo = usePageSeo.mock.results.at(-1)?.value as { robots: string; title: string };
    expect(seo.robots).toBe('noindex, follow');
    expect(seo.title).toBe('Visual AI');
  });
});
