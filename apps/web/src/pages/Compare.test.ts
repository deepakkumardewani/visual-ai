import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import Compare from '@/pages/Compare.vue';

vi.mock('@/composables/usePageSeo', () => ({
  usePageSeo: () => undefined,
}));

describe('Compare', () => {
  it('renders the comparison heading and CTA', () => {
    const wrapper = mount(Compare, {
      global: {
        stubs: {
          ComparisonCard: { template: '<article class="card-stub" />' },
          LandingFooter: { template: '<footer class="footer-stub" />' },
          RouterLink: { props: ['to'], template: '<a class="cta"><slot /></a>' },
        },
      },
    });

    expect(wrapper.text()).toContain('Compare upscale models');
    expect(wrapper.text()).toContain('Open upscaler');
    expect(wrapper.findAll('.card-stub').length).toBeGreaterThan(0);
    expect(wrapper.find('.footer-stub').exists()).toBe(true);
  });
});
