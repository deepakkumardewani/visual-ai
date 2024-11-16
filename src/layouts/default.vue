<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/Header/AppHeader.vue'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const { isDark } = storeToRefs(useAppStore())
const isHeaderVisible = computed(() => {
  return route.path !== '/signin' && route.path !== '/login' && route.path !== '/signup'
})
const isFooterVisible = computed(() => {
  return (
    route.path !== '/signin' &&
    route.path !== '/login' &&
    route.path !== '/signup' &&
    route.path !== '/dashboard'
  )
})
</script>
<template>
  <v-app :class="isDark ? 'dark-bg' : 'light-bg'">
    <AppHeader v-if="isHeaderVisible" />

    <v-main>
      <router-view />
    </v-main>

    <v-divider v-if="isFooterVisible" class="tw-w-full" thickness="1"></v-divider>
    <AppFooter v-if="isFooterVisible" />
  </v-app>
</template>

<style scoped lang="scss">
.dark-bg {
  background: linear-gradient(to bottom, #20112d, #19063a);
}
.light-bg {
  background: linear-gradient(to bottom, #f0f0f0, #e0e0e0);
}
</style>
