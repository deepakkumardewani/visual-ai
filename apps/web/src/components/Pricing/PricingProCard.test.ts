import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PricingProCard from '@/components/Pricing/PricingProCard.vue';
import { PAYMENT_TOAST } from '@/payments/constants';
import { useUserStore } from '@/stores/user';
import type { IUser } from '@/types';
import { HISTORY_CAP, MODEL_REGISTRY, PLAN, PREMIUM_MODEL_KEYS } from '@visual-ai/shared';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  subscribe: vi.fn(),
  loadPrices: vi.fn(),
}));
const isPurchasing = ref(false);
const proPrice = ref('$5.00');

vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/composables/usePricingCatalog', () => ({
  usePricingCatalog: () => ({ proPrice, loadPrices: mocks.loadPrices }),
}));
vi.mock('@/payments/usePurchase', () => ({
  usePurchase: () => ({ subscribe: mocks.subscribe, isPurchasing }),
}));

const LandingButton = {
  props: ['disabled'],
  emits: ['click'],
  template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
};
const mountCard = () => mount(PricingProCard, { global: { stubs: { LandingButton } } });
const signIn = () => {
  useUserStore().userDetails = { id: 'u1' } as unknown as IUser;
};

describe('PricingProCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    Object.values(mocks).forEach((m) => m.mockReset());
    isPurchasing.value = false;
    proPrice.value = '$5.00';
    mocks.loadPrices.mockResolvedValue(undefined);
  });

  it('loads prices on mount and shows the price and history perk', () => {
    const wrapper = mountCard();
    expect(mocks.loadPrices).toHaveBeenCalledTimes(1);
    expect(wrapper.get('[data-testid="pro-price"]').text()).toBe('$5.00');
    expect(wrapper.text()).toContain(`${HISTORY_CAP[PLAN.PRO]} images`);
    expect(wrapper.find('[data-testid="pro-price-note"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Approx. price');
    for (const key of PREMIUM_MODEL_KEYS)
      expect(wrapper.text()).toContain(MODEL_REGISTRY[key].label);
  });

  it('redirects a signed-out visitor to sign in without subscribing', async () => {
    const wrapper = mountCard();
    await wrapper.get('[data-testid="pro-subscribe"]').trigger('click');
    expect(mocks.push).toHaveBeenCalledWith({
      name: 'signin',
      query: { redirect: '/pricing' },
    });
    expect(mocks.subscribe).not.toHaveBeenCalled();
  });

  it('subscribes a signed-in free user and shows no status on success', async () => {
    signIn();
    mocks.subscribe.mockResolvedValue('succeeded');
    const wrapper = mountCard();
    await wrapper.get('[data-testid="pro-subscribe"]').trigger('click');
    await flushPromises();
    expect(mocks.subscribe).toHaveBeenCalledTimes(1);
    expect(wrapper.find('[data-testid="pro-status"]').exists()).toBe(false);
  });

  it('shows the already-Pro message on a 409 outcome', async () => {
    signIn();
    mocks.subscribe.mockResolvedValue('already_pro');
    const wrapper = mountCard();
    await wrapper.get('[data-testid="pro-subscribe"]').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-testid="pro-status"]').text()).toBe(PAYMENT_TOAST.ALREADY_PRO);
  });

  it('clears a previous status when upgrading again', async () => {
    signIn();
    mocks.subscribe.mockResolvedValueOnce('already_pro').mockResolvedValueOnce('succeeded');
    const wrapper = mountCard();
    await wrapper.get('[data-testid="pro-subscribe"]').trigger('click');
    await flushPromises();
    await wrapper.get('[data-testid="pro-subscribe"]').trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="pro-status"]').exists()).toBe(false);
  });

  it('disables the button and says "You\'re on Pro" for a Pro user', () => {
    useUserStore().plan = PLAN.PRO;
    const button = mountCard().get('[data-testid="pro-subscribe"]');
    expect(button.attributes('disabled')).toBeDefined();
    expect(button.text()).toBe("You're on Pro");
  });

  it('disables the button while checkout is opening', () => {
    isPurchasing.value = true;
    const button = mountCard().get('[data-testid="pro-subscribe"]');
    expect(button.attributes('disabled')).toBeDefined();
    expect(button.text()).toContain('Opening checkout');
  });

  it('shows the default CTA label for a free user', () => {
    expect(mountCard().get('[data-testid="pro-subscribe"]').text()).toBe('Upgrade to Pro');
  });
});

describe('PricingProCard premium perks', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mocks.loadPrices.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.doUnmock('@visual-ai/shared');
    vi.resetModules();
  });

  it('lists exactly the models in a changed PREMIUM_MODEL_KEYS', async () => {
    const [first, second] = Object.keys(MODEL_REGISTRY) as (keyof typeof MODEL_REGISTRY)[];
    vi.resetModules();
    vi.doMock('@visual-ai/shared', async (importOriginal) => ({
      ...(await importOriginal<typeof import('@visual-ai/shared')>()),
      PREMIUM_MODEL_KEYS: [first],
    }));
    const { default: Card } = await import('@/components/Pricing/PricingProCard.vue');
    const wrapper = mount(Card, { global: { stubs: { LandingButton } } });
    const text = wrapper.text();
    expect(text).toContain(`Premium models: ${MODEL_REGISTRY[first].label}`);
    expect(text).not.toContain(MODEL_REGISTRY[second].label);
  });
});
