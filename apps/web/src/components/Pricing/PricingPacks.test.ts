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

vi.mock('@/composables/useFetch', () => ({ useFetch: vi.fn() }));

vi.mock('@/payments/usePurchase', () => ({
  usePurchase: () => ({
    start: (...args: unknown[]) => Reflect.apply(startPurchase, undefined, args),
  }),
}));

// Bound in beforeEach: usePricingCatalog keeps module-level price state, so each
// test needs a fresh module graph to stay order-independent.
let PricingPacks: typeof import('@/components/Pricing/PricingPacks.vue').default;
let useFetch: typeof import('@/composables/useFetch').useFetch;
let useUserStore: typeof import('@/stores/user').useUserStore;

const packs = [...CREDIT_PACKS];

const PACK_200_EUR_MINOR = 250;

function mockPricesResponse(data: unknown, error: unknown = null) {
  vi.mocked(useFetch).mockReturnValue({
    json: async () => ({ data: { value: data }, error: { value: error } }),
  } as unknown as ReturnType<typeof useFetch>);
}

const EUR_PRICES = {
  country: 'DE',
  currency: 'EUR',
  isEstimate: true,
  pro: { amountMinor: 450, currency: 'EUR' },
  packs: [{ id: 'pack_200', amountMinor: PACK_200_EUR_MINOR, currency: 'EUR' }],
};

const stubs = {
  LandingButton: {
    props: ['disabled'],
    template:
      '<button type="button" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
  },
  RouterLink: { template: '<a><slot /></a>' },
};

describe('PricingPacks', () => {
  beforeEach(async () => {
    vi.resetModules();
    PricingPacks = (await import('@/components/Pricing/PricingPacks.vue')).default;
    ({ useFetch } = await import('@/composables/useFetch'));
    ({ useUserStore } = await import('@/stores/user'));
    setActivePinia(createPinia());
    push.mockReset();
    startPurchase.mockReset();
    mockPricesResponse(null, new Error('offline'));
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

  it('shows localized pack prices once /payments/prices resolves', async () => {
    mockPricesResponse(EUR_PRICES);
    const wrapper = mount(PricingPacks, { props: { packs }, global: { stubs } });
    await flushPromises();
    const pack200 = wrapper.findAll('article').find((a) => a.text().includes('200 credits'))!;
    expect(pack200.text()).toContain('€2.50');
    expect(pack200.text()).toContain('€0.01 per credit');
    expect(pack200.text()).not.toContain('₹');
  });
});
