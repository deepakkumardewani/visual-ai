import { PLAN } from '@visual-ai/shared';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const isMobileRef = ref(false);
const isTabletRef = ref(false);

vi.mock('@/composables/useHeaderBreakpoint', () => ({
  useHeaderBreakpoint: () => ({ isMobile: isMobileRef, isTablet: isTabletRef }),
}));

vi.mock('@/components/Header/ReferralOffer.vue', () => ({
  default: {
    props: ['iconOnly'],
    template: '<button data-testid="earn" :data-icon-only="String(iconOnly)">Earn</button>',
  },
}));

vi.mock('@/components/Header/CreditsChip.vue', () => ({
  default: { template: '<div data-testid="credits" />' },
}));

vi.mock('@/components/Header/UserMenu.vue', () => ({
  default: { template: '<div data-testid="avatar" />' },
}));

import HeaderActions from '@/components/Header/HeaderActions.vue';
import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

const UPGRADE = '[data-testid="upgrade-button"]';

function setViewport(tier: 'desktop' | 'tablet' | 'mobile') {
  isMobileRef.value = tier === 'mobile';
  isTabletRef.value = tier === 'tablet';
}

function mountActions(options: { plan?: string; ready?: boolean } = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const userStore = useUserStore();
  userStore.isReady = options.ready ?? true;
  userStore.plan = (options.plan ?? PLAN.FREE) as typeof userStore.plan;
  return mount(HeaderActions, {
    attachTo: document.body,
    global: {
      plugins: [pinia],
      stubs: { 'font-awesome-icon': true },
    },
  });
}

describe('HeaderActions', () => {
  beforeEach(() => {
    setViewport('desktop');
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('orders Earn, Upgrade, credits, avatar for a Free user on desktop', () => {
    const wrapper = mountActions();
    const order = Array.from(document.body.querySelectorAll('[data-testid]')).map((el) =>
      el.getAttribute('data-testid'),
    );

    expect(order).toEqual(['earn', 'upgrade-button', 'credits', 'avatar']);
    wrapper.unmount();
  });

  it('shows a labelled Upgrade button on desktop and opens pricing on click', async () => {
    const wrapper = mountActions();
    const button = wrapper.get(UPGRADE);

    expect(button.text()).toBe('Upgrade to Pro');
    expect(button.attributes('aria-label')).toBe('Upgrade to Pro');
    expect(wrapper.get('[data-testid="earn"]').attributes('data-icon-only')).toBe('false');

    await button.trigger('click');
    expect(useDialogStore().showPricingDialog).toBe(true);
    wrapper.unmount();
  });

  it('renders Earn icon-only and Upgrade icon-only on tablet', () => {
    setViewport('tablet');
    const wrapper = mountActions();
    const button = wrapper.get(UPGRADE);

    expect(wrapper.get('[data-testid="earn"]').attributes('data-icon-only')).toBe('true');
    expect(button.text()).toBe('');
    expect(button.attributes('aria-label')).toBe('Upgrade to Pro');
    wrapper.unmount();
  });

  it('omits Earn below 768 but keeps an icon-only Upgrade', async () => {
    setViewport('mobile');
    const wrapper = mountActions();

    expect(wrapper.find('[data-testid="earn"]').exists()).toBe(false);
    expect(wrapper.get(UPGRADE).text()).toBe('');

    await wrapper.get(UPGRADE).trigger('click');
    expect(useDialogStore().showPricingDialog).toBe(true);
    wrapper.unmount();
  });

  it('shows a tooltip with the label when hovering the icon-only Upgrade button', async () => {
    vi.useFakeTimers();
    setViewport('tablet');
    const wrapper = mountActions();

    await wrapper.get(UPGRADE).element.parentElement!.dispatchEvent(new MouseEvent('mouseenter'));
    await vi.advanceTimersByTimeAsync(300);

    expect(document.body.querySelector('[role="tooltip"]')?.textContent?.trim()).toBe(
      'Upgrade to Pro',
    );
    wrapper.unmount();
  });

  it('has no Upgrade button for a Pro user but keeps the rest in order', () => {
    const wrapper = mountActions({ plan: PLAN.PRO });
    const order = Array.from(document.body.querySelectorAll('[data-testid]')).map((el) =>
      el.getAttribute('data-testid'),
    );

    expect(order).toEqual(['earn', 'credits', 'avatar']);
    wrapper.unmount();
  });

  it('hides Upgrade while the user is not ready', () => {
    const wrapper = mountActions({ ready: false });

    expect(wrapper.find(UPGRADE).exists()).toBe(false);
    expect(wrapper.find('[data-testid="credits"]').exists()).toBe(true);
    wrapper.unmount();
  });
});
