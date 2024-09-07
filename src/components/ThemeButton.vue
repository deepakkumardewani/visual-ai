<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)
</script>

<template>
  <v-btn id="theme-toggle" icon @click="appStore.toggleTheme">
    <v-icon v-if="isDark" size="xl" icon="fas fa-sun"></v-icon>
    <v-icon v-else size="xl" icon="fas fa-moon"></v-icon>
  </v-btn>
</template>
