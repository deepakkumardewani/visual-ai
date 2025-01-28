import { defineStore } from 'pinia'

export const useHistoryStore = defineStore('history', () => {
  const selectedSize = ref('medium')
  return {
    selectedSize
  }
})
