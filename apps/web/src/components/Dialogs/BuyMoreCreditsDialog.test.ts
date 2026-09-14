import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import BuyMoreCreditsDialog from '@/components/Dialogs/BuyMoreCreditsDialog.vue';
import { useUserStore } from '@/stores/user';

import { initiatePayment } from '@/utils/payment';
import { useDialogStore } from '@/stores/dialog';

vi.mock('@/utils/payment', () => ({
  initiatePayment: vi.fn(),
}));

const modalStub = {
  template: `<div><slot /><slot name="actions" /></div>`,
  props: ['open'],
};

describe('BuyMoreCreditsDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(initiatePayment).mockReset();
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
    expect(packages[0].text()).toContain('₹0.82/credit');
    expect(packages[0].text()).toContain('≈ 120 budget images');
    expect(packages[3].text()).toContain('₹0.80/credit');
    expect(packages[3].text()).toContain('≈ 500 budget images');

    await packages[3].trigger('click');

    expect(packages[0].text()).toContain('₹0.82/credit');
    expect(packages[0].text()).toContain('≈ 120 budget images');
    expect(packages[3].text()).toContain('₹0.80/credit');
    expect(packages[3].text()).toContain('≈ 500 budget images');
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

    // Second package should be active now
    expect(packages[0].classes()).not.toContain('buy__pkg--active');
    expect(packages[1].classes()).toContain('buy__pkg--active');
  });

  it('displays trust line about Razorpay', () => {
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

    expect(wrapper.text()).toContain('Secure payment');
    expect(wrapper.text()).toContain('Razorpay');
  });

  it('shows a success balance after purchase and hides the dialog', async () => {
    vi.useFakeTimers();
    vi.mocked(initiatePayment).mockResolvedValueOnce(undefined);
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
    expect(wrapper.text()).toContain('Purchase successful');
    expect(wrapper.text()).toContain('180');

    await vi.advanceTimersByTimeAsync(2000);
    expect(dialogStore.showBuyCreditsDialog).toBe(false);
    vi.useRealTimers();
  });

  it('keeps the pack list when purchase fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(initiatePayment).mockRejectedValueOnce(new Error('gateway down'));
    const userStore = useUserStore();
    userStore.credits = 50;
    userStore.dailyCredits = 10;

    const wrapper = mount(BuyMoreCreditsDialog, {
      global: { stubs: { AppModal: modalStub, 'font-awesome-icon': true } },
    });

    await wrapper.get('.modal-btn--primary').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Secure payment');
    expect(wrapper.text()).not.toContain('Purchase successful');
    errorSpy.mockRestore();
  });
});
