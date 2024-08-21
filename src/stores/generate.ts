// Utilities
import { useFetch } from '@vueuse/core'
import { defineStore } from 'pinia'

export const PROMPTS = [
  'A futuristic cityscape at night with neon lights and flying cars.',
  'A cozy cabin in the woods during a snowy winter evening.',
  'An enchanted forest filled with glowing mushrooms and mythical creatures.',
  'A majestic dragon soaring above a medieval castle at sunset.',
  'A steampunk-inspired airship floating over a bustling Victorian-era city.',
  'A serene beach at sunrise with palm trees and gentle waves.',
  'A dystopian landscape with abandoned skyscrapers and overgrown vegetation.',
  'A magical library with floating books and glowing orbs of light.',
  'A vibrant underwater scene with colorful coral reefs and diverse marine life.',
  'A group of adventurers exploring ancient ruins in a dense jungle.',
  'A futuristic robot in a sleek, high-tech laboratory.',
  'A surreal dreamscape with floating islands and impossible landscapes.',
  'A tranquil Japanese garden with a stone bridge and koi pond.',
  'A warrior in ornate armor standing on a battlefield at dawn.',
  'A cozy coffee shop interior with warm lighting and people reading books.',
  'A gothic cathedral with intricate stained glass windows and dark shadows.',
  'A futuristic sports car racing down a winding mountain road.',
  'A fantasy village built into the side of a mountain with waterfalls.',
  'A grand ballroom filled with elegantly dressed dancers under a chandelier.',
  'A post-apocalyptic wasteland with a lone survivor walking through the ruins.'
]

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

  async function generateImage(imgData?: ImageBody) {
    isLoading.value = true
    const url = `${import.meta.env.VITE_BASE_FUNCTION_URL}/images/generate`
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
