import { storeToRefs } from 'pinia'

import { useFetch } from '@/composables/useFetch'
import { useAppStore } from '@/stores/app'
import { useGenerateStore } from '@/stores/generate'
import { useUserStore } from '@/stores/user'

export const deleteImage = (event: Event, imageId: string) => {
  event.stopPropagation()
  // Implement delete functionality
  console.log('Deleting image:', imageId)
}
export const favoriteImage = async (event: Event, imageId: string) => {
  event.stopPropagation()
  const userStore = useUserStore()
  const { userId, history } = storeToRefs(userStore)
  const url = `/image/favorite`
  const { error, data } = await useFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      mode: 'cors'
    },
    body: JSON.stringify({
      imageId,
      userId: userId.value
    })
  }).json()
  if (error.value) {
    console.error('error', error.value)
    return
  }
  if (data.value) {
    console.log('data', data.value)
    history.value = history.value.map((item) => {
      if (item._id === imageId) {
        return { ...item, isFavorite: data.value.isFavorite }
      }
      return item
    })
  }
}
export const downloadImage = (event: Event, imgUrl?: string) => {
  event.stopPropagation()
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
