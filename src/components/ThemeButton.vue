<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)
</script>

<template>
  <v-tooltip
    location="bottom"
    open-delay="1000"
    :text="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
  >
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" id="theme-toggle" icon @click="appStore.toggleTheme">
        <v-icon v-if="isDark" size="xl" icon="fas fa-sun"></v-icon>
        <v-icon v-else size="xl" icon="fas fa-moon"></v-icon>
      </v-btn>
    </template>
  </v-tooltip>
</template>
