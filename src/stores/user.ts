import { defineStore } from 'pinia'
import { useUser } from 'vue-clerk'

import { useFetch } from '@/composables/useFetch'
import { IImageObject } from '@/stores/generate'

interface User {
  userId: string
  userName: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  referralCode: string
  referredBy: string
  credits: number
  plan: string
  monthlyCredits: number
  isPro: boolean
  subscriptionEnd: Date
  payments: any[]
  history: IImageObject[]
  activities: any[]
  createdAt: Date
  updatedAt: Date
}
// interface Image {
//   user: string
//   prompt: string
//   imageUrl: string
//   original: string
//   enhanced: string
//   isFavorite: boolean
//   human_readable_date: string
//   resolution: string
//   createdAt: Date
//   creditCost: number
//   width: number
//   height: number
//   format: string
//   bytes: number
// }
export const useUserStore = defineStore('user', () => {
  const { user } = useUser()
  const userDetails = ref<User | null>(null)
  const history = ref<IImageObject[]>([])
  const userId = ref('')
  const credits = ref(0)
  const isPro = ref(false)

  function setCredits(value: number) {
    credits.value = value
  }
  async function getUserDetails() {
    const url = `users/${userId.value}`
    const { error, data: userData } = await useFetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        mode: 'cors'
      }
    }).json<User>()

    if (userData.value) {
      userDetails.value = userData.value
      history.value = userData.value.history
      isPro.value = userData.value.isPro
      const dataToStoreInLocalStorage = {
        userId: userData.value.userId
      }
      if (localStorage.getItem('userDetails') === null) {
        localStorage.setItem('userDetails', JSON.stringify(dataToStoreInLocalStorage))
      }
      credits.value = userData.value.credits
    }
    if (error.value) {
      console.error('Error fetching user details:', error.value)
      return
    }
  }
  watch(user, () => {
    if (user.value) {
      const { id } = user.value
      userId.value = id
      getUserDetails()
    }
  })
  return { userId, credits, setCredits, userDetails, history, isPro }
})
