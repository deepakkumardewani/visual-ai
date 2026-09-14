import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PrimitivesPlayground from '@/pages/PrimitivesPlayground.vue';

describe('PrimitivesPlayground', () => {
  it('renders primitive section headings', () => {
    const wrapper = mount(PrimitivesPlayground, {
      global: {
        stubs: {
          Popover: { template: '<div class="popover-stub"><slot /><slot name="trigger" /></div>' },
          SegmentedControl: { template: '<div class="seg-stub" />' },
          Stepper: { template: '<div class="step-stub" />' },
          TierBadge: { template: '<span class="tier-stub" />' },
          ProviderIcon: { template: '<span class="prov-stub" />' },
        },
      },
    });

    expect(wrapper.text()).toContain('Popover');
    expect(wrapper.text()).toContain('Tier Badges');
    expect(wrapper.text()).toContain('Provider Icons');
  });
});
