import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import Signup from '@/pages/Signup.vue';

vi.mock('vue-clerk', () => ({
  SignUp: {
    props: ['path', 'routing', 'signInUrl'],
    template: '<div class="clerk-signup" :data-path="path" />',
  },
}));

describe('Signup', () => {
  it('wraps Clerk SignUp in AuthShell', () => {
    const wrapper = mount(Signup, {
      global: {
        stubs: {
          AuthShell: { template: '<div class="auth-shell"><slot /></div>' },
        },
      },
    });

    expect(wrapper.find('.auth-shell').exists()).toBe(true);
    expect(wrapper.find('.clerk-signup').exists()).toBe(true);
    expect(wrapper.find('.clerk-signup').attributes('data-path')).toBe('/signup');
  });
});
