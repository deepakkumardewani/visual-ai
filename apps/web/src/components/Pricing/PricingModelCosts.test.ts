import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PricingModelCosts from '@/components/Pricing/PricingModelCosts.vue';

describe('PricingModelCosts', () => {
  it('renders model credit costs', () => {
    const wrapper = mount(PricingModelCosts);
    expect(wrapper.text()).toMatch(/Model|credit|cost/i);
  });
});
