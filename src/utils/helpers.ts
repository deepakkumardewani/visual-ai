import { storeToRefs } from 'pinia'

import type { IImageObject } from '@/types'

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
    isDeleting.value = false
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
  const generateStore = useGenerateStore()
  const { isFavoriting } = storeToRefs(generateStore)
  const userStore = useUserStore()
  const { userId, history } = storeToRefs(userStore)
  isFavoriting.value = true
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
    isFavoriting.value = false
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
  isFavoriting.value = false
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
    a.download = `image-${Date.now()}.${image.split('.').pop()}`
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
    headers: {
      'Content-Type': 'application/json',
      mode: 'cors'
    },
    body: JSON.stringify({
      userId: userId.value,
      userEmail: userDetails.value?.email,
      userName: userDetails.value?.userName,
      referralCode: code
    })
  }).json()
  if (data.value) {
    userStore.setCredits(data.value.credits)
    dialogStore.hideReferral()
  }

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
}
export const contactForm = async (formData: any) => {
  const url = `/users/contact`
  const { error, data, response } = await useFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      mode: 'cors'
    },
    body: JSON.stringify({
      name: formData.name,
      email: formData.email,
      subject: formData.subject,
      message: formData.message
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
    console.log('data', data.value)
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
