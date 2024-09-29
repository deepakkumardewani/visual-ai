// Utilities
import { defineStore } from 'pinia'
import { useUser } from 'vue-clerk'

import { useFetch } from '@/composables/useFetch'

export const useUserStore = defineStore('user', () => {
  const { user } = useUser()
  const userId = ref('')
  const credits = ref(0)

  function setCredits(value: number) {
    credits.value = value
  }
  async function getUserDetails() {
    const url = `users/${userId.value}`
    const { error, data: userDetails } = await useFetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        mode: 'cors'
      }
    }).json()
    if (error.value) {
      console.error('Error fetching user details:', error.value)
      return
    }
    if (userDetails.value) {
      const data = userDetails.value as any
      if (localStorage.getItem('userDetails') === null) {
        localStorage.setItem('userDetails', JSON.stringify(data))
      }
      credits.value = data.credits
    }
  }
  watch(user, () => {
    if (user.value) {
      const { id, firstName, lastName } = user.value
      userId.value = `${firstName?.toLowerCase()}_${lastName?.toLowerCase()}_${id?.slice(-6)}`
      // console.log('user', userId.value)
      getUserDetails()
    }
  })
  return { userId, credits, setCredits }
})
