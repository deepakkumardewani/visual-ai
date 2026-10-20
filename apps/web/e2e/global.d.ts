import type { E2eDodoCheckoutBridge } from '../src/payments/dodoOverlay';

type E2eDodoWindowBridge = E2eDodoCheckoutBridge & {
  pendingResolve: ((reason: 'closed' | 'status' | 'error') => void) | null;
};

declare global {
  interface Window {
    __VISUAL_AI_E2E_DODO__?: E2eDodoWindowBridge;
  }
}

export {};
