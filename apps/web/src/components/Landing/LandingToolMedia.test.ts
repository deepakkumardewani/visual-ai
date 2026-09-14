import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import LandingToolMedia from '@/components/Landing/LandingToolMedia.vue';

describe('LandingToolMedia', () => {
  it('renders a gallery cluster', () => {
    const wrapper = mount(LandingToolMedia, {
      props: {
        label: 'Generate',
        media: { kind: 'gallery', images: ['https://cdn.example.com/1.jpg'] },
      },
    });
    expect(wrapper.find('img').attributes('alt')).toContain('Generate');
  });

  it('renders a comparison slider for compare media', () => {
    const wrapper = mount(LandingToolMedia, {
      props: {
        label: 'Upscale',
        media: {
          kind: 'compare',
          before: 'https://cdn.example.com/b.jpg',
          after: 'https://cdn.example.com/a.jpg',
        },
      },
      global: {
        stubs: { BeforeAfter: { template: '<div class="ba-stub" />' } },
      },
    });
    expect(wrapper.find('.ba-stub').exists()).toBe(true);
  });
});
