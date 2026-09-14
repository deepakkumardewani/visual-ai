import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/composables/useFetch', () => ({
  useFetch: vi.fn(),
}));

import { useFetch } from '@/composables/useFetch';
import { useAppStore } from '@/stores/app';
import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';
import type { RazorpayProduct } from '@/types';
import { initiatePayment } from '@/utils/payment';

const RAZORPAY_CDN = 'https://checkout.razorpay.com/v1/checkout.js';

const product: RazorpayProduct = {
  id: 1,
  type: 'single',
  credits: 120,
  price: 99,
  description: '120 credits',
  currency: 'INR',
};

class FakeRazorpay {
  static last: FakeRazorpay | undefined;
  options: Record<string, unknown>;
  open = vi.fn();
  on = vi.fn();

  constructor(options: Record<string, unknown>) {
    this.options = options;
    FakeRazorpay.last = this;
  }
}

function mockFetchJson(result: { data: { value: unknown }; error: { value: unknown } }) {
  vi.mocked(useFetch).mockReturnValue({
    json: async () => result,
  } as unknown as ReturnType<typeof useFetch>);
}

function stubSdkAlreadyLoaded() {
  const original = document.querySelector.bind(document);
  vi.spyOn(document, 'querySelector').mockImplementation((selector) => {
    if (selector === `script[src="${RAZORPAY_CDN}"]`) {
      return document.createElement('div');
    }
    return original(selector);
  });
}

describe('initiatePayment', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(useFetch).mockReset();
    FakeRazorpay.last = undefined;
    vi.stubGlobal('Razorpay', FakeRazorpay);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('opens Razorpay after creating an order', async () => {
    stubSdkAlreadyLoaded();
    mockFetchJson({
      data: { value: { amount: 9900, currency: 'INR', id: 'order_1' } },
      error: { value: null },
    });

    const user = useUserStore();
    user.userDetails = {
      userId: 'user_1',
      email: 'a@b.co',
      fullName: 'Ada Lovelace',
    } as never;

    await initiatePayment(product);

    expect(useFetch).toHaveBeenCalledWith(
      '/payments/order/create',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(FakeRazorpay.last?.options).toEqual(
      expect.objectContaining({
        name: 'Visual AI',
        order_id: 'order_1',
        amount: 9900,
        description: '120 credits',
        prefill: { name: 'Ada Lovelace', email: 'a@b.co' },
        notes: { userId: 'user_1', credits: 120 },
      }),
    );
    expect(FakeRazorpay.last?.on).toHaveBeenCalledWith('payment.failed', expect.any(Function));
    expect(FakeRazorpay.last?.open).toHaveBeenCalled();
  });

  it('does not construct checkout when order creation fails', async () => {
    stubSdkAlreadyLoaded();
    mockFetchJson({ data: { value: null }, error: { value: { message: 'fail' } } });

    await initiatePayment(product);

    expect(FakeRazorpay.last).toBeUndefined();
  });

  it('credits the user after a successful verification', async () => {
    stubSdkAlreadyLoaded();
    vi.mocked(useFetch)
      .mockReturnValueOnce({
        json: async () => ({
          data: { value: { amount: 9900, currency: 'INR', id: 'order_1' } },
          error: { value: null },
        }),
      } as never)
      .mockReturnValueOnce({
        json: async () => ({
          data: { value: { ok: true } },
          error: { value: null },
        }),
      } as never);

    const user = useUserStore();
    const dialog = useDialogStore();
    const app = useAppStore();
    user.credits = 10;
    const hideBuyCredits = vi.spyOn(dialog, 'hideBuyCredits');

    await initiatePayment(product);
    const handler = FakeRazorpay.last?.options.handler as (response: unknown) => Promise<void>;
    await handler({ razorpay_payment_id: 'pay_1' });
    await vi.advanceTimersByTimeAsync(700);

    expect(hideBuyCredits).toHaveBeenCalled();
    expect(user.hasJustSubscribed).toBe(true);
    expect(user.credits).toBe(130);
    expect(app.snackbar).toBe(true);
    expect(app.snackbarText).toBe('Payment successful');
  });

  it('does not credit the user when verification fails', async () => {
    stubSdkAlreadyLoaded();
    vi.mocked(useFetch)
      .mockReturnValueOnce({
        json: async () => ({
          data: { value: { amount: 9900, currency: 'INR', id: 'order_1' } },
          error: { value: null },
        }),
      } as never)
      .mockReturnValueOnce({
        json: async () => ({
          data: { value: null },
          error: { value: { message: 'mismatch' } },
        }),
      } as never);

    const user = useUserStore();
    user.credits = 10;

    await initiatePayment(product);
    const handler = FakeRazorpay.last?.options.handler as (response: unknown) => Promise<void>;
    await handler({ razorpay_payment_id: 'pay_1' });
    await vi.advanceTimersByTimeAsync(700);

    expect(user.credits).toBe(10);
  });

  it('swallows SDK load failures without throwing', async () => {
    vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      queueMicrotask(() => (node as HTMLScriptElement).onerror?.(new Event('error')));
      return node;
    });

    await expect(initiatePayment(product)).resolves.toBeUndefined();
  });
});
