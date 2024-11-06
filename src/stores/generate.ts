import { defineStore, storeToRefs } from 'pinia'

import { useFetch } from '@/composables/useFetch'
// import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { MODEL_IDS } from '@/utils/constants'

export type ImageBody = {
  modelId: string
  prompt: string
  noOfOutputs: number
  outputQuality: number
  aspectRatio: string
  outputFormat: string
}

export const useGenerateStore = defineStore('generate', () => {
  const isLoading = ref(false)
  const image = ref<string>('')
  const originalImage = ref<string>('')
  const enhancedImage = ref<string>('')
  const upscaleInProgress = ref<boolean>(false)
  const colorizeInProgress = ref<boolean>(false)
  const userStore = useUserStore()
  const { userId, credits, history } = storeToRefs(userStore)

  async function generateImage(imgData?: ImageBody) {
    console.log('imgData', imgData)

    if (credits.value <= 0) {
      console.log('no credits')
      //TODO: redirect to subscription page
      return
    }
    isLoading.value = true
    image.value = ''

    const url = `/generate/image`

    const { error, data: imageData } = await useFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        mode: 'cors'
      },
      body: JSON.stringify({
        modelId: imgData?.modelId ?? MODEL_IDS.FLUX_BASIC,
        userId: userId.value,
        prompt: imgData?.prompt ?? '',
        num_outputs: imgData?.noOfOutputs ?? 1,
        output_quality: imgData?.outputQuality ?? 70,
        aspect_ratio: imgData?.aspectRatio ?? '16:9',
        output_format: imgData?.outputFormat ?? 'jpg'
      })
    }).json()
    isLoading.value = false
    if (error.value) {
      console.error('error', error.value)
      return
    }
    if (imageData.value) {
      userStore.setCredits(imageData.value.userCreditsRemaining)
      history.value.push(imageData.value.image)
      image.value = imageData.value.image.imageUrl
    }
  }

  async function upscaleImage(data: any) {
    isLoading.value = true
    const { prompt, image, format, creativity, scale, negativePrompt } = data
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
    const { error, data: enhancedImageData } = await useFetch(url, {
      method: 'POST',
      body: formData
    }).json()
    isLoading.value = false
    if (error.value) {
      console.error('error', error.value)
      isLoading.value = false
      return
    }
    if (enhancedImageData.value) {
      userStore.setCredits(enhancedImageData.value.userCreditsRemaining)
      originalImage.value = enhancedImageData.value.original
      enhancedImage.value = enhancedImageData.value.enhanced
    }
  }

  async function colorizeImage(data: any) {
    isLoading.value = true
    const url = `/generate/colorize/image`
    const { image, modelId } = data
    const formData = new FormData()
    formData.append('feature', 'colorize')
    formData.append('userId', userId.value)
    formData.append('modelId', modelId)
    formData.append('image', image)
    const { error, data: colorizedImageData } = await useFetch(url, {
      method: 'POST',
      body: formData
    }).json()

    isLoading.value = false
    if (error.value) {
      console.error('error', error.value)
      isLoading.value = false
      return
    }
    if (colorizedImageData.value) {
      userStore.setCredits(colorizedImageData.value.userCreditsRemaining)
      originalImage.value = colorizedImageData.value.original
      enhancedImage.value = colorizedImageData.value.enhanced
    }
  }

  async function reviveOldImage(data: any) {
    isLoading.value = true
    const { image } = data
    const formData = new FormData()
    formData.append('userId', userId.value)
    formData.append('feature', 'revive')
    formData.append('image', image)
    const url = `/generate/revive/image`
    const { error, data: revivedImageData } = await useFetch(url, {
      method: 'POST',
      body: formData
    }).json()
    isLoading.value = false
    if (error.value) {
      console.error('error', error.value)
      isLoading.value = false
      return
    }
    if (revivedImageData.value) {
      userStore.setCredits(revivedImageData.value.userCreditsRemaining)
      originalImage.value = revivedImageData.value.original
      enhancedImage.value = revivedImageData.value.enhanced
    }
  }

  watch(isLoading, (newVal) => {
    if (newVal) {
      image.value = ''
      originalImage.value = ''
      enhancedImage.value = ''
    }
  })

  return {
    generateImage,
    upscaleImage,
    colorizeImage,
    reviveOldImage,
    isLoading,
    image,
    originalImage,
    enhancedImage,
    upscaleInProgress,
    colorizeInProgress
  }
})
