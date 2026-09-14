import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppFooter from '@/components/AppFooter.vue';

describe('AppFooter', () => {
  it('renders copyright and footer navigation', () => {
    const wrapper = mount(AppFooter, {
      global: {
        stubs: {
          Copyright: { template: '<div class="copy-stub">© Visual AI</div>' },
          RouterLink: { props: ['to'], template: '<a class="footer-link"><slot /></a>' },
        },
      },
    });

    expect(wrapper.find('footer').exists()).toBe(true);
    expect(wrapper.find('.copy-stub').exists()).toBe(true);
    expect(wrapper.findAll('.footer-link').length).toBeGreaterThan(0);
  });
});
