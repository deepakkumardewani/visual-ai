import { defineStore } from 'pinia'

export const useDialogStore = defineStore('dialog', () => {
  const isRevealed = ref(false)
  const showPremiumDialog = ref(false)
  const showLowCreditsDialog = ref(false)

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
  function reveal() {
    isRevealed.value = true
  }
  function cancel() {
    isRevealed.value = false
  }

  return {
    isRevealed,
    showPremiumDialog,
    reveal,
    cancel,
    showPremium,
    hidePremium,
    showLowCredits,
    hideLowCredits
  }
})
