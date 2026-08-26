import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ChainConfirmAction = 'upscale' | 'remove-bg' | 'colorize' | 'more-like-this';

export const CHAIN_ACTION_LABELS: Record<ChainConfirmAction, string> = {
  upscale: 'Upscale',
  'remove-bg': 'Remove background',
  colorize: 'Colorize',
  'more-like-this': 'More like this',
};

export type ConfirmChainActionOptions = {
  action: ChainConfirmAction;
  creditCost: number;
  extraCopy?: string;
};

let settleChainConfirm: ((confirmed: boolean) => void) | null = null;

export const useDialogStore = defineStore('dialog', () => {
  const showPricingDialog = ref(false);
  const showLowCreditsDialog = ref(false);
  const showImageDialog = ref(false);
  const activeImageId = ref<string | null>(null);
  const showReferralDialog = ref(false);
  const showCopyReferralDialog = ref(false);
  const showDeleteDialog = ref(false);
  const showBuyCreditsDialog = ref(false);
  const imageUrl = ref('');
  const prompt = ref('');
  const originalImage = ref('');
  const enhancedImage = ref('');
  const lowCreditsDialog = ref(false);
  const signupDialog = ref(false);
  const referralOfferDialog = ref(false);
  const showChainActionDialog = ref(false);
  const chainAction = ref<ChainConfirmAction>('upscale');
  const chainActionCreditCost = ref(2);
  const chainActionExtraCopy = ref('');

  function confirmChainAction(options: ConfirmChainActionOptions): Promise<boolean> {
    settleChainConfirm?.(false);
    chainAction.value = options.action;
    chainActionCreditCost.value = options.creditCost;
    chainActionExtraCopy.value = options.extraCopy ?? '';
    showChainActionDialog.value = true;
    return new Promise((resolve) => {
      settleChainConfirm = resolve;
    });
  }

  function resolveChainAction(confirmed: boolean) {
    showChainActionDialog.value = false;
    const settle = settleChainConfirm;
    settleChainConfirm = null;
    settle?.(confirmed);
  }
  function showLowCredits() {
    showLowCreditsDialog.value = true;
  }
  function hideLowCredits() {
    showLowCreditsDialog.value = false;
  }
  function showImage(imageId?: string) {
    activeImageId.value = imageId ?? null;
    showImageDialog.value = true;
  }
  function hideImage() {
    showImageDialog.value = false;
    activeImageId.value = null;
  }
  function showReferral() {
    showReferralDialog.value = true;
  }
  function showCopyReferral() {
    showCopyReferralDialog.value = true;
  }
  function showBuyCredits() {
    showBuyCreditsDialog.value = true;
  }
  function hideBuyCredits() {
    showBuyCreditsDialog.value = false;
  }
  function hideReferral() {
    showReferralDialog.value = false;
  }
  function hideCopyReferral() {
    showCopyReferralDialog.value = false;
  }
  function showDelete() {
    showDeleteDialog.value = true;
  }
  function hideDelete() {
    showDeleteDialog.value = false;
  }
  function showPricing() {
    showPricingDialog.value = true;
  }
  function hidePricing() {
    showPricingDialog.value = false;
  }
  function showSignup() {
    signupDialog.value = true;
  }
  function hideSignup() {
    signupDialog.value = false;
  }
  function showReferralOffer() {
    referralOfferDialog.value = true;
  }
  function hideReferralOffer() {
    referralOfferDialog.value = false;
  }

  return {
    showPricingDialog,
    showImageDialog,
    activeImageId,
    showReferralDialog,
    showCopyReferralDialog,
    showLowCreditsDialog,
    showBuyCreditsDialog,
    showDeleteDialog,
    imageUrl,
    originalImage,
    enhancedImage,
    prompt,
    signupDialog,
    lowCreditsDialog,
    referralOfferDialog,
    showPricing,
    hidePricing,
    showLowCredits,
    hideLowCredits,
    showImage,
    hideImage,
    showReferral,
    hideReferral,
    showDelete,
    hideDelete,
    showBuyCredits,
    hideBuyCredits,
    showCopyReferral,
    hideCopyReferral,
    showSignup,
    hideSignup,
    showReferralOffer,
    hideReferralOffer,
    showChainActionDialog,
    chainAction,
    chainActionCreditCost,
    chainActionExtraCopy,
    confirmChainAction,
    resolveChainAction,
  };
});
