import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => {
  let onEvent: ((event: { event_type: string }) => void) | undefined;
  return {
    Initialize: vi.fn((opts: { onEvent: (event: { event_type: string }) => void }) => {
      onEvent = opts.onEvent;
    }),
    Checkout: {
      open: vi.fn(),
    },
    emit(event: { event_type: string }) {
      onEvent?.(event);
    },
    reset() {
      onEvent = undefined;
      sdk.Initialize.mockClear();
      sdk.Checkout.open.mockClear();
    },
  };
});

vi.mock('dodopayments-checkout', () => ({
  DodoPayments: sdk,
}));

describe('dodoOverlay', () => {
  beforeEach(async () => {
    vi.resetModules();
    sdk.reset();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function loadOverlay() {
    return import('./dodoOverlay');
  }

  it('initializes the SDK once and opens checkout with the url', async () => {
    const { initDodoOverlay, openDodoCheckout } = await loadOverlay();

    initDodoOverlay();
    initDodoOverlay();

    expect(sdk.Initialize).toHaveBeenCalledTimes(1);
    expect(sdk.Initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        displayType: 'overlay',
        mode: 'test',
      }),
    );

    const closePromise = openDodoCheckout('https://checkout.example/session');
    expect(sdk.Checkout.open).toHaveBeenCalledWith({
      checkoutUrl: 'https://checkout.example/session',
    });

    sdk.emit({ event_type: 'checkout.closed' });
    await expect(closePromise).resolves.toBe('closed');
  });

  it('reuses initialization when opening checkout again', async () => {
    const { openDodoCheckout } = await loadOverlay();

    const first = openDodoCheckout('https://checkout.example/a');
    sdk.emit({ event_type: 'checkout.status' });
    await first;

    const second = openDodoCheckout('https://checkout.example/b');
    sdk.emit({ event_type: 'checkout.error' });
    await second;

    expect(sdk.Initialize).toHaveBeenCalledTimes(1);
    expect(sdk.Checkout.open).toHaveBeenCalledTimes(2);
  });

  it('resolves status and error overlay events', async () => {
    const { openDodoCheckout } = await loadOverlay();

    const statusPromise = openDodoCheckout('https://checkout.example/s');
    sdk.emit({ event_type: 'checkout.status' });
    await expect(statusPromise).resolves.toBe('status');

    const errorPromise = openDodoCheckout('https://checkout.example/e');
    sdk.emit({ event_type: 'checkout.error' });
    await expect(errorPromise).resolves.toBe('error');
  });

  it('uses live mode when VITE_DODO_CHECKOUT_MODE is live', async () => {
    vi.stubEnv('VITE_DODO_CHECKOUT_MODE', 'live');
    const { initDodoOverlay } = await loadOverlay();

    initDodoOverlay();

    expect(sdk.Initialize).toHaveBeenCalledWith(expect.objectContaining({ mode: 'live' }));
  });

  it('defaults to test mode when checkout mode env is unset', async () => {
    const { initDodoOverlay } = await loadOverlay();

    initDodoOverlay();

    expect(sdk.Initialize).toHaveBeenCalledWith(expect.objectContaining({ mode: 'test' }));
  });

  it('ignores unrelated checkout events until a terminal event', async () => {
    const { openDodoCheckout } = await loadOverlay();

    const pending = openDodoCheckout('https://checkout.example/pending');
    sdk.emit({ event_type: 'checkout.opened' });
    sdk.emit({ event_type: 'checkout.closed' });

    await expect(pending).resolves.toBe('closed');
  });
});
