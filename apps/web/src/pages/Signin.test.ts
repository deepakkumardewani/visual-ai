import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import Signin from '@/pages/Signin.vue';

vi.mock('vue-clerk', () => ({
  SignIn: {
    props: ['path', 'routing', 'signUpUrl'],
    template: '<div class="clerk-signin" :data-path="path" />',
  },
}));

describe('Signin', () => {
  it('wraps Clerk SignIn in AuthShell', () => {
    const wrapper = mount(Signin, {
      global: {
        stubs: {
          AuthShell: { template: '<div class="auth-shell"><slot /></div>' },
        },
      },
    });

    expect(wrapper.find('.auth-shell').exists()).toBe(true);
    expect(wrapper.find('.clerk-signin').exists()).toBe(true);
    expect(wrapper.find('.clerk-signin').attributes('data-path')).toBe('/signin');
  });
});
