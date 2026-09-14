import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const routePathRef = ref('/create');
const routeNameRef = ref('create');
const smAndUpRef = ref(true);
const isAuthLoaded = ref(true);

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: routePathRef.value, name: routeNameRef.value }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>();
  return {
    ...actual,
    useMediaQuery: () => smAndUpRef,
  };
});

vi.mock('vue-clerk', () => ({
  SignedIn: { template: "<div data-testid='signed-in'><slot /></div>" },
  SignedOut: { template: "<div data-testid='signed-out'><slot /></div>" },
  useUser: () => ({ user: ref(null) }),
  useAuth: () => ({ isLoaded: isAuthLoaded }),
}));

vi.mock('@/components/Header/Logo.vue', () => ({
  default: { template: '<div data-testid="logo-stub">Logo</div>' },
}));

vi.mock('@/components/Header/NavTabs.vue', () => ({
  default: { template: '<nav data-testid="nav-tabs-stub">NavTabs</nav>' },
}));

vi.mock('@/components/Header/CreditsChip.vue', () => ({
  default: { template: '<div data-testid="credits-chip-stub">Credits</div>' },
}));

vi.mock('@/components/Header/UserMenu.vue', () => ({
  default: { template: '<div data-testid="user-menu-stub">User</div>' },
}));

vi.mock('@/components/Header/FeatureSelect.vue', () => ({
  default: { template: '<div data-testid="feature-select-stub">Feature</div>' },
}));

vi.mock('@/components/Header/ReferralOffer.vue', () => ({
  default: { template: '<div data-testid="referral-offer-stub" />' },
}));

vi.mock('@/components/Header/ThemeButton.vue', () => ({
  default: { template: '<div data-testid="theme-button-stub" />' },
}));

vi.mock('@/components/CustomButton.vue', () => ({
  default: { template: '<button>Dashboard</button>' },
}));

vi.mock('@/components/Dialogs/BuyMoreCreditsDialog.vue', () => ({
  default: { template: '<div />' },
}));

vi.mock('@/components/Dialogs/ReferralOfferDialog.vue', () => ({
  default: { template: '<div />' },
}));

import AppHeader from '@/components/Header/AppHeader.vue';
import { useUserStore } from '@/stores/user';

describe('AppHeader', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    routePathRef.value = '/create';
    routeNameRef.value = 'create';
    smAndUpRef.value = true;
    isAuthLoaded.value = true;
    localStorage.clear();
  });

  const mountHeader = () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const userStore = useUserStore();
    userStore.isReady = true;

    return mount(AppHeader, {
      global: {
        plugins: [pinia],
        stubs: { 'router-link': { template: '<a><slot /></a>' } },
      },
    });
  };

  it('renders translucent header shell without solid purple bar', () => {
    const wrapper = mountHeader();
    const shell = wrapper.get('[data-testid="app-header-v2"]').find('header');

    expect(shell.exists()).toBe(true);
    expect(shell.classes().join(' ')).toContain('header-v2');
    expect(shell.classes().join(' ')).not.toContain('tw-bg-purple');
  });

  it('shows dashboard nav tabs and credits for signed-in dashboard users', () => {
    const wrapper = mountHeader();

    expect(wrapper.find('[data-testid="nav-tabs-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="credits-chip-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="feature-select-stub"]').exists()).toBe(true);
  });

  it('shows sign-in affordance for signed-out dashboard users', () => {
    const wrapper = mountHeader();

    expect(wrapper.find('[data-testid="signed-out"]').exists()).toBe(true);
  });

  it('renders logo on non-dashboard pages without nav tabs', () => {
    routePathRef.value = '/pricing';
    routeNameRef.value = 'pricing';
    const wrapper = mountHeader();

    expect(wrapper.find('[data-testid="logo-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="nav-tabs-stub"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="feature-select-stub"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('Dashboard');
  });

  it('uses the mobile dashboard header and referral slot', () => {
    smAndUpRef.value = false;
    const wrapper = mountHeader();
    const shell = wrapper.get('[data-testid="app-header-v2"]').find('header');

    expect(shell.classes()).toContain('header-v2--dashboard-mobile');
    expect(wrapper.find('[data-testid="referral-offer-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="nav-tabs-stub"]').exists()).toBe(false);
  });

  it('shows a nav skeleton until Clerk finishes loading', () => {
    isAuthLoaded.value = false;
    const wrapper = mountHeader();

    expect(wrapper.find('[data-testid="nav-tabs-stub"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="header-end-skeleton"]').exists()).toBe(true);
  });

  it('keeps the end skeleton on dashboard until user details are ready', () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useUserStore().isReady = false;

    const wrapper = mount(AppHeader, {
      global: {
        plugins: [pinia],
        stubs: { 'router-link': { template: '<a><slot /></a>' } },
      },
    });
    expect(wrapper.find('[data-testid="header-end-skeleton"]').exists()).toBe(true);
  });

  it('hides the theme button on legal pages and shows Try it now on the landing path', () => {
    routePathRef.value = '/privacy';
    routeNameRef.value = 'privacy';
    const legal = mountHeader();
    expect(legal.find('[data-testid="theme-button-stub"]').exists()).toBe(false);

    routePathRef.value = '/terms';
    const terms = mountHeader();
    expect(terms.find('[data-testid="theme-button-stub"]').exists()).toBe(false);

    routePathRef.value = '/refund';
    const refund = mountHeader();
    expect(refund.find('[data-testid="theme-button-stub"]').exists()).toBe(false);

    routePathRef.value = '/';
    routeNameRef.value = 'landing';
    const landing = mountHeader();
    expect(landing.find('[data-testid="theme-button-stub"]').exists()).toBe(true);
    expect(landing.text()).toContain('Try it now');
  });

  it('does not keep an end skeleton on ready marketing pages', () => {
    routePathRef.value = '/pricing';
    routeNameRef.value = 'pricing';
    const wrapper = mountHeader();
    expect(wrapper.find('[data-testid="header-end-skeleton"]').exists()).toBe(false);
  });
});
