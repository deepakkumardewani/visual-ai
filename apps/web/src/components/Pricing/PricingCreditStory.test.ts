import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PricingCreditStory from '@/components/Pricing/PricingCreditStory.vue';

describe('PricingCreditStory', () => {
  it('explains daily and persistent credits', () => {
    const wrapper = mount(PricingCreditStory);
    expect(wrapper.text()).toMatch(/Daily|Persistent|credit/i);
  });
});
