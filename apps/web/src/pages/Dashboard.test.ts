import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const xsRef = ref(false);
const widthRef = ref(1024);
const routeName = ref('create');
const routeParams = ref<Record<string, string>>({});

vi.mock('vue-router', () => ({
  useRoute: () => ({
    name: routeName.value,
    path: routeName.value === 'create' ? '/create' : `/${String(routeName.value)}`,
    params: routeParams.value,
  }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock('vuetify', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vuetify')>();
  return {
    ...actual,
    useDisplay: () => ({ xs: xsRef, width: widthRef }),
    useTheme: () => ({
      global: { name: { value: 'dark' } },
    }),
  };
});

vi.mock('vue-clerk', () => ({
  useUser: () => ({ user: ref(null) }),
}));

vi.mock('@/components/Dashboard/DashboardShell.vue', () => ({
  default: {
    template:
      '<div data-testid="dashboard-shell-stub"><slot name="rail" /><slot name="canvas" /></div>',
  },
}));

vi.mock('@/components/Dashboard/MobileSettingsSheet.vue', () => ({
  default: {
    props: ['modelValue'],
    template: '<div data-testid="mobile-settings-sheet-stub"><slot /></div>',
  },
}));

vi.mock('@/components/Dashboard/Sidebar/DashboardSidebar.vue', () => ({
  default: { template: '<div data-testid="dashboard-sidebar-stub" />' },
}));

vi.mock('@/components/Dashboard/Composer/PromptBar.vue', () => ({
  default: { template: '<div data-testid="prompt-bar-stub" />' },
}));

vi.mock('@/components/Dashboard/Canvas/ResultCanvas.vue', () => ({
  default: { template: '<div data-testid="result-canvas-stub" />' },
}));

vi.mock('@/components/Dialogs/SignupDialog.vue', () => ({
  default: { template: '<div />' },
}));

vi.mock('@/components/Dialogs/BuyMoreCreditsDialog.vue', () => ({
  default: { template: '<div />' },
}));

vi.mock('@/components/Dialogs/LowCreditsDialog.vue', () => ({
  default: { template: '<div />' },
}));

vi.mock('@/components/History/History.vue', () => ({
  default: { template: '<div data-testid="history-stub">History</div>' },
}));

vi.mock('@/components/Header/NavTabs.vue', () => ({
  default: { template: '<div data-testid="nav-tabs-stub">NavTabs</div>' },
}));

vi.mock('@/components/Dashboard/Feed/ExploreFeed.vue', () => ({
  default: { template: '<div data-testid="explore-feed-stub">Explore</div>' },
}));

import Dashboard from '@/pages/Dashboard.vue';
import { useAppStore } from '@/stores/app';

describe('Dashboard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    xsRef.value = false;
    widthRef.value = 1024;
    routeName.value = 'create';
    routeParams.value = {};
  });

  const panelIsShown = (wrapper: ReturnType<typeof mount>, testId: string) => {
    const style = wrapper.get(`[data-testid="${testId}"]`).attributes('style') ?? '';
    return !style.includes('display: none');
  };

  it('shows two-column create layout with sidebar, prompt bar, and canvas', async () => {
    routeName.value = 'create';
    const wrapper = mount(Dashboard);
    await wrapper.vm.$nextTick();

    expect(panelIsShown(wrapper, 'dashboard-generate-panel')).toBe(true);
    expect(wrapper.find('[data-testid="dashboard-shell-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="dashboard-sidebar-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="prompt-bar-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="result-canvas-stub"]').exists()).toBe(true);
  });

  it('shows assets panel on assets route', async () => {
    routeName.value = 'assets';
    const wrapper = mount(Dashboard);
    await wrapper.vm.$nextTick();

    const store = useAppStore();
    expect(store.tab).toBe(3);
    expect(panelIsShown(wrapper, 'dashboard-generate-panel')).toBe(false);
    expect(panelIsShown(wrapper, 'dashboard-assets-panel')).toBe(true);
    expect(wrapper.find('[data-testid="history-stub"]').exists()).toBe(true);
  });

  it('shows mobile nav tab strip only on xs viewports on app shell routes', async () => {
    xsRef.value = true;
    widthRef.value = 390;
    routeName.value = 'create';

    const wrapper = mount(Dashboard);

    expect(wrapper.find('[data-testid="dashboard-mobile-tabs"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="nav-tabs-stub"]').exists()).toBe(true);
  });

  it('does not render v-tabs-window or v-divider', () => {
    const wrapper = mount(Dashboard);

    expect(wrapper.html()).not.toMatch(/<v-tabs-window/i);
    expect(wrapper.html()).not.toMatch(/<v-divider/i);
  });
});
