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
      <div @click="appStore.toggleTheme" v-bind="props" class="tw-cursor-pointer">
        <v-icon size="small" :icon="isDark ? 'fas fa-sun' : 'fas fa-moon'"></v-icon>
      </div>
    </template>
  </v-tooltip>
</template>
