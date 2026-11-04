import { storeToRefs } from 'pinia';
import { ref } from 'vue';

import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';
import type { CreditPackId } from '@visual-ai/shared';

import {
  AlreadySubscribedClientError,
  CheckoutClientError,
  createCheckoutSession,
  createSubscriptionSession,
  fetchCheckoutStatus,
  type CheckoutSessionStatus,
} from './checkoutClient';
import { PAYMENT_POLL_INTERVAL_MS, PAYMENT_POLL_TIMEOUT_MS, PAYMENT_TOAST } from './constants';
import { openDodoCheckout } from './dodoOverlay';

export type PurchaseOutcome = 'succeeded' | 'failed' | 'timeout' | 'cancelled';
export type SubscribeOutcome = PurchaseOutcome | 'already_pro';

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

async function pollUntilPro(): Promise<boolean> {
  const userStore = useUserStore();
  const deadline = Date.now() + PAYMENT_POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await userStore.getUserDetails();
    if (userStore.isPro) return true;
    await sleep(PAYMENT_POLL_INTERVAL_MS);
  }

  return false;
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

  /** Pro is granted by the signed webhook, so we poll the user record rather than the checkout status. */
  async function subscribe(): Promise<SubscribeOutcome> {
    if (isPurchasing.value) {
      return 'cancelled';
    }

    isPurchasing.value = true;

    try {
      const { checkoutUrl } = await createSubscriptionSession();
      await openDodoCheckout(checkoutUrl);

      if (await pollUntilPro()) {
        showToast(PAYMENT_TOAST.SUBSCRIBED);
        return 'succeeded';
      }

      showToast(PAYMENT_TOAST.SUBSCRIPTION_PROCESSING);
      return 'timeout';
    } catch (error) {
      if (error instanceof AlreadySubscribedClientError) {
        showToast(PAYMENT_TOAST.ALREADY_PRO);
        return 'already_pro';
      }
      if (error instanceof CheckoutClientError) {
        showToast(PAYMENT_TOAST.CHECKOUT_UNAVAILABLE);
      }
      return 'failed';
    } finally {
      isPurchasing.value = false;
    }
  }

  return { start, subscribe, isPurchasing };
}
