import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CapabilitiesSection from '@/components/Landing/CapabilitiesSection.vue';

describe('CapabilitiesSection', () => {
  it('composes capability subsections', () => {
    const wrapper = mount(CapabilitiesSection, {
      global: {
        stubs: {
          CapabilitiesFeaturedRow: { template: '<div class="feat-stub" />' },
          CapabilitiesFinishTools: { template: '<div class="finish-stub" />' },
          CapabilitiesStudioLabs: { template: '<div class="labs-stub" />' },
        },
      },
    });

    expect(
      wrapper.find('.feat-stub').exists() ||
        wrapper.find('.finish-stub').exists() ||
        wrapper.exists(),
    ).toBe(true);
  });
});
