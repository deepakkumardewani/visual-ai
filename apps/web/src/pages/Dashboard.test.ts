import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const smAndUpRef = ref(true);
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

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>();
  return {
    ...actual,
    useMediaQuery: () => smAndUpRef,
  };
});

vi.mock('vue-clerk', () => ({
  useUser: () => ({ user: ref(null) }),
}));

const seoGetters: Array<() => Record<string, unknown>> = [];

vi.mock('@/composables/usePageSeo', () => ({
  usePageSeo: (getter: () => Record<string, unknown>) => {
    seoGetters.push(getter);
  },
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
    emits: ['update:modelValue'],
    template:
      '<div data-testid="mobile-settings-sheet-stub" :data-open="String(modelValue)"><button data-testid="sheet-close" @click="$emit(\'update:modelValue\', false)" /><slot /></div>',
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
import { HEIGHT_BELOW_HEADER_CLASS } from '@/utils/layout';

describe('Dashboard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    smAndUpRef.value = true;
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

  it('does not render its own mobile tab strip (tabs live in the header)', () => {
    smAndUpRef.value = false;
    routeName.value = 'create';

    const wrapper = mount(Dashboard);

    expect(wrapper.find('[data-testid="dashboard-mobile-tabs"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="nav-tabs-stub"]').exists()).toBe(false);
  });

  it('does not render v-tabs-window or v-divider', () => {
    const wrapper = mount(Dashboard);

    expect(wrapper.html()).not.toMatch(/<v-tabs-window/i);
    expect(wrapper.html()).not.toMatch(/<v-divider/i);
  });

  it('shows only the explore panel on the explore route', async () => {
    routeName.value = 'explore';
    const wrapper = mount(Dashboard);
    await wrapper.vm.$nextTick();

    expect(useAppStore().tab).toBe(2);
    expect(panelIsShown(wrapper, 'dashboard-explore-panel')).toBe(true);
    expect(panelIsShown(wrapper, 'dashboard-generate-panel')).toBe(false);
    expect(panelIsShown(wrapper, 'dashboard-assets-panel')).toBe(false);
    expect(wrapper.find('[data-testid="explore-feed-stub"]').exists()).toBe(true);
  });

  it('docks the composer and settings trigger below the sm breakpoint without tabs', () => {
    smAndUpRef.value = false;
    const wrapper = mount(Dashboard);

    expect(wrapper.find('[data-testid="mobile-composer-dock"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="mobile-settings-trigger"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="dashboard-mobile-tabs"]').exists()).toBe(false);
  });

  it('gives the settings trigger a 44px minimum touch target', () => {
    smAndUpRef.value = false;
    const classes = mount(Dashboard).get('[data-testid="mobile-settings-trigger"]').classes();

    expect(classes).toContain('tw-min-h-11');
    expect(classes).toContain('tw-min-w-11');
  });

  it('mounts the settings sidebar inside the sheet only below the sm breakpoint', () => {
    smAndUpRef.value = false;
    const below = mount(Dashboard);
    expect(
      below
        .get('[data-testid="mobile-settings-sheet-stub"]')
        .find('[data-testid="dashboard-sidebar-stub"]')
        .exists(),
    ).toBe(true);

    smAndUpRef.value = true;
    const above = mount(Dashboard);
    expect(
      above
        .get('[data-testid="mobile-settings-sheet-stub"]')
        .find('[data-testid="dashboard-sidebar-stub"]')
        .exists(),
    ).toBe(false);
  });

  it('keeps the desktop prompt on top and no dock at sm and above', () => {
    smAndUpRef.value = true;
    const wrapper = mount(Dashboard);

    expect(wrapper.find('[data-testid="mobile-composer-dock"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="prompt-bar-stub"]').exists()).toBe(true);
  });

  it('syncs the feature from the route params on create', () => {
    routeParams.value = { feature: 'upscale' };
    mount(Dashboard);

    expect(useAppStore().feature).not.toBe('image');
  });

  it('opens the settings sheet from the dock and closes it when the viewport grows', async () => {
    smAndUpRef.value = false;
    const wrapper = mount(Dashboard);
    const isOpen = () =>
      wrapper.get('[data-testid="mobile-settings-sheet-stub"]').attributes('data-open');

    expect(isOpen()).toBe('false');
    await wrapper.get('[data-testid="mobile-settings-trigger"]').trigger('click');
    expect(isOpen()).toBe('true');

    smAndUpRef.value = true;
    await wrapper.vm.$nextTick();
    expect(isOpen()).toBe('false');
  });

  it('closes the settings sheet when the sheet emits update:modelValue', async () => {
    smAndUpRef.value = false;
    const wrapper = mount(Dashboard);
    const isOpen = () =>
      wrapper.get('[data-testid="mobile-settings-sheet-stub"]').attributes('data-open');

    await wrapper.get('[data-testid="mobile-settings-trigger"]').trigger('click');
    expect(isOpen()).toBe('true');
    await wrapper.get('[data-testid="sheet-close"]').trigger('click');
    expect(isOpen()).toBe('false');
  });

  it('registers noindex page SEO for the current route path', () => {
    seoGetters.length = 0;
    routeName.value = 'create';
    mount(Dashboard);

    expect(seoGetters[0]?.()).toMatchObject({
      title: 'Create with Visual AI',
      path: '/create',
      robots: 'noindex, follow',
    });
  });

  it.each(['dashboard-explore-panel', 'dashboard-assets-panel'])(
    '%s uses the shared dvh header-variable height class',
    (testId) => {
      const classes = mount(Dashboard).get(`[data-testid="${testId}"]`).classes();

      expect(classes).toContain(HEIGHT_BELOW_HEADER_CLASS);
      expect(classes).toContain('tw-h-[calc(100dvh-var(--app-header-h,64px))]');
      expect(classes.join(' ')).not.toContain('100vh');
    },
  );
});
