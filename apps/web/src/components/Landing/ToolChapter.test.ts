import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ToolChapter from '@/components/Landing/ToolChapter.vue';
import { TOOLS } from '@/utils/landing';

describe('ToolChapter', () => {
  it('renders the first tool chapter', () => {
    const wrapper = mount(ToolChapter, {
      props: { tool: TOOLS[0], index: 0 },
      global: {
        stubs: {
          LandingButton: { template: '<a><slot /></a>' },
          LandingToolMedia: { template: '<div class="media-stub" />' },
        },
      },
    });

    expect(wrapper.text()).toContain(TOOLS[0].title);
    expect(wrapper.text()).toContain('01');
    expect(wrapper.find('.media-stub').exists()).toBe(true);
  });
});
