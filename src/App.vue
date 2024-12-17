<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import { useAppStore } from '@/stores/app'
import { useDialogStore } from '@/stores/dialog'
import { useUserStore } from '@/stores/user'

import AppFooter from '@/components/AppFooter.vue'
import ReferralDialog from '@/components/Dialogs/ReferralDialog.vue'
import AppHeader from '@/components/Header/AppHeader.vue'

import { PADDLE_PRODUCTS } from '@/utils/constants'

const userStore = useUserStore()
const appStore = useAppStore()
const dialogStore = useDialogStore()
const { credits, isPro, hasJustSubscribed } = storeToRefs(userStore)
const { tab } = storeToRefs(appStore)
const route = useRoute()
const router = useRouter()

const { isDark } = storeToRefs(useAppStore())
const isHeaderVisible = computed(() => {
  return route.path !== '/signin' && route.path !== '/login' && route.path !== '/signup'
})
const isFooterVisible = computed(() => {
  return (
    route.path !== '/signin' &&
    route.path !== '/login' &&
    route.path !== '/signup' &&
    route.path !== '/dashboard'
  )
})

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
            window.Paddle?.Checkout.close()
            hasJustSubscribed.value = true
            router.push('/dashboard')
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
  <!-- <v-app>
    <v-main
      :class="{
        'tw-h-screen tw-overflow-y-hidden': route.path === '/dashboard' && tab === 1
      }"
    >
      <router-view />
      <ReferralDialog />
    </v-main>
  </v-app> -->

  <v-app :class="isDark ? 'dark-bg' : 'light-bg'">
    <AppHeader v-if="isHeaderVisible" />
    <v-main
      :class="{
        'tw-h-[98vh] tw-overflow-y-hidden': route.path === '/dashboard' && tab === 1
      }"
    >
      <router-view />
      <ReferralDialog />
    </v-main>
    <div class="tw-relative tw-flex tw-py-1 tw-items-center">
      <div class="tw-flex-grow tw-border-t tw-border-neutral-600"></div>
    </div>
    <AppFooter v-if="isFooterVisible" />
  </v-app>
</template>

<style scoped lang="scss">
.dark-bg {
  background: linear-gradient(to bottom, #20112d, #19063a);
}
.light-bg {
  background: linear-gradient(to bottom, #fafafa, #f4e9fb);
}
</style>
