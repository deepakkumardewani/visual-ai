import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProfileCreditsCard from '@/components/Profile/ProfileCreditsCard.vue';

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRouter: () => ({ push: vi.fn() }),
  };
});

describe('ProfileCreditsCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders a credits summary', () => {
    const wrapper = mount(ProfileCreditsCard);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text().toLowerCase()).toMatch(/credit/);
  });
});
