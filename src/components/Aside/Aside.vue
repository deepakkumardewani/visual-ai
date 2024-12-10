<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

import { useAppStore } from '@/stores/app'

import AIImageAside from './AIImageAside.vue'
import ColorizeImageAside from './ColorizeImageAside.vue'
import ReviveOldAside from './ReviveOldAside.vue'
import UpscaleImageAside from './UpscaleImageAside.vue'

const appStore = useAppStore()
const { feature } = storeToRefs(appStore)

const route = useRoute()

onMounted(() => {
  console.log(route)
})
</script>
<template>
  <div
    class="pa-3 dark:tw-bg-[#170220] tw-bg-[#efebf3] tw-rounded tw-h-full tw-overflow-y-auto no-scrollbar"
  >
    <AIImageAside v-if="feature === 'ai_image'" />
    <UpscaleImageAside v-if="feature === 'image_upscaler'" />
    <ReviveOldAside v-if="feature === 'revive_old_photos'" />
    <ColorizeImageAside v-if="feature === 'colorize_image'" />
  </div>
</template>

<style scoped lang="scss"></style>
