import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PricingTeaser from '@/components/Landing/PricingTeaser.vue';

describe('PricingTeaser', () => {
  it('renders free and credit pack teasers', () => {
    const wrapper = mount(PricingTeaser, {
      global: {
        stubs: { LandingButton: { template: '<a><slot /></a>' } },
      },
    });

    expect(wrapper.text()).toContain('Free forever. Pay only for what you create.');
    expect(wrapper.text()).toContain('Start free');
    expect(wrapper.text()).toContain('See packs');
  });
});
