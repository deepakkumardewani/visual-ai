<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useAppStore } from '@/stores/app'

import AIImageAside from './AIImageAside.vue'
import ColorizeImageAside from './ColorizeImageAside.vue'
import ReviveOldAside from './ReviveOldAside.vue'
import UpscaleImageAside from './UpscaleImageAside.vue'

const appStore = useAppStore()
const { feature } = storeToRefs(appStore)
</script>
<template>
  <div class="pa-4 dark:tw-bg-neutral-900 tw-rounded bg-asideBg tw-h-full tw-overflow-y-auto">
    <AIImageAside v-if="feature === 'ai_image'" />
    <UpscaleImageAside v-if="feature === 'image_upscaler'" />
    <ReviveOldAside v-if="feature === 'revive_old_photos'" />
    <ColorizeImageAside v-if="feature === 'colorize_image'" />
  </div>
</template>

<style scoped lang="scss"></style>
