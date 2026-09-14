import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import Terms from '@/pages/Terms.vue';

vi.mock('@/composables/usePageSeo', () => ({
  usePageSeo: () => undefined,
}));

describe('Terms', () => {
  it('renders terms content and footer', () => {
    const wrapper = mount(Terms, {
      global: {
        stubs: { LandingFooter: { template: '<footer class="footer-stub" />' } },
      },
    });

    expect(wrapper.text().toLowerCase()).toMatch(/terms/);
    expect(wrapper.find('.footer-stub').exists()).toBe(true);
  });
});
