import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import Copyright from '@/components/Copyright.vue';

const push = vi.fn();

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRouter: () => ({ push }),
  };
});

describe('Copyright', () => {
  it('shows the current year and navigates home', async () => {
    const wrapper = mount(Copyright);
    expect(wrapper.text()).toContain(String(new Date().getFullYear()));
    expect(wrapper.text()).toContain('Visual AI');
    await wrapper.get('.copyright__brand').trigger('click');
    expect(push).toHaveBeenCalledWith('/');
  });
});
