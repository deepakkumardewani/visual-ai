import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CREDIT_PACKS } from '@visual-ai/shared';

const push = vi.fn();
const startPurchase = vi.fn();

vi.mock('vue-clerk', () => ({
  useUser: () => ({ user: { value: null } }),
  useAuth: () => ({ isSignedIn: { value: false } }),
}));

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRouter: () => ({ push }),
  };
});

vi.mock('@/payments/usePurchase', () => ({
  usePurchase: () => ({
    start: (...args: unknown[]) => Reflect.apply(startPurchase, undefined, args),
  }),
}));

import PricingPacks from '@/components/Pricing/PricingPacks.vue';
import { useUserStore } from '@/stores/user';

const packs = [...CREDIT_PACKS];

const stubs = {
  LandingButton: {
    props: ['disabled'],
    template:
      '<button type="button" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
  },
  RouterLink: { template: '<a><slot /></a>' },
};

describe('PricingPacks', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    push.mockReset();
    startPurchase.mockReset();
  });

  it('renders credit packs and features the best savings', () => {
    const wrapper = mount(PricingPacks, {
      props: { packs },
      global: { stubs },
    });
    expect(wrapper.text()).toMatch(/200 credits|2000 credits/i);
    expect(wrapper.find('.pack--featured').text()).toContain('2000 credits');
    expect(wrapper.text()).toContain('₹0.45 per credit');
  });

  it('sends signed-out buyers to sign in', async () => {
    const wrapper = mount(PricingPacks, {
      props: { packs },
      global: { stubs },
    });
    await wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Buy this pack'))!
      .trigger('click');
    expect(push).toHaveBeenCalledWith({ name: 'signin', query: { redirect: '/pricing' } });
    expect(startPurchase).not.toHaveBeenCalled();
  });

  it('lists the featured pack first in the grid', () => {
    const wrapper = mount(PricingPacks, {
      props: { packs },
      global: { stubs },
    });
    const articles = wrapper.findAll('article');
    expect(articles[0].classes()).toContain('pack--featured');
    expect(articles[0].text()).toContain('2000 credits');
  });

  it('shows opening checkout while purchase is in flight', async () => {
    let resolvePurchase: (value: string) => void = () => {};
    startPurchase.mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolvePurchase = resolve;
        }),
    );
    const userStore = useUserStore();
    userStore.userDetails = { firstName: 'Ada' } as never;

    const wrapper = mount(PricingPacks, {
      props: { packs },
      global: { stubs },
    });
    const buyButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Buy this pack'))!;
    await buyButton.trigger('click');
    await wrapper.vm.$nextTick();
    expect(buyButton.text()).toBe('Opening checkout…');
    expect(buyButton.attributes('disabled')).toBeDefined();
    resolvePurchase('succeeded');
    await flushPromises();
    expect(buyButton.text()).toBe('Buy this pack');
  });

  it('starts checkout for a signed-in buyer', async () => {
    const userStore = useUserStore();
    userStore.userDetails = { firstName: 'Ada' } as never;
    startPurchase.mockResolvedValue('succeeded');

    const wrapper = mount(PricingPacks, {
      props: { packs },
      global: { stubs },
    });
    await wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Buy this pack'))!
      .trigger('click');
    await flushPromises();
    expect(startPurchase).toHaveBeenCalledWith('pack_2000');
  });
});
