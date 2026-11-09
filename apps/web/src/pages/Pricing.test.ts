import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import Pricing from '@/pages/Pricing.vue';

vi.mock('@/composables/usePageSeo', () => ({
  usePageSeo: () => undefined,
}));

const stubs = {
  PricingLayout: { template: '<div data-testid="pricing-layout" />' },
  LandingFooter: { template: '<footer data-testid="site-footer" />' },
};

describe('Pricing page', () => {
  it('renders the shared pricing layout', () => {
    const wrapper = mount(Pricing, { global: { stubs } });

    expect(wrapper.find('[data-testid="pricing-layout"]').exists()).toBe(true);
  });

  it('renders the site footer after the layout', () => {
    const wrapper = mount(Pricing, { global: { stubs } });
    const html = wrapper.html();

    expect(html.indexOf('pricing-layout')).toBeLessThan(html.indexOf('site-footer'));
  });

  it('does not render a legacy price note', () => {
    const wrapper = mount(Pricing, { global: { stubs } });

    expect(wrapper.text()).not.toContain('Approx. price');
  });
});
