import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createCheckoutSession: vi.fn(),
  fetchCheckoutStatus: vi.fn(),
  openDodoCheckout: vi.fn(),
}));

vi.mock('./checkoutClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./checkoutClient')>();
  return {
    ...actual,
    createCheckoutSession: mocks.createCheckoutSession,
    fetchCheckoutStatus: mocks.fetchCheckoutStatus,
  };
});

vi.mock('./dodoOverlay', () => ({
  openDodoCheckout: mocks.openDodoCheckout,
}));

const { createCheckoutSession, fetchCheckoutStatus, openDodoCheckout } = mocks;

import { CheckoutClientError } from './checkoutClient';
import { PAYMENT_POLL_INTERVAL_MS, PAYMENT_POLL_TIMEOUT_MS, PAYMENT_TOAST } from './constants';
import { usePurchase } from './usePurchase';
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';

describe('usePurchase', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    createCheckoutSession.mockReset();
    fetchCheckoutStatus.mockReset();
    openDodoCheckout.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('refetches the user and shows success toast without mutating credits locally', async () => {
    createCheckoutSession.mockResolvedValue({
      checkoutUrl: 'https://checkout.example/s',
      sessionId: 'sess_ok',
    });
    openDodoCheckout.mockResolvedValue('closed');
    fetchCheckoutStatus.mockResolvedValue({ status: 'succeeded' });

    const userStore = useUserStore();
    userStore.userId = 'user_1';
    userStore.credits = 40;
    const getUserDetails = vi.spyOn(userStore, 'getUserDetails').mockResolvedValue(undefined);

    const { start } = usePurchase();
    const outcomePromise = start('pack_200');

    await vi.runAllTimersAsync();
    const outcome = await outcomePromise;

    expect(outcome).toBe('succeeded');
    expect(getUserDetails).toHaveBeenCalledTimes(1);
    expect(userStore.credits).toBe(40);

    const appStore = useAppStore();
    expect(appStore.snackbar).toBe(true);
    expect(appStore.snackbarText).toBe(PAYMENT_TOAST.SUCCESS);
  });

  it('shows failed toast when polling reaches a failed status', async () => {
    createCheckoutSession.mockResolvedValue({
      checkoutUrl: 'https://checkout.example/s',
      sessionId: 'sess_fail',
    });
    openDodoCheckout.mockResolvedValue('status');
    fetchCheckoutStatus.mockResolvedValue({ status: 'failed' });

    const { start } = usePurchase();
    const outcome = await start('pack_200');

    expect(outcome).toBe('failed');
    const appStore = useAppStore();
    expect(appStore.snackbarText).toBe(PAYMENT_TOAST.FAILED);
  });

  it('shows processing toast when polling times out', async () => {
    createCheckoutSession.mockResolvedValue({
      checkoutUrl: 'https://checkout.example/s',
      sessionId: 'sess_wait',
    });
    openDodoCheckout.mockResolvedValue('closed');
    fetchCheckoutStatus.mockResolvedValue({ status: 'pending' });

    const { start } = usePurchase();
    const outcomePromise = start('pack_200');

    await vi.advanceTimersByTimeAsync(PAYMENT_POLL_TIMEOUT_MS + PAYMENT_POLL_INTERVAL_MS);
    const outcome = await outcomePromise;

    expect(outcome).toBe('timeout');
    const appStore = useAppStore();
    expect(appStore.snackbarText).toBe(PAYMENT_TOAST.PROCESSING);
    expect(fetchCheckoutStatus.mock.calls.length).toBeGreaterThan(1);
  });

  it('shows checkout unavailable toast on CheckoutClientError', async () => {
    createCheckoutSession.mockRejectedValue(new CheckoutClientError('Could not start checkout'));

    const { start } = usePurchase();
    const outcome = await start('pack_200');

    expect(outcome).toBe('failed');
    expect(openDodoCheckout).not.toHaveBeenCalled();
    const appStore = useAppStore();
    expect(appStore.snackbarText).toBe(PAYMENT_TOAST.CHECKOUT_UNAVAILABLE);
  });

  it('returns failed without a toast for unexpected errors', async () => {
    createCheckoutSession.mockRejectedValue(new Error('unexpected'));

    const appStore = useAppStore();
    appStore.snackbarText = 'unchanged';

    const { start } = usePurchase();
    const outcome = await start('pack_200');

    expect(outcome).toBe('failed');
    expect(appStore.snackbarText).toBe('unchanged');
  });

  it('returns cancelled when a purchase is already in progress', async () => {
    createCheckoutSession.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                checkoutUrl: 'https://checkout.example/s',
                sessionId: 'sess_slow',
              }),
            5000,
          );
        }),
    );
    openDodoCheckout.mockResolvedValue('closed');
    fetchCheckoutStatus.mockResolvedValue({ status: 'succeeded' });

    const purchase = usePurchase();
    const first = purchase.start('pack_200');
    const second = await purchase.start('pack_200');

    expect(second).toBe('cancelled');
    expect(createCheckoutSession).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(5000);
    await vi.runAllTimersAsync();
    await first;
  });
});
