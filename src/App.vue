<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useUser } from 'vue-clerk'
import { useRoute } from 'vue-router'

import { useLocal } from '@/composables/local'
import { useAppStore } from '@/stores/app'

const { user } = useUser()

const appStore = useAppStore()
const { tab } = storeToRefs(appStore)
const route = useRoute()
const { setLocal, getLocal } = useLocal()

watch(user, (value) => {
  console.log('user', value)
  const referralCode = value?.publicMetadata?.referralCode
  if (referralCode) {
    setLocal('referralCode', referralCode)
  }
})
onMounted(() => {
  // add dark mode for tailwind css on load

  document.documentElement.classList.add('tw-dark')
  const details = getLocal('details')
  if (!details) {
    setLocal('details', { prompt: '', image: '', isImageGenerated: false })
  }
})
</script>
<template>
  <v-app>
    <!-- make the app full screen and scrollable -->
    <v-main
      :class="{ 'tw-h-screen tw-overflow-y-hidden': route.path === '/dashboard' && tab === 1 }"
    >
      <router-view />
    </v-main>
  </v-app>
</template>
