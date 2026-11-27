import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it, beforeEach, vi } from 'vitest';

// Bound in beforeEach: usePricingCatalog keeps module-level price state, so each
// test needs a fresh module graph to stay order-independent.
let BuyMoreCreditsDialog: typeof import('@/components/Dialogs/BuyMoreCreditsDialog.vue').default;
let useFetch: typeof import('@/composables/useFetch').useFetch;
let useUserStore: typeof import('@/stores/user').useUserStore;
let useDialogStore: typeof import('@/stores/dialog').useDialogStore;

vi.mock('@/composables/useFetch', () => ({ useFetch: vi.fn() }));

const startPurchase = vi.fn();

function mockPricesResponse(data: unknown, error: unknown = null) {
  vi.mocked(useFetch).mockReturnValue({
    json: async () => ({ data: { value: data }, error: { value: error } }),
  } as unknown as ReturnType<typeof useFetch>);
}

const INR_PRICES = {
  country: 'IN',
  currency: 'INR',
  pro: { amountMinor: 500, currency: 'USD' },
  packs: [],
};

vi.mock('@/payments/usePurchase', () => ({
  usePurchase: () => ({
    start: (...args: unknown[]) => Reflect.apply(startPurchase, undefined, args),
  }),
}));

const modalStub = {
  template: `<div><slot name="title" /><slot /><slot name="actions" /></div>`,
  props: ['open'],
};

describe('BuyMoreCreditsDialog', () => {
  beforeEach(async () => {
    vi.resetModules();
    BuyMoreCreditsDialog = (await import('@/components/Dialogs/BuyMoreCreditsDialog.vue')).default;
    ({ useFetch } = await import('@/composables/useFetch'));
    ({ useUserStore } = await import('@/stores/user'));
    ({ useDialogStore } = await import('@/stores/dialog'));
    setActivePinia(createPinia());
    startPurchase.mockReset();
    mockPricesResponse(null, new Error('offline'));
  });

  it('renders dialog with current balance display', () => {
    const userStore = useUserStore();
    userStore.credits = 100;
    userStore.dailyCredits = 20;

    const wrapper = mount(BuyMoreCreditsDialog, {
      global: {
        stubs: {
          AppModal: modalStub,
          'font-awesome-icon': true,
        },
      },
    });

    expect(wrapper.text()).toContain('100');
    expect(wrapper.text()).toContain('20');
    expect(wrapper.text()).toContain('120'); // total
  });

  it('shows the dialog title and no empty placeholder when a pack has no savings', () => {
    const userStore = useUserStore();
    userStore.credits = 50;
    userStore.dailyCredits = 10;

    const wrapper = mount(BuyMoreCreditsDialog, {
      global: {
        stubs: {
          AppModal: modalStub,
          'font-awesome-icon': true,
        },
      },
    });

    expect(wrapper.text()).toContain('Buy more credits');
    expect(wrapper.find('.pkg-savings--empty').exists()).toBe(false);
  });

  it('shows the Upgrade to Pro link for Free users and opens pricing from it', async () => {
    const userStore = useUserStore();
    userStore.plan = 'free';
    const dialogStore = useDialogStore();
    const hideSpy = vi.spyOn(dialogStore, 'hideBuyCredits');
    const pricingSpy = vi.spyOn(dialogStore, 'showPricing');

    const wrapper = mount(BuyMoreCreditsDialog, {
      global: { stubs: { AppModal: modalStub, 'font-awesome-icon': true } },
    });

    const link = wrapper.get('[data-testid="buy-credits-upgrade-link"]');
    expect(link.text()).toBe('Upgrade to Pro');
    await link.trigger('click');
    expect(hideSpy).toHaveBeenCalledTimes(1);
    expect(pricingSpy).toHaveBeenCalledTimes(1);
  });

  it('hides the Upgrade to Pro link for Pro users', () => {
    const userStore = useUserStore();
    userStore.plan = 'pro';

    const wrapper = mount(BuyMoreCreditsDialog, {
      global: { stubs: { AppModal: modalStub, 'font-awesome-icon': true } },
    });

    expect(wrapper.find('[data-testid="buy-credits-upgrade-link"]').exists()).toBe(false);
  });

  it('displays all four credit packages', () => {
    const userStore = useUserStore();
    userStore.credits = 50;
    userStore.dailyCredits = 10;

    const wrapper = mount(BuyMoreCreditsDialog, {
      global: {
        stubs: {
          AppModal: modalStub,
          'font-awesome-icon': true,
        },
      },
    });

    const packages = wrapper.findAll('.buy__pkg');
    expect(packages).toHaveLength(4);
  });

  it('shows per-pack rate and image estimate, independent of selection', async () => {
    const userStore = useUserStore();
    userStore.credits = 50;
    userStore.dailyCredits = 10;

    const wrapper = mount(BuyMoreCreditsDialog, {
      global: {
        stubs: {
          AppModal: modalStub,
          'font-awesome-icon': true,
        },
      },
    });

    const packages = wrapper.findAll('.buy__pkg');
    expect(packages[0].text()).toContain('$1.67 per 100 credits');
    expect(packages[0].text()).toContain('≈ 300 images at 1 credit / 10 at 30 credits');
    expect(packages[3].text()).toContain('$1.11 per 100 credits');
    expect(packages[3].text()).toContain('≈ 4500 images at 1 credit / 150 at 30 credits');

    await packages[3].trigger('click');

    expect(packages[0].text()).toContain('$1.67 per 100 credits');
    expect(packages[3].text()).toContain('$1.11 per 100 credits');
  });

  it('shows USD savings computed against the smallest pack', () => {
    const wrapper = mount(BuyMoreCreditsDialog, {
      global: { stubs: { AppModal: modalStub, 'font-awesome-icon': true } },
    });

    const savings = wrapper.findAll('.buy__pkg').map((pkg) => pkg.find('.pkg-savings'));
    expect(savings[0].exists()).toBe(false);
    expect(savings.slice(1).map((badge) => badge.text())).toEqual([
      'Save 14%',
      'Save 25%',
      'Save 33%',
    ]);
  });

  it('highlights most popular package', () => {
    const userStore = useUserStore();
    userStore.credits = 50;
    userStore.dailyCredits = 10;

    const wrapper = mount(BuyMoreCreditsDialog, {
      global: {
        stubs: {
          AppModal: modalStub,
          'font-awesome-icon': true,
        },
      },
    });

    const packages = wrapper.findAll('.buy__pkg');
    const popularPackage = wrapper.find('.buy__pkg--popular');
    expect(wrapper.findAll('.buy__pkg--popular')).toHaveLength(1);
    expect(packages[2].classes()).toContain('buy__pkg--popular');
    expect(popularPackage.text()).toContain('Most popular');
    // The popular pack is the default pick.
    expect(popularPackage.classes()).toContain('buy__pkg--active');
  });

  it('changes selected package on click', async () => {
    const userStore = useUserStore();
    userStore.credits = 50;
    userStore.dailyCredits = 10;

    const wrapper = mount(BuyMoreCreditsDialog, {
      global: {
        stubs: {
          AppModal: modalStub,
          'font-awesome-icon': true,
        },
      },
    });

    const packages = wrapper.findAll('.buy__pkg');
    await packages[1].trigger('click');

    expect(packages[0].classes()).not.toContain('buy__pkg--active');
    expect(packages[1].classes()).toContain('buy__pkg--active');
  });

  it('displays trust line about Dodo Payments', () => {
    const userStore = useUserStore();
    userStore.credits = 50;
    userStore.dailyCredits = 10;

    const wrapper = mount(BuyMoreCreditsDialog, {
      global: {
        stubs: {
          AppModal: modalStub,
          'font-awesome-icon': true,
        },
      },
    });

    expect(wrapper.text()).toContain('Secure payment via Dodo Payments');
    expect(wrapper.text()).toContain('after payment confirmation');
  });

  it('shows a success balance after purchase and hides the dialog', async () => {
    vi.useFakeTimers();
    startPurchase.mockResolvedValueOnce('succeeded');
    const userStore = useUserStore();
    userStore.credits = 50;
    userStore.dailyCredits = 10;
    const dialogStore = useDialogStore();
    dialogStore.showBuyCredits();

    const wrapper = mount(BuyMoreCreditsDialog, {
      global: { stubs: { AppModal: modalStub, 'font-awesome-icon': true } },
    });

    await wrapper.get('.modal-btn--primary').trigger('click');
    await wrapper.vm.$nextTick();
    expect(startPurchase).toHaveBeenCalledWith('pack_1600');
    expect(wrapper.text()).toContain('Purchase successful');
    expect(wrapper.text()).toContain('60');

    await vi.advanceTimersByTimeAsync(2000);
    expect(dialogStore.showBuyCreditsDialog).toBe(false);
    vi.useRealTimers();
  });

  it('logs and keeps the pack list when checkout throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    startPurchase.mockRejectedValueOnce(new Error('checkout unavailable'));
    const userStore = useUserStore();
    userStore.credits = 50;
    userStore.dailyCredits = 10;

    const wrapper = mount(BuyMoreCreditsDialog, {
      global: { stubs: { AppModal: modalStub, 'font-awesome-icon': true } },
    });

    await wrapper.get('.modal-btn--primary').trigger('click');
    await wrapper.vm.$nextTick();
    expect(errorSpy).toHaveBeenCalledWith('Purchase failed:', expect.any(Error));
    expect(wrapper.text()).toContain('Dodo Payments');
    errorSpy.mockRestore();
  });

  it('keeps the pack list when purchase fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(async () => {});
    startPurchase.mockResolvedValueOnce('failed');
    const userStore = useUserStore();
    userStore.credits = 50;
    userStore.dailyCredits = 10;

    const wrapper = mount(BuyMoreCreditsDialog, {
      global: { stubs: { AppModal: modalStub, 'font-awesome-icon': true } },
    });

    await wrapper.get('.modal-btn--primary').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Dodo Payments');
    expect(wrapper.text()).not.toContain('Purchase successful');
    errorSpy.mockRestore();
  });

  it('shows INR prices and INR savings when the server resolves India', async () => {
    mockPricesResponse(INR_PRICES);
    const wrapper = mount(BuyMoreCreditsDialog, {
      global: { stubs: { AppModal: modalStub, 'font-awesome-icon': true } },
    });
    await flushPromises();
    const packages = wrapper.findAll('.buy__pkg');
    expect(packages[0].text()).toMatch(/₹\s?249/);
    expect(packages[0].text()).not.toContain('$');
    expect(packages[3].find('.pkg-savings').text()).toBe('Save 19%');
  });
});
