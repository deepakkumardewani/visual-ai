import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const push = vi.fn();
const routeName = ref<string>('home');
const isMobile = ref(false);

vi.mock('vue-router', () => ({
  useRoute: () => ({ name: routeName.value }),
  useRouter: () => ({ push }),
}));

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>();
  return {
    ...actual,
    useMediaQuery: () => isMobile,
  };
});

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
    isMobile.value = false;
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
});
