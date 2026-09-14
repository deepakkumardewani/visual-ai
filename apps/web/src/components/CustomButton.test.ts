import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import CustomButton from '@/components/CustomButton.vue';

const push = vi.fn();

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRouter: () => ({ push }),
  };
});

describe('CustomButton', () => {
  it('renders the title and navigates to create', async () => {
    const wrapper = mount(CustomButton, { props: { title: 'Open studio' } });
    expect(wrapper.text()).toBe('Open studio');
    await wrapper.get('[data-testid="header-dashboard-btn"]').trigger('click');
    expect(push).toHaveBeenCalledWith('/create');
  });
});
