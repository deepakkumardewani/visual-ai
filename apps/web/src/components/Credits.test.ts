import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Credits from '@/components/Credits.vue';

describe('Credits', () => {
  it('mounts an empty credits placeholder', () => {
    const wrapper = mount(Credits);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.element.tagName.toLowerCase()).toBe('div');
  });
});
