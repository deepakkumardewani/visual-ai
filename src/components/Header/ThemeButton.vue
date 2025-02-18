<script setup lang="ts">
import { faMoon, faSun } from '@/plugins/icons'
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
        <font-awesome-icon :icon="isDark ? faSun : faMoon" class="tw-text-sm" />
      </div>
    </template>
  </v-tooltip>
</template>
