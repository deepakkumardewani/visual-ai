<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

import { useAppStore } from '@/stores/app'

import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/Header/AppHeader.vue'

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
    <div class="tw-relative tw-flex tw-py-1 tw-items-center">
      <div class="tw-flex-grow tw-border-t tw-border-neutral-600"></div>
    </div>
    <AppFooter v-if="isFooterVisible" />
  </v-app>
</template>

<style scoped lang="scss">
.dark-bg {
  background: linear-gradient(to bottom, #20112d, #19063a);
}
.light-bg {
  background: linear-gradient(to bottom, #fafafa, #f4e9fb);
}
</style>
