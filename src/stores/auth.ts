// Utilities
import { defineStore } from 'pinia'
import { useUser } from 'vue-clerk'

export const useAuthStore = defineStore('auth', () => {
  const { isLoaded, isSignedIn } = useUser()
  return { isLoaded, isSignedIn }
})
