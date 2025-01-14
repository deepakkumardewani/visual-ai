import { Paddle } from '@paddle/paddle-js'
import { useEventSource } from '@vueuse/core'
import { defineStore, storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useTheme } from 'vuetify'

import type { JobStatus } from '@/types'

import { useGenerateStore } from '@/stores/generate'
import { useUserStore } from '@/stores/user'

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
  const generateStore = useGenerateStore()
  const userStore = useUserStore()
  const { history, userId } = storeToRefs(userStore)
  const { upscaleInProgress, colorizeInProgress, reviveInProgress, images, imageData } =
    storeToRefs(generateStore)
  const paddle = ref<Paddle | undefined>(undefined)
  const feature = ref<string>('')
  const theme = useTheme()
  const tab = ref(1)
  const isDark = computed(() => theme.global.name.value === 'dark')
  const snackbar = ref(false)
  const snackbarTimeout = ref(2000)
  const snackbarText = ref('')
  const progressUrl = ref('')

  const eventSourceOptions = computed(() => ({
    immediate: false,
    autoReconnect: {
      retries: 3,
      onFailed() {
        console.error('Failed to connect EventSource after 3 retries')
      }
    }
  }))

  let upscaleSource = useEventSource(progressUrl, [], eventSourceOptions.value)
  let colorizeSource = useEventSource(progressUrl, [], eventSourceOptions.value)
  let reviveSource = useEventSource(progressUrl, [], eventSourceOptions.value)

  watch(
    userId,
    (newVal) => {
      if (newVal) {
        progressUrl.value = `${import.meta.env.VITE_API_BASEPATH}/progress?userId=${newVal}`

        upscaleSource.close()
        colorizeSource.close()
        reviveSource.close()

        upscaleSource = useEventSource(progressUrl, [], eventSourceOptions.value)
        colorizeSource = useEventSource(progressUrl, [], eventSourceOptions.value)
        reviveSource = useEventSource(progressUrl, [], eventSourceOptions.value)
      }
    },
    { immediate: true }
  )

  watch(isDark, (newVal) => {
    newVal
      ? document.documentElement.classList.add('tw-dark')
      : document.documentElement.classList.remove('tw-dark')
  })

  watch(upscaleSource.data, (newVal) => {
    if (!newVal) return
    handleEventSourceData('upscale', JSON.parse(newVal as string))
  })

  watch(colorizeSource.data, (newVal) => {
    if (!newVal) return
    handleEventSourceData('colorize', JSON.parse(newVal as string))
  })

  watch(reviveSource.data, (newVal) => {
    if (!newVal) return
    handleEventSourceData('revive', JSON.parse(newVal as string))
  })

  function handleEventSourceData(feature: string, data: JobStatus) {
    if (data.status === 'processing') {
      localStorage.setItem(`${feature}InProgress`, 'true')
      if (feature === 'upscale') upscaleInProgress.value = true
      if (feature === 'colorize') colorizeInProgress.value = true
      if (feature === 'revive') reviveInProgress.value = true
    }

    if (data.status === 'completed') {
      console.log(`${feature} completed`, data)
      closeEventSource(feature)

      localStorage.setItem(`${feature}InProgress`, 'false')
      if (feature === 'upscale') {
        upscaleInProgress.value = false
        // images.value = data.image.images
        // imageData.value = data.image
        // history.value.push(data.image)
        // userStore.setCredits(data.userCreditsRemaining)
      }
      if (feature === 'colorize') {
        colorizeInProgress.value = false
      }
      if (feature === 'revive') {
        reviveInProgress.value = false
      }
      images.value = data.image.images
      imageData.value = data.image
      history.value.push(data.image)
      userStore.setCredits(data.userCreditsRemaining)
    }
  }

  function closeEventSource(feature: string) {
    switch (feature) {
      case 'upscale':
        upscaleSource.close()
        break
      case 'colorize':
        colorizeSource.close()
        break
      case 'revive':
        reviveSource.close()
        break
    }
  }

  watch(
    [upscaleSource.error, colorizeSource.error, reviveSource.error],
    ([upErr, colErr, revErr]) => {
      if (upErr) handleEventSourceError('upscale', upErr)
      if (colErr) handleEventSourceError('colorize', colErr)
      if (revErr) handleEventSourceError('revive', revErr)
    }
  )

  function handleEventSourceError(feature: string, error: any) {
    console.error(`${feature} error:`, error)
    localStorage.setItem(`${feature}InProgress`, 'false')
    if (feature === 'upscale') upscaleInProgress.value = false
  }

  function setFeature(id: string) {
    feature.value = id
  }
  function toggleTheme() {
    theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
  }

  return {
    setFeature,
    toggleTheme,
    closeEventSource,
    isDark,
    tab,
    paddle,
    snackbar,
    snackbarTimeout,
    snackbarText,
    feature,
    upscaleSource,
    colorizeSource,
    reviveSource
  }
})
