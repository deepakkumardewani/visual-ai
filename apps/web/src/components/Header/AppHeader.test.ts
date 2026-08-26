import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const routePathRef = ref('/create');
const routeNameRef = ref('create');
const smAndUpRef = ref(true);

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
  useAuth: () => ({ isLoaded: ref(true) }),
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
  default: { template: '<div />' },
}));

vi.mock('@/components/Header/ThemeButton.vue', () => ({
  default: { template: '<div />' },
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
  });
});
