import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import PrivacyPolicy from '@/pages/PrivacyPolicy.vue';

vi.mock('@/composables/usePageSeo', () => ({
  usePageSeo: () => undefined,
}));

describe('PrivacyPolicy', () => {
  it('renders the policy heading and footer', () => {
    const wrapper = mount(PrivacyPolicy, {
      global: {
        stubs: { LandingFooter: { template: '<footer class="footer-stub" />' } },
      },
    });

    expect(wrapper.text()).toContain('Privacy Policy');
    expect(wrapper.find('.footer-stub').exists()).toBe(true);
  });
});
