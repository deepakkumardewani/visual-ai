// Utilities
// import { useFetch } from '@vueuse/core'
import { defineStore } from 'pinia'
import { useAuth } from 'vue-clerk'

import { useFetch } from '@/composables/useFetch'
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
  const { getToken } = useAuth()

  async function colorizeImage(imgData: any) {
    isLoading.value = true
    const url = `/generate/colorize/image`

    const { error, data } = await useFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      body: JSON.stringify({ imgData })
    })

    if (error.value) {
      console.error('error', error.value)
      isLoading.value = false
      return
    }
    console.log('data', JSON.parse(data.value as string).image[0])
    isLoading.value = false
  }

  async function upscaleImage(imgData: any) {
    isLoading.value = true
    const url = `/generate/upscale/image`

    const { error, data } = await useFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      body: JSON.stringify({ imgData })
    })

    if (error.value) {
      console.error('error', error.value)
      isLoading.value = false
      return
    }
    console.log('data', JSON.parse(data.value as string).image[0])
    isLoading.value = false
  }
  async function generateImage(imgData?: ImageBody) {
    isLoading.value = true
    const url = `${import.meta.env.VITE_BASE_FUNCTION_URL}/generate/image`
    const token = await getToken.value()

    const { error, data } = await useFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        mode: 'cors'
      },
      body: JSON.stringify({
        modelId: MODEL_IDS.FLUX_BASIC,
        userId: '123',
        prompt: imgData?.prompt ?? '',
        num_outputs: imgData?.noOfOutputs ?? 1,
        output_quality: imgData?.outputQuality ?? 70,
        aspect_ratio: imgData?.aspectRatio ?? '16:9',
        output_format: imgData?.outputFormat ?? 'jpg'
      })
    })
    if (error.value) {
      console.error('error', error.value)
      isLoading.value = false
      return
    }
    console.log('data', JSON.parse(data.value as string).image[0])
    isLoading.value = false
    image.value = JSON.parse(data.value as string).image[0]
  }

  return {
    generateImage,
    upscaleImage,
    colorizeImage,
    isLoading,
    image
  }
})
