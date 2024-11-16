<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useUser } from 'vue-clerk'
import { useRoute } from 'vue-router'

import ReferralDialog from '@/components/Dialogs/ReferralDialog.vue'
import { useLocal } from '@/composables/local'
import { useAppStore } from '@/stores/app'
import { useDialogStore } from '@/stores/dialog'

const { user } = useUser()
const appStore = useAppStore()
const dialogStore = useDialogStore()

const { tab } = storeToRefs(appStore)
const route = useRoute()
const { setLocal, getLocal } = useLocal()

watch(user, (value) => {
  const referralCode = value?.publicMetadata?.referralCode
  if (referralCode) {
    setLocal('referralCode', referralCode)
  }
})

function initializePaddle() {
  if (window.Paddle) {
    window.Paddle.Environment.set('sandbox')
    window.Paddle.Initialize({
      token: 'test_2df34569fd84de9cd178e282cfa',
      eventCallback: function (data) {
        if (data.name == 'checkout.completed') {
          console.log(data)
          dialogStore.hideBuyCredits()
        }
      }
    })
  }
}

onMounted(() => {
  // add dark mode for tailwind css on load
  document.documentElement.classList.add('tw-dark')
  const details = getLocal('details')
  if (!details) {
    setLocal('details', { prompt: '', image: '', isImageGenerated: false })
  }
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
