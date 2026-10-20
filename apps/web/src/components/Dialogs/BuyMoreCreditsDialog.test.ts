import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import BuyMoreCreditsDialog from '@/components/Dialogs/BuyMoreCreditsDialog.vue';
import { useUserStore } from '@/stores/user';

import { useDialogStore } from '@/stores/dialog';

const startPurchase = vi.fn();

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
  beforeEach(() => {
    setActivePinia(createPinia());
    startPurchase.mockReset();
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

  it('shows the dialog title and a placeholder when a pack has no savings', () => {
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
    expect(wrapper.find('.pkg-savings--empty').exists()).toBe(true);
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
    expect(packages[0].text()).toContain('₹0.65/credit');
    expect(packages[0].text()).toContain('≈ 200 budget images');
    expect(packages[3].text()).toContain('₹0.45/credit');
    expect(packages[3].text()).toContain('≈ 2000 budget images');

    await packages[3].trigger('click');

    expect(packages[0].text()).toContain('₹0.65/credit');
    expect(packages[3].text()).toContain('₹0.45/credit');
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
});
