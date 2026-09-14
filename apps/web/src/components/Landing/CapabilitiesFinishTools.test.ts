import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CapabilitiesFinishTools from '@/components/Landing/CapabilitiesFinishTools.vue';

describe('CapabilitiesFinishTools', () => {
  it('renders finish-tool tiles', () => {
    const wrapper = mount(CapabilitiesFinishTools);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text().length).toBeGreaterThan(0);
  });
});
