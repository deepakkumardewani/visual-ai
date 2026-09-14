import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import Landing from '@/pages/Landing.vue';

vi.mock('@/composables/usePageSeo', () => ({
  usePageSeo: () => undefined,
}));

vi.mock('@/composables/useLenis', () => ({
  useLenis: () => undefined,
  scrollToSection: vi.fn(),
}));

const stubs = {
  AmbientCanvas: { template: '<div class="ambient-stub" />' },
  LandingNav: { template: '<nav class="nav-stub" />' },
  LandingHero: { template: '<section class="hero-stub" />' },
  GalleryStrip: { template: '<div class="strip-stub" />' },
  ToolChapter: { template: '<article class="tool-stub" />' },
  ShowcaseGallery: { template: '<div class="showcase-stub" />' },
  CapabilitiesSection: { template: '<div class="caps-stub" />' },
  PricingTeaser: { template: '<div class="pricing-stub" />' },
  FaqSection: { template: '<div class="faq-stub" />' },
  FinalCta: { template: '<div class="cta-stub" />' },
  LandingFooter: { template: '<footer class="footer-stub" />' },
};

describe('Landing', () => {
  it('renders the studio tools heading and section stubs', () => {
    const wrapper = mount(Landing, { global: { stubs } });

    expect(wrapper.text()).toContain('Five tools, one studio.');
    expect(wrapper.find('.hero-stub').exists()).toBe(true);
    expect(wrapper.find('.footer-stub').exists()).toBe(true);
    expect(wrapper.findAll('.tool-stub').length).toBeGreaterThan(0);
  });
});
