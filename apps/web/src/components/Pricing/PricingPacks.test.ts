import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.fn();
const initiatePayment = vi.fn();

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

vi.mock('@/utils/payment', () => ({
  initiatePayment: (...args: unknown[]) => initiatePayment(...args),
}));

import PricingPacks from '@/components/Pricing/PricingPacks.vue';
import { useUserStore } from '@/stores/user';

const packs = [
  {
    id: 1,
    name: 'Starter',
    credits: 100,
    price: 99,
    savings: '0%',
  },
  {
    id: 2,
    name: 'Studio',
    credits: 500,
    price: 399,
    savings: '20%',
  },
] as never;

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
    initiatePayment.mockReset();
  });

  it('renders credit packs and features the best savings', () => {
    const wrapper = mount(PricingPacks, {
      props: { packs },
      global: { stubs },
    });
    expect(wrapper.text()).toMatch(/Starter|Studio|credit/i);
    expect(wrapper.find('.pack--featured').text()).toContain('500 credits');
    expect(wrapper.text()).toContain('₹0.80 per credit');
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
    expect(initiatePayment).not.toHaveBeenCalled();
  });

  it('starts checkout for a signed-in buyer', async () => {
    const userStore = useUserStore();
    userStore.userDetails = { firstName: 'Ada' } as never;
    initiatePayment.mockResolvedValue(undefined);

    const wrapper = mount(PricingPacks, {
      props: { packs },
      global: { stubs },
    });
    await wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Buy this pack'))!
      .trigger('click');
    await flushPromises();
    expect(initiatePayment).toHaveBeenCalled();
  });
});
