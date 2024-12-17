import { defineStore, storeToRefs } from 'pinia'

import type { IGenerateResponse, IImage, ImageBody } from '@/types'

import { useUserStore } from '@/stores/user'

// import { useLocal } from '@/composables/local'
import { useFetch } from '@/composables/useFetch'

import { MODEL_IDS } from '@/utils/constants'

export const useGenerateStore = defineStore('generate', () => {
  const isLoading = ref(false)
  const isDeleting = ref(false)
  const isFavoriting = ref(false)
  const images = ref<IImage[]>([])
  const imageData = ref<any>({})
  const errMsg = ref<string>('')
  const deletingImageIds = ref<string[]>([])
  const upscaleInProgress = ref<boolean>(false)
  const colorizeInProgress = ref<boolean>(false)
  const reviveInProgress = ref<boolean>(false)
  const userStore = useUserStore()
  const { userId, credits, history } = storeToRefs(userStore)
  // const { setLocal } = useLocal()

  async function generateImage(imgData?: ImageBody) {
    if (credits.value === undefined || credits.value <= 0) {
      console.log('no credits')
      //TODO: redirect to subscription page
      return
    }
    isLoading.value = true
    images.value = []

    const url = `/generate/image`

    const { error, data } = await useFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        mode: 'cors'
      },
      body: JSON.stringify({
        modelId: imgData?.modelId ?? MODEL_IDS.FLUX_BASIC,
        imageType: imgData?.imageType ?? 'horizontal',
        modelName: imgData?.modelName ?? 'Flux Lightening',
        userId: userId.value,
        prompt: imgData?.prompt ?? '',
        numOfOutputs: imgData?.noOfOutputs ?? 1,
        outputQuality: imgData?.outputQuality ?? 70,
        aspectRatio: imgData?.aspectRatio ?? '16:9',
        outputFormat: imgData?.outputFormat ?? 'jpg'
      })
    }).json<IGenerateResponse>()
    isLoading.value = false
    if (error.value) {
      console.error('error', error.value)
      return
    }
    if (data.value) {
      userStore.setCredits(data.value.userCreditsRemaining)
      imageData.value = data.value.image
      history.value.push(data.value.image)
      images.value = data.value.image.images
    }
  }

  async function upscaleImage(imgData: any) {
    // isLoading.value = true
    upscaleInProgress.value = true
    const { prompt, image, format, creativity, scale, negativePrompt } = imgData
    const formData = new FormData()
    formData.append('feature', 'upscale')
    formData.append('prompt', prompt)
    formData.append('negativePrompt', negativePrompt)
    formData.append('userId', userId.value)
    formData.append('creativity', creativity)
    formData.append('scale', scale)
    formData.append('format', format)
    formData.append('image', image)

    const url = `/generate/upscale/image`
    const { error } = await useFetch(url, {
      method: 'POST',
      body: formData
    }).json()

    // isLoading.value = false
    upscaleInProgress.value = false
    if (error.value) {
      console.log('error', error.value)
      // if (typeof error.value === 'object' && !isEmpty(error.value)) {
      //   setLocal('upscaleInProgress', false)
      //   upscaleInProgress.value = false
      //   isLoading.value = false
      //   errMsg.value = 'Sorry, there was an error processing your request. Please try again.'
      // }
      return
    }
  }

  async function colorizeImage(data: any) {
    // isLoading.value = true
    colorizeInProgress.value = true
    const url = `/generate/colorize/image`
    const { image, modelId } = data
    const formData = new FormData()
    formData.append('feature', 'colorize')
    formData.append('userId', userId.value)
    formData.append('modelId', modelId)
    formData.append('image', image)
    const { error } = await useFetch(url, {
      method: 'POST',
      body: formData
    }).json()

    // isLoading.value = false
    colorizeInProgress.value = false
    if (error.value) {
      console.error('error', error.value)
      // isLoading.value = false
      return
    }
    // if (colorizedImageData.value) {
    //   userStore.setCredits(colorizedImageData.value.userCreditsRemaining)
    // }
  }

  async function reviveOldImage(data: any) {
    // isLoading.value = true
    reviveInProgress.value = true
    const { image } = data
    const formData = new FormData()
    formData.append('userId', userId.value)
    formData.append('feature', 'revive')
    formData.append('image', image)
    const url = `/generate/revive/image`
    const { error } = await useFetch(url, {
      method: 'POST',
      body: formData
    }).json()
    // isLoading.value = false
    reviveInProgress.value = false
    if (error.value) {
      console.error('error', error.value)
      isLoading.value = false
      return
    }
    // if (revivedImageData.value) {
    //   userStore.setCredits(revivedImageData.value.userCreditsRemaining)
    // }
  }

  watch(isLoading, (newVal) => {
    if (newVal) {
      images.value = []
    }
  })

  return {
    generateImage,
    upscaleImage,
    colorizeImage,
    reviveOldImage,
    isLoading,
    deletingImageIds,
    isDeleting,
    isFavoriting,
    images,
    imageData,
    upscaleInProgress,
    colorizeInProgress,
    reviveInProgress,
    errMsg
  }
})
