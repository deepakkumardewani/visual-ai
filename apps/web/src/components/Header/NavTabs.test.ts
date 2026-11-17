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

  it('wraps left from Create to Assets and jumps with Home and End', async () => {
    routeName.value = 'create';
    const wrapper = mountNavTabs();
    const createTab = wrapper.get('[data-testid="nav-tab-create"]');

    await createTab.trigger('keydown', { key: 'ArrowLeft' });
    expect(push).toHaveBeenCalledWith({ name: APP_SURFACE.ASSETS });

    await createTab.trigger('keydown', { key: 'End' });
    expect(push).toHaveBeenCalledWith({ name: APP_SURFACE.ASSETS });

    await createTab.trigger('keydown', { key: 'Home' });
    expect(push).toHaveBeenCalled();
  });

  it('navigates Create through the current feature location', async () => {
    routeName.value = 'explore';
    const wrapper = mountNavTabs();
    await wrapper.get('[data-testid="nav-tab-create"]').trigger('click');
    expect(push).toHaveBeenCalled();
    const location = push.mock.calls.at(-1)?.[0];
    expect(location).toBeTruthy();
  });

  it('uses the equal-thirds segmented layout only for the segmented variant', () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const segmented = mount(NavTabs, {
      props: { variant: 'segmented' },
      global: { plugins: [pinia] },
    });
    const pill = mountNavTabs();

    expect(segmented.get('[data-testid="nav-tabs"]').classes()).toContain('nav-tabs--segmented');
    expect(segmented.get('[data-testid="nav-tabs"]').classes()).not.toContain('tw-max-w-md');
    expect(pill.get('[data-testid="nav-tabs"]').classes()).not.toContain('nav-tabs--segmented');
    expect(pill.get('[data-testid="nav-tabs"]').classes()).toContain('tw-max-w-md');
    for (const tab of segmented.findAll('[role="tab"]')) {
      expect(tab.classes()).toContain('tw-flex-1');
      expect(tab.classes()).toContain('tw-basis-0');
    }
  });

  it('offsets the slider by one tab width per index', async () => {
    routeName.value = 'assets';
    const wrapper = mountNavTabs();
    const style = wrapper.get('.nav-tabs__slider').attributes('style') ?? '';

    expect(style).toContain('translateX(200%)');
  });

  it('exposes only the active tab in the tab order', () => {
    routeName.value = 'explore';
    const wrapper = mountNavTabs();

    expect(wrapper.get('[data-testid="nav-tab-explore"]').attributes('tabindex')).toBe('0');
    expect(wrapper.get('[data-testid="nav-tab-create"]').attributes('tabindex')).toBe('-1');
    expect(wrapper.get('[data-testid="nav-tab-assets"]').attributes('tabindex')).toBe('-1');
  });

  it('moves focus along with keyboard selection and wraps at both ends', async () => {
    routeName.value = 'assets';
    const wrapper = mount(NavTabs, {
      attachTo: document.body,
      global: { plugins: [createPinia()] },
    });

    await wrapper.get('[data-testid="nav-tab-assets"]').trigger('keydown', { key: 'ArrowRight' });
    expect(push).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: expect.stringMatching(/create/) }),
    );
    expect(document.activeElement).toBe(wrapper.get('[data-testid="nav-tab-create"]').element);

    await wrapper.get('[data-testid="nav-tab-create"]').trigger('keydown', { key: 'End' });
    expect(push).toHaveBeenLastCalledWith({ name: APP_SURFACE.ASSETS });
    expect(document.activeElement).toBe(wrapper.get('[data-testid="nav-tab-assets"]').element);

    await wrapper.get('[data-testid="nav-tab-assets"]').trigger('keydown', { key: 'ArrowLeft' });
    expect(push).toHaveBeenLastCalledWith({ name: APP_SURFACE.EXPLORE });
    expect(document.activeElement).toBe(wrapper.get('[data-testid="nav-tab-explore"]').element);

    await wrapper.get('[data-testid="nav-tab-explore"]').trigger('keydown', { key: 'Home' });
    expect(document.activeElement).toBe(wrapper.get('[data-testid="nav-tab-create"]').element);
    wrapper.unmount();
  });

  it('ignores unrelated keys', async () => {
    const wrapper = mountNavTabs();
    await wrapper.get('[data-testid="nav-tab-create"]').trigger('keydown', { key: 'a' });
    expect(push).not.toHaveBeenCalled();
  });
});
