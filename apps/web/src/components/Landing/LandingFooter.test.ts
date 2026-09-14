import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import LandingFooter from '@/components/Landing/LandingFooter.vue';

describe('LandingFooter', () => {
  it('renders footer links', () => {
    const wrapper = mount(LandingFooter, {
      global: {
        stubs: {
          RouterLink: { props: ['to'], template: '<a><slot /></a>' },
        },
      },
    });

    expect(wrapper.find('footer').exists() || wrapper.text().length > 0).toBe(true);
    expect(wrapper.text().toLowerCase()).toMatch(/privacy|terms|pricing|contact|visual/);
  });
});
