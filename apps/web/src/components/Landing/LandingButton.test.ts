import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import LandingButton from '@/components/Landing/LandingButton.vue';

describe('LandingButton', () => {
  it('renders a button when no destination is set', () => {
    const wrapper = mount(LandingButton, { slots: { default: 'Start free' } });
    expect(wrapper.element.tagName.toLowerCase()).toBe('button');
    expect(wrapper.text()).toBe('Start free');
  });

  it('renders a router-link when to is set', () => {
    const wrapper = mount(LandingButton, {
      props: { to: '/signin' },
      slots: { default: 'Start free' },
      global: {
        stubs: {
          'router-link': { props: ['to'], template: '<a class="rl" :href="to"><slot /></a>' },
        },
      },
    });
    expect(wrapper.find('.rl').attributes('href')).toBe('/signin');
  });

  it('renders an anchor when href is set', () => {
    const wrapper = mount(LandingButton, {
      props: { href: 'https://visual-ai.app' },
      slots: { default: 'Visit' },
    });
    expect(wrapper.element.tagName.toLowerCase()).toBe('a');
    expect(wrapper.attributes('href')).toBe('https://visual-ai.app');
  });
});
