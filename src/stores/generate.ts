import { defineStore, storeToRefs } from 'pinia'

import { useFetch } from '@/composables/useFetch'
// import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { MODEL_IDS } from '@/utils/constants'

export interface IImage {
  aiImageUrl?: string
  originalImageUrl?: string
  enhancedImageUrl?: string
  name: string
  publicId: string
  resolution: string
  width: number
  height: number
  format: string
  bytes: number
  aspectRatio: string
}
export interface IImageObject {
  _id: string
  userId: string
  prompt: string
  featureType: string
  modelName: string
  imageType: string
  isFavorite: boolean
  images: IImage[]
  humanReadableDate: string
  createdAt: Date
}

export type ImageBody = {
  modelId: string
  modelName: string
  prompt: string
  noOfOutputs: number
  outputQuality: number
  aspectRatio: string
  outputFormat: string
  imageType: string
}

export interface IGenerateResponse {
  image: IImageObject
  userCreditsRemaining: number
}

export const useGenerateStore = defineStore('generate', () => {
  const isLoading = ref(false)
  const isDeleting = ref(false)
  const images = ref<IImage[]>([])
  const imageData = ref<any>({})
  const upscaleInProgress = ref<boolean>(false)
  const colorizeInProgress = ref<boolean>(false)
  const userStore = useUserStore()
  const { userId, credits, history } = storeToRefs(userStore)

  async function generateImage(imgData?: ImageBody) {
    if (credits.value <= 0) {
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
    isLoading.value = true
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
    isLoading.value = false
    if (error.value) {
      console.error('error', error.value)
      isLoading.value = false
      return
    }
    // console.log('enhancedImageData', enhancedImageData.value)

    // if (enhancedImageData.value) {
    //   userStore.setCredits(enhancedImageData.value.userCreditsRemaining)
    //   originalImage.value = enhancedImageData.value.original
    //   enhancedImage.value = enhancedImageData.value.enhanced
    // }
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
    }
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
    isDeleting,
    images,
    imageData,
    upscaleInProgress,
    colorizeInProgress
  }
})
