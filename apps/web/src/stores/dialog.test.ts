import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CHAIN_ACTION_LABELS, useDialogStore } from '@/stores/dialog';

describe('useDialogStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('has correct initial state', () => {
    const store = useDialogStore();
    expect(store.showPricingDialog).toBe(false);
    expect(store.showImageDialog).toBe(false);
    expect(store.activeImageId).toBeNull();
    expect(store.showReferralDialog).toBe(false);
    expect(store.showCopyReferralDialog).toBe(false);
    expect(store.showLowCreditsDialog).toBe(false);
    expect(store.showBuyCreditsDialog).toBe(false);
    expect(store.showDeleteDialog).toBe(false);
    expect(store.signupDialog).toBe(false);
    expect(store.referralOfferDialog).toBe(false);
    expect(store.showChainActionDialog).toBe(false);
    expect(store.chainAction).toBe('upscale');
    expect(store.chainActionCreditCost).toBe(2);
    expect(store.chainActionExtraCopy).toBe('');
    expect(CHAIN_ACTION_LABELS.colorize).toBe('Colorize');
  });

  it('toggles pricing, credits, signup, and referral dialogs', () => {
    const store = useDialogStore();
    store.showPricing();
    store.showLowCredits();
    store.showBuyCredits();
    store.showSignup();
    store.showReferral();
    store.showCopyReferral();
    store.showReferralOffer();
    store.showDelete();

    expect(store.showPricingDialog).toBe(true);
    expect(store.showLowCreditsDialog).toBe(true);
    expect(store.showBuyCreditsDialog).toBe(true);
    expect(store.signupDialog).toBe(true);
    expect(store.showReferralDialog).toBe(true);
    expect(store.showCopyReferralDialog).toBe(true);
    expect(store.referralOfferDialog).toBe(true);
    expect(store.showDeleteDialog).toBe(true);

    store.hidePricing();
    store.hideLowCredits();
    store.hideBuyCredits();
    store.hideSignup();
    store.hideReferral();
    store.hideCopyReferral();
    store.hideReferralOffer();
    store.hideDelete();

    expect(store.showPricingDialog).toBe(false);
    expect(store.showLowCreditsDialog).toBe(false);
    expect(store.showBuyCreditsDialog).toBe(false);
    expect(store.signupDialog).toBe(false);
    expect(store.showReferralDialog).toBe(false);
    expect(store.showCopyReferralDialog).toBe(false);
    expect(store.referralOfferDialog).toBe(false);
    expect(store.showDeleteDialog).toBe(false);
  });

  it('shows an image dialog with an optional image id', () => {
    const store = useDialogStore();
    store.showImage();
    expect(store.showImageDialog).toBe(true);
    expect(store.activeImageId).toBeNull();

    store.hideImage();
    expect(store.showImageDialog).toBe(false);

    store.showImage('img_123');
    expect(store.showImageDialog).toBe(true);
    expect(store.activeImageId).toBe('img_123');
    store.hideImage();
    expect(store.activeImageId).toBeNull();
  });

  it('resolves chain confirmation when the user confirms', async () => {
    const store = useDialogStore();
    const pending = store.confirmChainAction({
      action: 'remove-bg',
      creditCost: 4,
      extraCopy: 'Uses the last result',
    });

    expect(store.showChainActionDialog).toBe(true);
    expect(store.chainAction).toBe('remove-bg');
    expect(store.chainActionCreditCost).toBe(4);
    expect(store.chainActionExtraCopy).toBe('Uses the last result');

    store.resolveChainAction(true);
    await expect(pending).resolves.toBe(true);
    expect(store.showChainActionDialog).toBe(false);
  });

  it('cancels a previous pending chain confirm when a new one starts', async () => {
    const store = useDialogStore();
    const first = store.confirmChainAction({ action: 'upscale', creditCost: 2 });
    const second = store.confirmChainAction({ action: 'more-like-this', creditCost: 1 });

    await expect(first).resolves.toBe(false);
    store.resolveChainAction(false);
    await expect(second).resolves.toBe(false);
  });

  it('defaults extra copy to an empty string', async () => {
    const store = useDialogStore();
    const pending = store.confirmChainAction({ action: 'colorize', creditCost: 2 });
    expect(store.chainActionExtraCopy).toBe('');
    store.resolveChainAction(true);
    await expect(pending).resolves.toBe(true);
  });

  it('resolveChainAction is a no-op when nothing is pending', () => {
    const store = useDialogStore();
    store.resolveChainAction(true);
    expect(store.showChainActionDialog).toBe(false);
  });
});
