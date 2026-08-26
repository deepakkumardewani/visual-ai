import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Pricing from '@/pages/Pricing.vue';

vi.mock('@/composables/usePageSeo', () => ({
  usePageSeo: () => undefined,
}));

const stubs = {
  FaqSection: { template: '<div class="faq-stub">FAQ Component</div>' },
  PricingPacks: { template: '<div>Buy Credits</div>' },
  LandingButton: { template: '<a href="#packs"><slot /></a>' },
};

describe('Pricing', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the hero section with Free Forever title', () => {
    const wrapper = mount(Pricing, {
      global: { stubs },
    });

    expect(wrapper.text()).toContain('Free Forever, Always');
  });

  it('displays the three credit cards in How Credits Work section', () => {
    const wrapper = mount(Pricing, {
      global: { stubs },
    });

    expect(wrapper.text()).toContain('Daily Credits');
    expect(wrapper.text()).toContain('Persistent Credits');
    expect(wrapper.text()).toContain('Pay Per Use');
  });

  it('displays the Model Credit Costs section', () => {
    const wrapper = mount(Pricing, {
      global: { stubs },
    });

    expect(wrapper.text()).toContain('Model Credit Costs');
  });

  it('displays the Buy Credits section with packs', () => {
    const wrapper = mount(Pricing, {
      global: { stubs },
    });

    expect(wrapper.text()).toContain('Buy Credits');
    expect(wrapper.text()).toContain('Credits');
  });

  it('renders the FAQ component', () => {
    const wrapper = mount(Pricing, {
      global: { stubs },
    });

    expect(wrapper.find('.faq-stub').exists()).toBe(true);
  });
});
