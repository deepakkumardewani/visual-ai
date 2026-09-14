import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ThemeButton from '@/components/Header/ThemeButton.vue';
import { useAppStore } from '@/stores/app';

describe('ThemeButton', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('labels the control for the opposite theme', () => {
    const appStore = useAppStore();
    appStore.isDark = true;
    const wrapper = mount(ThemeButton, {
      global: { stubs: { 'font-awesome-icon': true } },
    });
    expect(wrapper.attributes('aria-label')).toBe('Switch to Light Mode');
  });

  it('toggles theme on click', async () => {
    const appStore = useAppStore();
    const toggle = vi.spyOn(appStore, 'toggleTheme');
    const wrapper = mount(ThemeButton, {
      global: { stubs: { 'font-awesome-icon': true } },
    });
    await wrapper.trigger('click');
    expect(toggle).toHaveBeenCalled();
  });
});
