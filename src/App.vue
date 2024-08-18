<script lang="ts" setup>
import { useLocal } from '@/composables/local'

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
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
