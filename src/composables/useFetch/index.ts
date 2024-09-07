import { createFetch } from '@vueuse/core'
import { useAuth } from 'vue-clerk'

export const CANCELLED_REQUEST = 20

export const useFetch = createFetch({
  baseUrl: import.meta.env.VITE_API_BASEPATH,
  options: {
    async beforeFetch({ options }) {
      const { getToken } = useAuth()

      const token = await getToken.value()
      options.headers = {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        // 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
        'X-Requested-With': 'XMLHttpRequest', // we have to fake an "ajax" request because of authenticate puppeteer. Can be removed with that abomination.
        ...options.headers
      }
      return {
        options
      }
    },
    onFetchError(ctx) {
      if (ctx.error?.code == CANCELLED_REQUEST) {
        // 20 is the code for an abort error
        return ctx // AbortError is not a real error. We probably just changed our mind.
      }
      if (ctx.response?.status ?? 0 >= 500) {
        console.error(`API endpoint ${ctx.response?.url} returned an error: ${ctx.error}`)
      }
      return ctx
    }
  }
})
