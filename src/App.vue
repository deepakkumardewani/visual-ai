<script lang="ts" setup>
import { useRoute } from 'vue-router'

import { useLocal } from '@/composables/local'

const route = useRoute()
const { setLocal, getLocal } = useLocal()
onMounted(() => {
  const details = getLocal('details')
  if (!details) {
    setLocal('details', { prompt: '', image: '', isImageGenerated: false })
  }
})
</script>
<template>
  <v-app>
    <v-main :class="{ 'tw-h-screen tw-overflow-y-hidden': route.path === '/dashboard' }">
      <router-view />
    </v-main>
  </v-app>
</template>
