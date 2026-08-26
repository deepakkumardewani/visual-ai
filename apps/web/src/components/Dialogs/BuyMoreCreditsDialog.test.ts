import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import BuyMoreCreditsDialog from '@/components/Dialogs/BuyMoreCreditsDialog.vue';
import { useUserStore } from '@/stores/user';

vi.mock('@/utils/payment', () => ({
  initiatePayment: vi.fn(),
}));

describe('BuyMoreCreditsDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders dialog with current balance display', () => {
    const userStore = useUserStore();
    userStore.credits = 100;
    userStore.dailyCredits = 20;

    const wrapper = mount(BuyMoreCreditsDialog, {
      global: {
        stubs: {
          AppModal: {
            template: `<div><slot /></div>`,
            props: ['open'],
          },
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
          AppModal: {
            template: `<div><slot /></div>`,
            props: ['open'],
          },
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
          AppModal: {
            template: `<div><slot /></div>`,
            props: ['open'],
          },
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
          AppModal: {
            template: `<div><slot /></div>`,
            props: ['open'],
          },
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
          AppModal: {
            template: `<div><slot /></div>`,
            props: ['open'],
          },
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
          AppModal: {
            template: `<div><slot /></div>`,
            props: ['open'],
          },
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
          AppModal: {
            template: `<div><slot /></div>`,
            props: ['open'],
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Secure payment');
    expect(wrapper.text()).toContain('Razorpay');
  });
});
