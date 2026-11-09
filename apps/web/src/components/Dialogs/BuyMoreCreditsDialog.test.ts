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
    expect(packages[0].text()).toContain('₹65.00 per 100 credits');
    expect(packages[0].text()).toContain('≈ 200 images at 1 credit / 40 at 5 credits');
    expect(packages[3].text()).toContain('₹45.00 per 100 credits');
    expect(packages[3].text()).toContain('≈ 2000 images at 1 credit / 400 at 5 credits');

    await packages[3].trigger('click');

    expect(packages[0].text()).toContain('₹65.00 per 100 credits');
    expect(packages[3].text()).toContain('₹45.00 per 100 credits');
  });

  it('highlights best value package', () => {
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

    const bestValuePackage = wrapper.find('.buy__pkg--best-value');
    expect(bestValuePackage.exists()).toBe(true);
    expect(bestValuePackage.text()).toContain('Best value');
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

    const popularPackage = wrapper.find('.buy__pkg--popular');
    expect(popularPackage.exists()).toBe(true);
    expect(popularPackage.text()).toContain('Most popular');
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
    expect(startPurchase).toHaveBeenCalledWith('pack_200');
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

  it('shows localized pack prices once /payments/prices resolves', async () => {
    mockPricesResponse(EUR_PRICES);
    const wrapper = mount(BuyMoreCreditsDialog, {
      global: { stubs: { AppModal: modalStub, 'font-awesome-icon': true } },
    });
    await flushPromises();
    const pack200 = wrapper.findAll('.buy__pkg')[0];
    expect(pack200.text()).toContain('€2.50');
    expect(pack200.text()).not.toContain('₹');
  });
});
