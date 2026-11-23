import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const routePathRef = ref('/create');
const routeNameRef = ref('create');
const isWideRef = ref(true);
const isAuthLoaded = ref(true);

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: routePathRef.value, name: routeNameRef.value }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/composables/useHeaderBreakpoint', async () => {
  const vue = await import('vue');
  return {
    useHeaderBreakpoint: () => ({
      isMobile: vue.computed(() => !isWideRef.value),
      isTablet: vue.computed(() => false),
    }),
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
import { PLAN } from '@visual-ai/shared';

describe('AppHeader', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    routePathRef.value = '/create';
    routeNameRef.value = 'create';
    isWideRef.value = true;
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
    isWideRef.value = false;
    const wrapper = mountHeader();
    const shell = wrapper.get('[data-testid="app-header-v2"]').find('header');

    expect(shell.classes()).toContain('header-v2--dashboard-mobile');
    expect(wrapper.find('[data-testid="referral-offer-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="header-mobile-tabs"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="nav-tabs-stub"]').exists()).toBe(true);
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

  it('shows only the avatar placeholder in the skeleton on non-dashboard pages', () => {
    routePathRef.value = '/pricing';
    routeNameRef.value = 'pricing';
    isAuthLoaded.value = false;
    const wrapper = mountHeader();

    const skeleton = wrapper.get('[data-testid="header-end-skeleton"]');
    expect(skeleton.findAll('div')).toHaveLength(1);
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

  it('shows the banner above the header and no Earn chip below 768', () => {
    isWideRef.value = false;
    const wrapper = mountHeader();
    const root = wrapper.get('[data-testid="app-header-v2"]');

    expect(root.findAll('[data-testid="referral-offer-stub"]')).toHaveLength(1);
    expect(root.find('header [data-testid="referral-offer-stub"]').exists()).toBe(false);
  });

  it('shows the Earn chip inside the header and no banner at 768 and above', () => {
    isWideRef.value = true;
    const wrapper = mountHeader();
    const root = wrapper.get('[data-testid="app-header-v2"]');

    expect(root.findAll('[data-testid="referral-offer-stub"]')).toHaveLength(1);
    expect(root.find('header [data-testid="referral-offer-stub"]').exists()).toBe(true);
  });

  it('renders neither referral slot off the dashboard', () => {
    routePathRef.value = '/pricing';
    routeNameRef.value = 'pricing';
    for (const wide of [false, true]) {
      isWideRef.value = wide;
      const wrapper = mountHeader();
      expect(wrapper.find('[data-testid="referral-offer-stub"]').exists()).toBe(false);
    }
  });
  describe('right cluster', () => {
    const mountWithPlan = (plan: string) => {
      const pinia = createPinia();
      setActivePinia(pinia);
      const userStore = useUserStore();
      userStore.isReady = true;
      userStore.plan = plan as typeof userStore.plan;
      return mount(AppHeader, {
        global: {
          plugins: [pinia],
          stubs: {
            'router-link': { template: '<a><slot /></a>' },
            'font-awesome-icon': true,
          },
        },
      });
    };

    const clusterOrder = (wrapper: ReturnType<typeof mountWithPlan>) =>
      Array.from(
        wrapper
          .get('#export-area [data-testid="signed-in"]')
          .element.querySelectorAll('[data-testid]'),
      ).map((el) => el.getAttribute('data-testid'));

    it('orders Earn, Upgrade, credits, avatar for a Free user on the dashboard', () => {
      const order = clusterOrder(mountWithPlan(PLAN.FREE));

      expect(order).toEqual([
        'header-shortcuts',
        'referral-offer-stub',
        'upgrade-button',
        'credits-chip-stub',
        'user-menu-stub',
      ]);
    });

    it('omits Upgrade for a Pro user on the dashboard', () => {
      const order = clusterOrder(mountWithPlan(PLAN.PRO));

      expect(order).toEqual([
        'header-shortcuts',
        'referral-offer-stub',
        'credits-chip-stub',
        'user-menu-stub',
      ]);
    });

    it('omits Earn below 768 while keeping Upgrade', () => {
      isWideRef.value = false;
      const order = clusterOrder(mountWithPlan(PLAN.FREE));

      expect(order).toEqual([
        'header-shortcuts',
        'upgrade-button',
        'credits-chip-stub',
        'user-menu-stub',
      ]);
    });

    it('shows no Upgrade or credits off the dashboard', () => {
      routePathRef.value = '/pricing';
      routeNameRef.value = 'pricing';
      const wrapper = mountWithPlan(PLAN.FREE);

      expect(wrapper.find('[data-testid="upgrade-button"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="credits-chip-stub"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="user-menu-stub"]').exists()).toBe(true);
    });
  });

  describe('layout across widths', () => {
    const navTabsCalls = (wrapper: ReturnType<typeof mountHeader>) =>
      wrapper.findAll('[data-testid="nav-tabs-stub"]');

    it('shows the feature select on Create at desktop and mobile widths', () => {
      for (const wide of [true, false]) {
        isWideRef.value = wide;
        expect(mountHeader().find('[data-testid="feature-select-stub"]').exists()).toBe(true);
      }
    });

    it('hides the feature select on Explore and Assets at all widths', () => {
      for (const name of ['explore', 'assets']) {
        for (const wide of [true, false]) {
          routeNameRef.value = name;
          routePathRef.value = `/${name}`;
          isWideRef.value = wide;
          expect(mountHeader().find('[data-testid="feature-select-stub"]').exists()).toBe(false);
        }
      }
    });

    it('renders tabs once in the centered slot at 768+ and no mobile tabs row', () => {
      isWideRef.value = true;
      const wrapper = mountHeader();

      expect(navTabsCalls(wrapper)).toHaveLength(1);
      expect(wrapper.find('.header-v2__center [data-testid="nav-tabs-stub"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="header-mobile-tabs"]').exists()).toBe(false);
      expect(wrapper.get('[data-testid="app-header-v2"]').classes()).not.toContain(
        'header-v2-root--mobile',
      );
    });

    it('renders tabs once, in a second row inside the sticky header, below 768', () => {
      isWideRef.value = false;
      const wrapper = mountHeader();
      const row = wrapper.get('[data-testid="header-mobile-tabs"]');

      expect(navTabsCalls(wrapper)).toHaveLength(1);
      expect(row.find('[data-testid="nav-tabs-stub"]').exists()).toBe(true);
      expect(wrapper.get('header.header-v2').element.contains(row.element)).toBe(true);
      expect(wrapper.get('header.header-v2').classes()).toContain('header-v2--dashboard-mobile');
      expect(wrapper.find('.header-v2__center').exists()).toBe(false);
      expect(wrapper.get('[data-testid="app-header-v2"]').classes()).toContain(
        'header-v2-root--mobile',
      );
    });

    it('shows a tabs skeleton in the centered slot at 768+ while Clerk loads', () => {
      isAuthLoaded.value = false;
      isWideRef.value = true;
      const wrapper = mountHeader();
      const skeleton = wrapper.get('.header-v2__center [aria-hidden="true"]');

      expect(skeleton.classes()).toContain('tw-animate-pulse');
      expect(navTabsCalls(wrapper)).toHaveLength(0);
    });

    it('shows a tabs skeleton in the mobile row while Clerk loads', () => {
      isAuthLoaded.value = false;
      isWideRef.value = false;
      const wrapper = mountHeader();
      const skeleton = wrapper.get('[data-testid="header-mobile-tabs"] [aria-hidden="true"]');

      expect(skeleton.classes()).toContain('tw-animate-pulse');
      expect(navTabsCalls(wrapper)).toHaveLength(0);
    });

    it('shows no tabs row on non-dashboard pages below 768', () => {
      routePathRef.value = '/pricing';
      routeNameRef.value = 'pricing';
      isWideRef.value = false;
      expect(mountHeader().find('[data-testid="header-mobile-tabs"]').exists()).toBe(false);
    });
  });

  it('stops the start cluster from stretching from the md breakpoint', () => {
    const classes = mountHeader().get('.header-v2__start').classes();
    expect(classes).toContain('md:tw-flex-none');
    expect(classes).toContain('tw-flex-1');
    expect(classes).not.toContain('lg:tw-flex-none');
  });
});
