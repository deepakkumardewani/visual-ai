// Utilities
import { useFetch } from '@vueuse/core'
import { defineStore } from 'pinia'

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
  // const functionURL = `${import.meta.env.BASE_URL}/api/generate`

  // const { data: imgData, isFetching: isImageDataFetching } = useFetch(functionURL, {
  // }).json()

  async function generateImage(imgData?: ImageBody) {
    console.log(import.meta.env.VITE_BASE_FUNCTION_URL)

    isLoading.value = true
    const url = `${import.meta.env.VITE_BASE_FUNCTION_URL}/api/generate`
    const { error, data } = await useFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
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
    isLoading,
    image
  }
})
