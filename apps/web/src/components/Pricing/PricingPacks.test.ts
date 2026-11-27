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

function mockPricesResponse(data: unknown, error: unknown = null) {
  vi.mocked(useFetch).mockReturnValue({
    json: async () => ({ data: { value: data }, error: { value: error } }),
  } as unknown as ReturnType<typeof useFetch>);
}

const INR_PRICES = {
  country: 'IN',
  currency: 'INR',
  pro: { amountMinor: 500, currency: 'USD' },
  packs: CREDIT_PACKS.map((pack) => ({
    id: pack.id,
    amountMinor: pack.prices.INR,
    currency: 'INR',
  })),
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

  it('renders the four packs in USD with per-currency savings', () => {
    const wrapper = mount(PricingPacks, {
      props: { packs },
      global: { stubs },
    });
    const articles = wrapper.findAll('article');
    expect(articles).toHaveLength(4);
    expect(articles[0].text()).toContain('$5.00');
    expect(articles[0].text()).not.toContain('Save');
    expect(articles[1].text()).toContain('Save 14%');
    expect(articles[2].text()).toContain('Save 25%');
    expect(articles[3].text()).toContain('Save 33%');
    expect(wrapper.text()).toContain('$1.25 per 100 credits');
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
    expect(push).toHaveBeenCalledWith({
      name: 'signin',
      query: { redirect: '/pricing' },
    });
    expect(startPurchase).not.toHaveBeenCalled();
  });

  it('keeps natural order and emphasises the popular third pack', () => {
    const wrapper = mount(PricingPacks, {
      props: { packs },
      global: { stubs },
    });
    const articles = wrapper.findAll('article');
    expect(articles.map((article) => article.attributes('data-testid'))).toEqual(
      CREDIT_PACKS.map((pack) => `pack-${pack.id}`),
    );
    expect(articles[2].classes()).toContain('pack--popular');
    expect(articles[2].text()).toContain('Most popular');
    expect(wrapper.findAll('.pack--popular')).toHaveLength(1);
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
    await wrapper.get('[data-testid="pack-pack_1600"] button').trigger('click');
    await flushPromises();
    expect(startPurchase).toHaveBeenCalledWith('pack_1600');
  });

  it('shows INR prices and INR savings when the server resolves India', async () => {
    mockPricesResponse(INR_PRICES);
    const wrapper = mount(PricingPacks, {
      props: { packs },
      global: { stubs },
    });
    await flushPromises();
    const articles = wrapper.findAll('article');
    expect(articles[0].text()).toMatch(/₹\s?249/);
    expect(articles[0].text()).not.toContain('$');
    expect(articles[1].text()).toContain('Save 5%');
    expect(articles[2].text()).toContain('Save 13%');
    expect(articles[3].text()).toContain('Save 19%');
  });
});
