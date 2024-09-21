import { defineStore } from 'pinia'

export type Mode = {
  title: string
  id: string
  description: string
  icon: string
}

export const useAsideStore = defineStore('aside', () => {})
