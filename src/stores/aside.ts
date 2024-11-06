import { defineStore } from 'pinia'

export type Mode = {
  title: string
  id: string
  description: string
  icon: string
  isPro: boolean
}

export const useAsideStore = defineStore('aside', () => {})
