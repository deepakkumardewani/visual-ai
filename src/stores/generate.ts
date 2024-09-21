import { defineStore, storeToRefs } from 'pinia'

import { useFetch } from '@/composables/useFetch'
import { useUserStore } from '@/stores/user'
import { MODEL_IDS } from '@/utils/constants'

export type ImageBody = {
  prompt: string
  noOfOutputs?: number
  outputQuality?: number
  aspectRatio?: string
  outputFormat?: string
}

export const useGenerateStore = defineStore('generate', () => {
  const isLoading = ref(false)
  const image = ref<string>('')
  const originalImage = ref<string>('')
  const enhancedImage = ref<string>('')
  const userStore = useUserStore()
  const { userId, credits } = storeToRefs(userStore)

  async function generateImage(imgData?: ImageBody) {
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
        modelId: MODEL_IDS.FLUX_BASIC,
        userId: userId.value,
        prompt: imgData?.prompt ?? '',
        num_outputs: imgData?.noOfOutputs ?? 1,
        output_quality: imgData?.outputQuality ?? 70,
        aspect_ratio: imgData?.aspectRatio ?? '16:9',
        output_format: imgData?.outputFormat ?? 'jpg'
      })
    })
    isLoading.value = false
    if (error.value) {
      console.error('error', error.value)
      return
    }
    if (imageData.value) {
      const result = JSON.parse(imageData.value as string)
      console.log(result)
      userStore.setCredits(result.userCreditsRemaining)
      image.value = result.image[0]
    }
  }

  async function upscaleImage(data: any) {
    isLoading.value = true
    const { prompt, image, creativity, scale, negativePrompt } = data
    const formData = new FormData()
    formData.append('feature', 'upscale')
    formData.append('image', image)
    formData.append('prompt', prompt)
    formData.append('negativePrompt', negativePrompt)
    formData.append('userId', userId.value)
    formData.append('creativity', creativity)
    formData.append('scale', scale)
    const url = `/generate/upscale/image`
    const { error, data: enhancedImageData } = await useFetch(url, {
      method: 'POST',
      body: formData
    })
    isLoading.value = false
    if (error.value) {
      console.error('error', error.value)
      isLoading.value = false
      return
    }
    if (enhancedImageData.value) {
      const result = JSON.parse(enhancedImageData.value as string)
      userStore.setCredits(result.userCreditsRemaining)
      originalImage.value = result.original
      enhancedImage.value = result.enhanced
    }
  }

  async function colorizeImage(data: any) {
    isLoading.value = true
    const url = `/generate/colorize/image`
    const { image, modelId } = data
    console.log('image', image)
    const formData = new FormData()
    formData.append('feature', 'colorize')
    formData.append('image', image)
    formData.append('userId', userId.value)
    formData.append('modelId', modelId)
    const { error, data: colorizedImageData } = await useFetch(url, {
      method: 'POST',
      body: formData
    })

    isLoading.value = false
    if (error.value) {
      console.error('error', error.value)
      isLoading.value = false
      return
    }
    if (colorizedImageData.value) {
      const result = JSON.parse(colorizedImageData.value as string)
      userStore.setCredits(result.userCreditsRemaining)
      originalImage.value = result.original
      enhancedImage.value = result.enhanced
    }
  }

  async function reviveOldImage(data: any) {
    isLoading.value = true
    const { image, scratched, highResolution } = data
    const formData = new FormData()
    formData.append('userId', userId.value)
    formData.append('feature', 'revive')
    formData.append('image', image)
    formData.append('scratched', scratched)
    formData.append('highResolution', highResolution)
    const url = `/generate/revive/image`
    const { error, data: revivedImageData } = await useFetch(url, {
      method: 'POST',
      body: formData
    })
    isLoading.value = false
    if (error.value) {
      console.error('error', error.value)
      isLoading.value = false
      return
    }
    if (revivedImageData.value) {
      const result = JSON.parse(revivedImageData.value as string)
      userStore.setCredits(result.userCreditsRemaining)
      originalImage.value = result.original
      enhancedImage.value = result.enhanced
    }
  }

  return {
    generateImage,
    upscaleImage,
    colorizeImage,
    reviveOldImage,
    isLoading,
    image,
    originalImage,
    enhancedImage
  }
})
