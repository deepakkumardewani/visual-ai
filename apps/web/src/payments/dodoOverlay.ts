import { DodoPayments, type CheckoutEvent, type CheckoutMode } from 'dodopayments-checkout';

const overlayListeners = new Set<(event: CheckoutEvent) => void>();

let initialized = false;

/** Playwright e2e bridge (enabled via addInitScript before navigation). */
export type E2eDodoCheckoutBridge = {
  enabled: true;
  openCalls: string[];
  closeOverlay: (reason?: OverlayCloseReason) => void;
};

declare global {
  interface Window {
    __VISUAL_AI_E2E_DODO__?: E2eDodoCheckoutBridge & {
      pendingResolve: ((reason: OverlayCloseReason) => void) | null;
    };
  }
}

function e2eBridgeActive(): boolean {
  return typeof window !== 'undefined' && window.__VISUAL_AI_E2E_DODO__?.enabled === true;
}

function resolveCheckoutMode(): CheckoutMode {
  const raw = import.meta.env.VITE_DODO_CHECKOUT_MODE ?? 'test';
  return raw === 'live' ? 'live' : 'test';
}

function dispatchOverlayEvent(event: CheckoutEvent) {
  for (const listener of overlayListeners) {
    listener(event);
  }
}

/** Initialize the Dodo overlay SDK once at app load (also safe to call again). */
export function initDodoOverlay(): void {
  if (initialized) {
    return;
  }
  initialized = true;
  if (e2eBridgeActive()) {
    return;
  }
  DodoPayments.Initialize({
    mode: resolveCheckoutMode(),
    displayType: 'overlay',
    onEvent: dispatchOverlayEvent,
  });
}

export type OverlayCloseReason = 'closed' | 'status' | 'error';

export function openDodoCheckout(checkoutUrl: string): Promise<OverlayCloseReason> {
  initDodoOverlay();

  if (e2eBridgeActive()) {
    const bridge = window.__VISUAL_AI_E2E_DODO__!;
    bridge.openCalls.push(checkoutUrl);
    return new Promise((resolve) => {
      bridge.pendingResolve = resolve;
    });
  }

  return new Promise((resolve) => {
    const onEvent = (event: CheckoutEvent) => {
      if (event.event_type === 'checkout.closed') {
        overlayListeners.delete(onEvent);
        resolve('closed');
        return;
      }
      if (event.event_type === 'checkout.status') {
        overlayListeners.delete(onEvent);
        resolve('status');
        return;
      }
      if (event.event_type === 'checkout.error') {
        overlayListeners.delete(onEvent);
        resolve('error');
      }
    };

    overlayListeners.add(onEvent);
    DodoPayments.Checkout.open({ checkoutUrl });
  });
}
