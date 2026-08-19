import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const routeName = ref('create');
const push = vi.fn();

vi.mock('vue-router', () => ({
  useRoute: () => ({ name: routeName.value, query: {}, params: {} }),
  useRouter: () => ({ push }),
}));

vi.mock('vue-clerk', () => ({
  useUser: () => ({ user: ref(null) }),
}));

import NavTabs from '@/components/Header/NavTabs.vue';
import { APP_SURFACE } from '@/utils/dashboardRoutes';

describe('NavTabs', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    routeName.value = 'create';
    push.mockReset();
  });

  const mountNavTabs = () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    return mount(NavTabs, { global: { plugins: [pinia] } });
  };

  it('renders Create, Explore, and Assets tabs', () => {
    const wrapper = mountNavTabs();

    expect(wrapper.get('[data-testid="nav-tab-create"]').text()).toBe('Create');
    expect(wrapper.get('[data-testid="nav-tab-explore"]').text()).toBe('Explore');
    expect(wrapper.get('[data-testid="nav-tab-assets"]').text()).toBe('Assets');
  });

  it('navigates via router on click', async () => {
    const wrapper = mountNavTabs();

    await wrapper.get('[data-testid="nav-tab-explore"]').trigger('click');
    expect(push).toHaveBeenCalledWith({ name: APP_SURFACE.EXPLORE });

    await wrapper.get('[data-testid="nav-tab-assets"]').trigger('click');
    expect(push).toHaveBeenCalledWith({ name: APP_SURFACE.ASSETS });
  });

  it('marks the active tab with aria-selected', async () => {
    routeName.value = 'explore';
    const wrapper = mountNavTabs();
    await wrapper.vm.$nextTick();

    expect(wrapper.get('[data-testid="nav-tab-explore"]').attributes('aria-selected')).toBe('true');
    expect(wrapper.get('[data-testid="nav-tab-create"]').attributes('aria-selected')).toBe('false');
  });

  it('uses 44px minimum touch targets', () => {
    const wrapper = mountNavTabs();
    const buttons = wrapper.findAll('[role="tab"]');

    buttons.forEach((button) => {
      expect(button.classes().join(' ')).toContain('tw-min-h-11');
    });
  });

  it('supports keyboard navigation between tabs', async () => {
    routeName.value = 'create';
    const wrapper = mountNavTabs();
    await wrapper.vm.$nextTick();

    const createTab = wrapper.get('[data-testid="nav-tab-create"]');
    await createTab.trigger('keydown', { key: 'ArrowRight' });

    expect(push).toHaveBeenCalledWith({ name: APP_SURFACE.EXPLORE });
  });
});
