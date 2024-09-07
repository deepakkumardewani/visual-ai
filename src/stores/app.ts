import { defineStore } from 'pinia'
import { useTheme } from 'vuetify'

export interface Feature {
  title: string
  available: boolean
}

export interface Plan {
  title: string
  price: string
  description: string
  features: Feature[]
  isFree: boolean
}
export const useAppStore = defineStore('app', () => {
  const feature = ref<string>('')
  const theme = useTheme()
  const isDark = computed(() => theme.global.name.value === 'dark')
  function setFeature(id: string) {
    feature.value = id
  }
  function toggleTheme() {
    theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
  }

  return { feature, setFeature, isDark, toggleTheme }
})
