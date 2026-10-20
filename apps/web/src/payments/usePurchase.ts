import { storeToRefs } from 'pinia';
import { ref } from 'vue';

import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';
import type { CreditPackId } from '@visual-ai/shared';

import {
  CheckoutClientError,
  createCheckoutSession,
  fetchCheckoutStatus,
  type CheckoutSessionStatus,
} from './checkoutClient';
import { PAYMENT_POLL_INTERVAL_MS, PAYMENT_POLL_TIMEOUT_MS, PAYMENT_TOAST } from './constants';
import { openDodoCheckout } from './dodoOverlay';

export type PurchaseOutcome = 'succeeded' | 'failed' | 'timeout' | 'cancelled';

const isPurchasing = ref(false);

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function showToast(message: string) {
  const appStore = useAppStore();
  const { snackbar, snackbarTimeout, snackbarText } = storeToRefs(appStore);
  snackbarText.value = message;
  snackbarTimeout.value = 4000;
  snackbar.value = true;
}

async function pollUntilTerminal(sessionId: string): Promise<CheckoutSessionStatus> {
  const deadline = Date.now() + PAYMENT_POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const { status } = await fetchCheckoutStatus(sessionId);
    if (status === 'succeeded' || status === 'failed') {
      return status;
    }
    await sleep(PAYMENT_POLL_INTERVAL_MS);
  }

  return 'pending';
}

export function usePurchase() {
  async function start(packId: CreditPackId): Promise<PurchaseOutcome> {
    if (isPurchasing.value) {
      return 'cancelled';
    }

    isPurchasing.value = true;
    const userStore = useUserStore();

    try {
      const { checkoutUrl, sessionId } = await createCheckoutSession(packId);
      await openDodoCheckout(checkoutUrl);

      const terminal = await pollUntilTerminal(sessionId);

      if (terminal === 'succeeded') {
        await userStore.getUserDetails();
        showToast(PAYMENT_TOAST.SUCCESS);
        return 'succeeded';
      }

      if (terminal === 'failed') {
        showToast(PAYMENT_TOAST.FAILED);
        return 'failed';
      }

      showToast(PAYMENT_TOAST.PROCESSING);
      return 'timeout';
    } catch (error) {
      if (error instanceof CheckoutClientError) {
        showToast(PAYMENT_TOAST.CHECKOUT_UNAVAILABLE);
      }
      return 'failed';
    } finally {
      isPurchasing.value = false;
    }
  }

  return { start, isPurchasing };
}
