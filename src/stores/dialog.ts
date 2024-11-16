import { defineStore } from 'pinia'

export const useDialogStore = defineStore('dialog', () => {
  const isRevealed = ref(false)
  const showPremiumDialog = ref(false)
  const showLowCreditsDialog = ref(false)
  const showImageDialog = ref(false)
  const showReferralDialog = ref(false)
  const showDeleteDialog = ref(false)
  const showBuyCreditsDialog = ref(false)
  const imageUrl = ref('')
  const prompt = ref('')
  const originalImage = ref('')
  const enhancedImage = ref('')
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
  function showBuyCredits() {
    showBuyCreditsDialog.value = true
  }
  function hideBuyCredits() {
    showBuyCreditsDialog.value = false
  }
  function hideReferral() {
    showReferralDialog.value = false
  }
  function showDelete() {
    showDeleteDialog.value = true
  }
  function hideDelete() {
    showDeleteDialog.value = false
  }
  function reveal() {
    isRevealed.value = true
  }
  function cancel() {
    isRevealed.value = false
  }

  return {
    isRevealed,
    showPremiumDialog,
    showImageDialog,
    showReferralDialog,
    showBuyCreditsDialog,
    showDeleteDialog,
    imageUrl,
    originalImage,
    enhancedImage,
    prompt,
    reveal,
    cancel,
    showPremium,
    hidePremium,
    showLowCredits,
    hideLowCredits,
    showImage,
    hideImage,
    showReferral,
    hideReferral,
    showDelete,
    hideDelete,
    showBuyCredits,
    hideBuyCredits
  }
})
