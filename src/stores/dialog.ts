import { defineStore } from 'pinia'

export const useDialogStore = defineStore('dialog', () => {
  const showPricingDialog = ref(false)
  const showPremiumDialog = ref(false)
  const showLowCreditsDialog = ref(false)
  const showImageDialog = ref(false)
  const showReferralDialog = ref(false)
  const showCopyReferralDialog = ref(false)
  const showDeleteDialog = ref(false)
  const showBuyCreditsDialog = ref(false)
  const showCancelSubscriptionDialog = ref(false)
  const imageUrl = ref('')
  const prompt = ref('')
  const originalImage = ref('')
  const enhancedImage = ref('')
  const lowCreditsDialog = ref(false)
  const signupDialog = ref(false)
  function showPremium() {
    showPremiumDialog.value = true
  }
  function hidePremium() {
    showPremiumDialog.value = false
  }
  function showLowCredits() {
    showLowCreditsDialog.value = true
  }
  function hideLowCredits() {
    showLowCreditsDialog.value = false
  }
  function showImage() {
    showImageDialog.value = true
  }
  function hideImage() {
    showImageDialog.value = false
  }
  function showReferral() {
    showReferralDialog.value = true
  }
  function showCopyReferral() {
    showCopyReferralDialog.value = true
  }
  function showBuyCredits() {
    showBuyCreditsDialog.value = true
  }
  function hideBuyCredits() {
    showBuyCreditsDialog.value = false
  }
  function hideReferral() {
    showReferralDialog.value = false
  }
  function hideCopyReferral() {
    showCopyReferralDialog.value = false
  }
  function showDelete() {
    showDeleteDialog.value = true
  }
  function hideDelete() {
    showDeleteDialog.value = false
  }
  function showPricing() {
    showPricingDialog.value = true
  }
  function hidePricing() {
    showPricingDialog.value = false
  }
  function showSignup() {
    signupDialog.value = true
  }
  function hideSignup() {
    signupDialog.value = false
  }
  function showCancelSubscription() {
    showCancelSubscriptionDialog.value = true
  }
  function hideCancelSubscription() {
    showCancelSubscriptionDialog.value = false
  }

  return {
    showPricingDialog,
    showPremiumDialog,
    showImageDialog,
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
    showCancelSubscriptionDialog,
    showPremium,
    hidePremium,
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
    showCancelSubscription,
    hideCancelSubscription,
    showSignup,
    hideSignup
  }
})
