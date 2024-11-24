import { storeToRefs } from 'pinia'

import type { IImageObject } from '@/types'

import { useAppStore } from '@/stores/app'
import { useDialogStore } from '@/stores/dialog'
import { useGenerateStore } from '@/stores/generate'
import { useUserStore } from '@/stores/user'

import { useFetch } from '@/composables/useFetch'

export const deleteImage = async (event: Event, imageId: string) => {
  event.stopPropagation()
  const generateStore = useGenerateStore()
  const { isDeleting, deletingImageIds } = storeToRefs(generateStore)
  const dialogStore = useDialogStore()
  const userStore = useUserStore()

  isDeleting.value = true
  deletingImageIds.value.push(imageId)
  const { userId, history } = storeToRefs(userStore)
  const url = `/image/delete`
  const { error, data } = await useFetch(url, {
    method: 'DELETE',
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
    isDeleting.value = false
    deletingImageIds.value = deletingImageIds.value.filter((id) => id === data.value.imageId)
    dialogStore.hideImage()
    history.value = history.value.filter((item: IImageObject) => item._id !== imageId)
  }
}
export const favoriteImage = async (event: Event, imageId: string) => {
  event.stopPropagation()
  const userStore = useUserStore()
  const { userId, history } = storeToRefs(userStore)
  const url = `/image/favorite`
  const { error, data } = await useFetch(url, {
    method: 'PUT',

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
    history.value = history.value.map((item: IImageObject) => {
      if (item._id === imageId) {
        return { ...item, isFavorite: data.value.isFavorite }
      }
      return item
    })
  }
}
export const downloadImage = async (event: Event, image?: string) => {
  event.stopPropagation()

  if (!image) return

  try {
    const response = await fetch(image)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `image-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    a.remove()
  } catch (error) {
    console.error('Error downloading image:', error)
  }
}

export const applyReferralCode = async (code: string) => {
  const userStore = useUserStore()
  const dialogStore = useDialogStore()
  const { userId, userDetails } = storeToRefs(userStore)
  const url = `/users/apply-referral`
  const { error, data, response } = await useFetch(url, {
    method: 'POST',
    body: JSON.stringify({
      userId: userId.value,
      userEmail: userDetails.value?.email,
      userName: userDetails.value?.userName,
      referralCode: code
    })
  }).json()

  if (error.value) {
    // Check response status and parse error message from response
    if (response.value?.status === 400) {
      const errorData = await response.value.json()
      throw new Error(errorData.message)
    }
    // Handle other types of errors
    console.error('Error:', error.value)
    throw new Error('Something went wrong')
  }
  if (data.value) {
    userStore.setCredits(data.value.credits)
    dialogStore.hideReferral()
  }
}
export const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes) return ''

  const kb = bytes / 1024
  if (kb < 1024) {
    return `${Math.round(kb)} KB`
  }

  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
}

export const openPaddleCheckout = async (priceId: string, subscribe: boolean = false) => {
  try {
    if (!window.Paddle) {
      console.error('Paddle is not initialized')
      return
    }
    const userStore = useUserStore()
    const appStore = useAppStore()
    const { isDark } = storeToRefs(appStore)
    const { userDetails } = storeToRefs(userStore)
    window.Paddle.Checkout.open({
      settings: {
        theme: `${isDark.value ? 'dark' : 'light'}`,
        locale: 'en'
      },
      customer: {
        email: userDetails.value?.email ?? ''
      },
      items: [{ priceId, quantity: 1 }],
      customData: {
        userId: userDetails.value?.userId,
        subscribe
      }
    })
  } catch (error) {
    console.error('Error opening Paddle checkout:', error)
    throw error
  }
}
