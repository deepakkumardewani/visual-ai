import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('vue-clerk', () => ({
  useUser: () => ({ isSignedIn: { value: false }, user: { value: null } }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import DashboardSidebar from '@/components/Dashboard/Sidebar/DashboardSidebar.vue';
import { useAppStore } from '@/stores/app';
import { FeatureType } from '@/types';

const childStubs = {
  ImageGenerateAside: { template: '<div data-testid="image-generate-aside-stub" />' },
  UpscaleImageAside: { template: '<div data-testid="upscale-aside-stub" />' },
  ColorizeImageAside: { template: '<div data-testid="colorize-aside-stub" />' },
  ReviveOldAside: { template: '<div data-testid="revive-aside-stub" />' },
  RemoveBgAside: { template: '<div data-testid="remove-bg-aside-stub" />' },
};

describe('DashboardSidebar', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('shows image generate settings by default', () => {
    const wrapper = mount(DashboardSidebar, {
      global: { plugins: [createPinia()], stubs: childStubs },
    });

    expect(wrapper.get('[data-testid="dashboard-sidebar"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="image-generate-aside-stub"]').exists()).toBe(true);
  });

  it('switches asides by feature', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const wrapper = mount(DashboardSidebar, {
      global: { plugins: [pinia], stubs: childStubs },
    });
    const app = useAppStore();

    app.feature = FeatureType.UPSCALE;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="upscale-aside-stub"]').exists()).toBe(true);

    app.feature = FeatureType.COLORIZE;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="colorize-aside-stub"]').exists()).toBe(true);

    app.feature = FeatureType.REVIVE;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="revive-aside-stub"]').exists()).toBe(true);

    app.feature = FeatureType.REMOVE_BG;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="remove-bg-aside-stub"]').exists()).toBe(true);
  });
});
