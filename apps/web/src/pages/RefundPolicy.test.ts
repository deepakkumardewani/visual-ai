import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import RefundPolicy from '@/pages/RefundPolicy.vue';

vi.mock('@/composables/usePageSeo', () => ({
  usePageSeo: () => undefined,
}));

describe('RefundPolicy', () => {
  it('renders refund policy content and footer', () => {
    const wrapper = mount(RefundPolicy, {
      global: {
        stubs: { LandingFooter: { template: '<footer class="footer-stub" />' } },
      },
    });

    expect(wrapper.text().toLowerCase()).toMatch(/refund/);
    expect(wrapper.find('.footer-stub').exists()).toBe(true);
  });
});
