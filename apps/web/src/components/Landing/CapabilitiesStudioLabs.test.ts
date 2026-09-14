import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CapabilitiesStudioLabs from '@/components/Landing/CapabilitiesStudioLabs.vue';

describe('CapabilitiesStudioLabs', () => {
  it('renders studio lab chips', () => {
    const wrapper = mount(CapabilitiesStudioLabs);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text().length).toBeGreaterThan(0);
  });
});
