import { Paddle } from '@paddle/paddle-js'
import { defineStore } from 'pinia'
import { useTheme } from 'vuetify'

export interface Feature {
  title: string
  available: boolean
  tooltip?: string
}

export interface Plan {
  title: string
  price: string
  description: string
  features: Feature[]
  isFree: boolean
}
export const useAppStore = defineStore('app', () => {
  const paddle = ref<Paddle | undefined>(undefined)
  const feature = ref<string>('')
  const theme = useTheme()
  const tab = ref(1)
  const isDark = computed(() => theme.global.name.value === 'dark')
  const snackbar = ref(false)
  const snackbarTimeout = ref(2000)
  const snackbarText = ref('')
  function setFeature(id: string) {
    feature.value = id
  }
  function toggleTheme() {
    theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
  }

  watch(isDark, (newVal) => {
    newVal
      ? document.documentElement.classList.add('tw-dark')
      : document.documentElement.classList.remove('tw-dark')
  })

  return {
    setFeature,
    toggleTheme,
    isDark,
    tab,
    paddle,
    snackbar,
    snackbarTimeout,
    snackbarText,
    feature
  }
})
