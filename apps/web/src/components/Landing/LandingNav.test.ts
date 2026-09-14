import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const isSignedIn = vi.hoisted(() => ({ value: false }));
const scrollY = vi.hoisted(() => ({ value: 0 }));
const scrollToSection = vi.hoisted(() => vi.fn());

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    get isSignedIn() {
      return isSignedIn.value;
    },
  }),
}));

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>();
  return {
    ...actual,
    useWindowScroll: () => ({ y: scrollY }),
  };
});

vi.mock('@/composables/useLenis', () => ({
  scrollToSection,
}));

import LandingNav from '@/components/Landing/LandingNav.vue';
import { NAV_LINKS } from '@/utils/landing';

const stubs = {
  LandingButton: { props: ['to'], template: '<a class="nav-cta" :href="to"><slot /></a>' },
  ThemeButton: { template: '<button class="theme-stub" />' },
  Logo: { template: '<div class="logo-stub">Visual AI</div>' },
  RouterLink: { props: ['to'], template: '<a><slot /></a>' },
  Teleport: true,
  Transition: { template: '<div><slot /></div>' },
};

describe('LandingNav', () => {
  beforeEach(() => {
    isSignedIn.value = false;
    scrollY.value = 0;
    scrollToSection.mockReset();
  });

  it('renders brand and signed-out nav actions', () => {
    const wrapper = mount(LandingNav, { global: { stubs } });
    expect(wrapper.text()).toContain('Visual AI');
    expect(wrapper.text()).toContain('Start free');
    expect(wrapper.find('.nav-cta').attributes('href')).toBe('/signin');
  });

  it('shows Open studio when the visitor is signed in', () => {
    isSignedIn.value = true;
    const wrapper = mount(LandingNav, { global: { stubs } });
    expect(wrapper.text()).toContain('Open studio');
    expect(wrapper.find('.nav-cta').attributes('href')).toBe('/create');
  });

  it('toggles the mobile sheet and scrolls to a section', async () => {
    const wrapper = mount(LandingNav, { global: { stubs } });
    await wrapper.get('[aria-label="Toggle menu"]').trigger('click');
    expect(wrapper.get('[aria-label="Toggle menu"]').attributes('aria-expanded')).toBe('true');
    expect(wrapper.find('.nav__sheet').exists()).toBe(true);

    await wrapper.get(`.nav__sheet-link[href="${NAV_LINKS[0].href}"]`).trigger('click');
    expect(scrollToSection).toHaveBeenCalledWith(NAV_LINKS[0].href);
    expect(wrapper.find('.nav__sheet-link').exists()).toBe(false);
  });

  it('becomes solid after scroll and returns to the top', async () => {
    scrollY.value = 500;
    const scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
    const wrapper = mount(LandingNav, { global: { stubs } });

    expect(wrapper.get('header').classes()).toContain('nav--solid');
    await wrapper.get('[aria-label="Scroll to top"]').trigger('click');
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    vi.unstubAllGlobals();
  });
});
