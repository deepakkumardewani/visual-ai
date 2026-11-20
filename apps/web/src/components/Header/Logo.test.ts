import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const push = vi.fn();
const routeName = ref<string>('home');

vi.mock('vue-router', () => ({
  useRoute: () => ({ name: routeName.value }),
  useRouter: () => ({ push }),
}));

import Logo from '@/components/Header/Logo.vue';

const stubs = {
  LogoMark: {
    props: ['size'],
    template: '<svg data-testid="logo-mark" :width="size" :height="size" />',
  },
};

describe('Logo', () => {
  beforeEach(() => {
    push.mockReset();
    routeName.value = 'home';
  });

  it('shows wordmark off the app shell', () => {
    const wrapper = mount(Logo, { global: { stubs } });
    expect(wrapper.text()).toContain('Visual');
    expect(wrapper.text()).toContain('AI');
    expect(wrapper.attributes('aria-label')).toBe('Visual AI');
    expect(wrapper.find('[data-testid="logo-mark"]').exists()).toBe(true);
  });

  it('hides the mark when showMark is false', () => {
    const wrapper = mount(Logo, {
      props: { showMark: false },
      global: { stubs },
    });
    expect(wrapper.find('[data-testid="logo-mark"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('Visual');
  });

  it('hides wordmark on app-shell routes unless forced', () => {
    routeName.value = 'create';
    const wrapper = mount(Logo, { global: { stubs } });
    expect(wrapper.attributes('aria-label')).toBe('Visual AI home');
    expect(wrapper.text()).not.toContain('Visual');
  });

  it('forces wordmark on the dashboard', () => {
    routeName.value = 'create';
    const wrapper = mount(Logo, {
      props: { forceWordmark: true },
      global: { stubs },
    });
    expect(wrapper.text()).toContain('Visual');
  });

  it('navigates home on click', async () => {
    const wrapper = mount(Logo, { global: { stubs } });
    await wrapper.trigger('click');
    expect(push).toHaveBeenCalledWith('/');
  });

  it('renders the mark at a constant 34px and keeps a 44px hit area', () => {
    const wrapper = mount(Logo, { global: { stubs } });
    const mark = wrapper.get('[data-testid="logo-mark"]');
    expect(mark.attributes('width')).toBe('34');
    expect(mark.attributes('height')).toBe('34');
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['tw-min-h-11', 'tw-min-w-11']));
  });
});
