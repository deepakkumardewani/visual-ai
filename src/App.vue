<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

import { useAppStore } from '@/stores/app'
import { useDialogStore } from '@/stores/dialog'
import { useUserStore } from '@/stores/user'

import ReferralDialog from '@/components/Dialogs/ReferralDialog.vue'

import { PADDLE_PRODUCTS } from '@/utils/constants'

const userStore = useUserStore()
const appStore = useAppStore()
const dialogStore = useDialogStore()
const { credits, isPro } = storeToRefs(userStore)
const { tab } = storeToRefs(appStore)
const route = useRoute()

// watch(user, (value) => {
// const referralCode = value?.publicMetadata?.referralCode
// if (referralCode) {
//   setLocal('referralCode', referralCode)
// }
// })

function initializePaddle() {
  if (window.Paddle) {
    window.Paddle.Environment.set('sandbox')
    window.Paddle.Initialize({
      token: import.meta.env.VITE_PADDLE_TOKEN,
      eventCallback: function (data) {
        if (data.name == 'checkout.completed' && data?.data?.items && data?.data?.items[0]) {
          const price_id = data?.data?.items[0].price_id
          const { custom_data } = data?.data as any
          if (custom_data?.subscribe) {
            isPro.value = true
          }
          const product = PADDLE_PRODUCTS.find((product) => product.priceId === price_id)
          if (product) {
            dialogStore.hideBuyCredits()
            dialogStore.hidePricing()
            window.Paddle?.Checkout.close()

            setTimeout(() => {
              const newCredits = (credits?.value ?? 0) + product.credits
              userStore.setCredits(newCredits)
            }, 700)
          }
        }
      }
    })
  }
}

onMounted(() => {
  // add dark mode for tailwind css on load
  document.documentElement.classList.add('tw-dark')
  initializePaddle()
})
</script>
<template>
  <v-app>
    <!-- make the app full screen and scrollable -->
    <v-main
      :class="{
        'tw-h-screen tw-overflow-y-hidden': route.path === '/dashboard' && tab === 1
      }"
    >
      <router-view />
      <ReferralDialog />
    </v-main>
  </v-app>
</template>

<style scoped lang="scss"></style>
