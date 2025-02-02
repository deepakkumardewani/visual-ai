import { defineStore } from 'pinia'

export const useHistoryStore = defineStore('history', () => {
  const selectedSize = ref('medium')
  const isBulkDeleting = ref(false)
  const isBulkFavoriting = ref(false)
  const isBulkDownloading = ref(false)
  return {
    selectedSize,
    isBulkDeleting,
    isBulkFavoriting,
    isBulkDownloading
  }
})
