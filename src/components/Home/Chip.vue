<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)

defineProps<{
  text: string
  icon?: string
}>()
</script>
<template>
  <v-chip
    v-motion-pop-visible-once
    class="my-2"
    :color="isDark ? 'purple-lighten-2' : 'purple-darken-2'"
    label
  >
    <v-icon v-if="icon" :icon="icon" start class="tw-mr-2" />
    {{ text }}
  </v-chip>
</template>
<style scoped lang="scss"></style>
