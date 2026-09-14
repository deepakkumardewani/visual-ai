import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PricingHero from '@/components/Pricing/PricingHero.vue';

describe('PricingHero', () => {
  it('renders the free forever title and pack CTA', () => {
    const wrapper = mount(PricingHero, {
      global: {
        stubs: { LandingButton: { template: '<a href="#packs"><slot /></a>' } },
      },
    });

    expect(wrapper.text()).toContain('Free Forever, Always');
    expect(wrapper.text()).toContain('Buy a credit pack');
  });
});
