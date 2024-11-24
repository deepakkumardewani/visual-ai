<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)

defineProps<{
  disabled: boolean
}>()
</script>
<template>
  <v-btn :disabled="disabled" :color="isDark ? '#6b21a8' : '#9333ea'" block dark>Create</v-btn>
</template>
