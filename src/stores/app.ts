import TelemetryDeck from '@telemetrydeck/sdk'
import { useEventSource } from '@vueuse/core'
import { defineStore, storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useTheme } from 'vuetify'

import type { JobStatus } from '@/types'
import { FeatureType } from '@/types'

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
  const { isLoading, upscaleInProgress, colorizeInProgress, reviveInProgress, images, imageData } =
    storeToRefs(generateStore)
  const feature = ref<string>('')
  const theme = useTheme()
  const tab = ref(1)
  const isDark = computed(() => theme.global.name.value === 'dark')
  const snackbar = ref(false)
  const snackbarTimeout = ref(2000)
  const snackbarText = ref('')
  const progressUrl = ref('')

  const td = new TelemetryDeck({
    appID: import.meta.env.VITE_TELEMETRYDECK_APP_ID,
    clientUser: ''
  })

  const eventSourceOptions = computed(() => ({
    immediate: false,
    autoReconnect: false
  }))

  const {
    open: imageOpen,
    close: imageClose,
    data: imgData,
    error: imgError
  } = useEventSource(progressUrl, [], eventSourceOptions.value)

  const {
    open: upscaleOpen,
    close: upscaleClose,
    data: upscaleData,
    error: upscaleError
  } = useEventSource(progressUrl, [], eventSourceOptions.value)

  const {
    open: colorizeOpen,
    close: colorizeClose,
    data: colorizeData,
    error: colorizeError
  } = useEventSource(progressUrl, [], eventSourceOptions.value)

  const {
    open: reviveOpen,
    close: reviveClose,
    data: reviveData,
    error: reviveError
  } = useEventSource(progressUrl, [], eventSourceOptions.value)

  function handleEventSourceData(feature: string, data: JobStatus) {
    if (data.status === 'processing') {
      localStorage.setItem(`${feature}InProgress`, 'true')
      if (feature === 'upscale') upscaleInProgress.value = true
      if (feature === 'colorize') colorizeInProgress.value = true
      if (feature === 'revive') reviveInProgress.value = true

      if (data.image) {
        // console.log('before upload: data.image', data.image)
        localStorage.setItem(`${feature}InProgress`, 'false')
        if (feature === FeatureType.IMAGE) isLoading.value = false
        if (feature === FeatureType.UPSCALE) upscaleInProgress.value = false
        if (feature === FeatureType.COLORIZE) colorizeInProgress.value = false
        if (feature === FeatureType.REVIVE) reviveInProgress.value = false

        images.value = data.image.images
        imageData.value = data.image
        history.value.push(data.image)
        userStore.setCredits(data.userCreditsRemaining)
      }
    }

    if (data.status === 'completed') {
      closeEventSource(feature)

      if (data.image) {
        // Find the image in history and update its fields
        const historyIndex = history.value.findIndex((img) => img._id === data.image._id)
        if (historyIndex !== -1) {
          const imageIndex = data.image.images.findIndex(
            (img) => img._id === data.image.images[0]._id
          )
          if (imageIndex !== -1) {
            history.value[historyIndex].images[imageIndex].originalImageUrl =
              data.image.images[0].aiImageUrl
            history.value[historyIndex].images[imageIndex].originalImageUrl =
              data.image.images[0].originalImageUrl
            history.value[historyIndex].images[imageIndex].enhancedImageUrl =
              data.image.images[0].enhancedImageUrl
            history.value[historyIndex].images[imageIndex].aiImagePublicId =
              data.image.images[0].aiImagePublicId
            history.value[historyIndex].images[imageIndex].originalPublicId =
              data.image.images[0].originalPublicId
            history.value[historyIndex].images[imageIndex].enhancedPublicId =
              data.image.images[0].enhancedPublicId
          }
        }
        // console.log('after upload: data.image', data.image)
      }
    }
  }

  function closeEventSource(feature: string) {
    switch (feature) {
      case FeatureType.IMAGE:
        imageClose()
        break
      case FeatureType.UPSCALE:
        upscaleClose()
        break
      case FeatureType.COLORIZE:
        colorizeClose()
        break
      case FeatureType.REVIVE:
        reviveClose()
        break
    }
  }

  function handleEventSourceError(feature: string, error: any) {
    console.error(`${feature} error:`, error)
    localStorage.setItem(`${feature}InProgress`, 'false')
    if (feature === FeatureType.IMAGE) {
      imageClose()
    }
    if (feature === FeatureType.UPSCALE) {
      upscaleInProgress.value = false
      upscaleClose()
    }
    if (feature === FeatureType.COLORIZE) {
      colorizeInProgress.value = false
      colorizeClose()
    }
    if (feature === FeatureType.REVIVE) {
      reviveInProgress.value = false
      reviveClose()
    }
  }

  function setFeature(id: string) {
    feature.value = id
  }
  function toggleTheme() {
    theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
  }

  function sendSignal(signal: string) {
    if (import.meta.env.VITE_TELEMETRYDECK_DEBUG === 'true') {
      td.signal(`test_${signal}`, { testMode: true })
      return
    }

    td.signal(signal)
  }

  watch(userId, async (newUserId) => {
    td.clientUser = newUserId
    sendSignal('page_view')
  })

  watch(imgData, (newVal) => {
    handleEventSourceData('image', JSON.parse(newVal as string))
  })

  watch(upscaleData, (newVal) => {
    handleEventSourceData('upscale', JSON.parse(newVal as string))
  })

  watch(colorizeData, (newVal) => {
    handleEventSourceData('colorize', JSON.parse(newVal as string))
  })

  watch(reviveData, (newVal) => {
    handleEventSourceData('revive', JSON.parse(newVal as string))
  })

  watch([imgError, upscaleError, colorizeError, reviveError], ([imgErr, upErr, colErr, revErr]) => {
    if (imgErr) handleEventSourceError(FeatureType.IMAGE, imgErr)
    if (upErr) handleEventSourceError(FeatureType.UPSCALE, upErr)
    if (colErr) handleEventSourceError(FeatureType.COLORIZE, colErr)
    if (revErr) handleEventSourceError(FeatureType.REVIVE, revErr)
  })

  watch(isDark, (newVal) => {
    newVal
      ? document.documentElement.classList.add('tw-dark')
      : document.documentElement.classList.remove('tw-dark')
  })
  return {
    setFeature,
    toggleTheme,
    closeEventSource,
    upscaleOpen,
    upscaleClose,
    colorizeOpen,
    colorizeClose,
    reviveOpen,
    reviveClose,
    sendSignal,
    imageOpen,
    imageClose,
    progressUrl,
    isDark,
    tab,
    snackbar,
    snackbarTimeout,
    snackbarText,
    feature
  }
})
