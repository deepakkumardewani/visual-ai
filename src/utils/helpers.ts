import { storeToRefs } from 'pinia'

import { useAppStore } from '@/stores/app'
import { useGenerateStore } from '@/stores/generate'

export const downloadImage = (imgUrl?: string) => {
  const appStore = useAppStore()

  const generateStore = useGenerateStore()
  const { image, enhancedImage } = storeToRefs(generateStore)
  const { feature } = storeToRefs(appStore)
  let imageUrl = imgUrl
  if (!imageUrl) {
    if (feature.value === 'ai_image') {
      imageUrl = image.value
    } else if (feature.value === 'image_upscaler' || feature.value === 'colorize_image') {
      imageUrl = enhancedImage.value
    }
  }

  if (imageUrl) {
    fetch(imageUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = 'generated_image.png'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      })
      .catch((error) => console.error('Error downloading image:', error))
  }
}
