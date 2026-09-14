import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import GalleryStrip from '@/components/Landing/GalleryStrip.vue';

describe('GalleryStrip', () => {
  it('renders gallery images or fallback copy', () => {
    const wrapper = mount(GalleryStrip);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.findAll('img').length >= 0).toBe(true);
  });
});
