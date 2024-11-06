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
  <v-app :class="isDark ? 'purple-gradient' : ''">
    <AppHeader v-if="isHeaderVisible" />

    <v-main>
      <router-view />
      <v-divider></v-divider>
    </v-main>
    <AppFooter v-if="isFooterVisible" />
  </v-app>
</template>

<style scoped lang="scss">
.purple-gradient {
  background: linear-gradient(to bottom, #20112d, #19063a);
}
</style>
