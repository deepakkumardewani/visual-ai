import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Payments from '@/components/Profile/Payments.vue';
import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRouter: () => ({ push: vi.fn() }),
  };
});

describe('Payments', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the loading skeleton before the store is ready', () => {
    const wrapper = mount(Payments);
    expect(wrapper.get('[role="status"]').exists()).toBe(true);
  });

  it('shows an empty state and opens the buy-credits dialog', async () => {
    const store = useUserStore();
    store.isReady = true;
    store.payments = [];
    const dialogStore = useDialogStore();

    const wrapper = mount(Payments, {
      global: {
        stubs: {
          LandingButton: {
            template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('No receipts yet');
    await wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Buy credits'))!
      .trigger('click');
    expect(dialogStore.showBuyCreditsDialog).toBe(true);
  });

  it('renders paid, failed, and pending receipt rows', () => {
    const store = useUserStore();
    store.isReady = true;
    store.payments = [
      {
        transactionId: '1',
        humanReadableDate: '1 Jan 2026',
        amount: 99,
        status: 'paid',
        paymentMethod: 'card',
        description: 'Starter pack',
      },
      {
        transactionId: '2',
        humanReadableDate: '2 Jan 2026',
        amount: 199,
        status: 'failed',
        paymentMethod: '',
        description: 'Studio pack',
      },
      {
        transactionId: '3',
        humanReadableDate: '3 Jan 2026',
        amount: 49.5,
        status: 'pending',
        paymentMethod: 'upi',
        description: 'Trial',
      },
    ] as never;

    const wrapper = mount(Payments);
    expect(wrapper.text()).toContain('₹99.00');
    expect(wrapper.text()).toContain('Starter pack');
    expect(wrapper.get('.status--ok').text()).toBe('paid');
    expect(wrapper.get('.status--bad').text()).toBe('failed');
    expect(wrapper.text()).toContain('—');
    expect(wrapper.text()).toContain('pending');
  });
});
