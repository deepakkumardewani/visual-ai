import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import Frequent from '@/pages/Frequent.vue';

vi.mock('@/composables/usePageSeo', () => ({
  usePageSeo: () => undefined,
}));

describe('Frequent', () => {
  it('renders FAQ list and footer', () => {
    const wrapper = mount(Frequent, {
      global: {
        stubs: {
          FAQ: { template: '<div class="faq-stub">FAQ list</div>' },
          LandingFooter: { template: '<footer class="footer-stub" />' },
        },
      },
    });

    expect(wrapper.find('.faq-stub').exists()).toBe(true);
    expect(wrapper.find('.footer-stub').exists()).toBe(true);
  });
});
