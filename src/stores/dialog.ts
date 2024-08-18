import { defineStore } from 'pinia'

export const useDialogStore = defineStore('dialog', () => {
  const isRevealed = ref(false)

  function reveal() {
    isRevealed.value = true
  }
  function cancel() {
    isRevealed.value = false
  }

  return {
    isRevealed,
    reveal,
    cancel
  }
})
