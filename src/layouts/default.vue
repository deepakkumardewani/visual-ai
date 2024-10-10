<script lang="ts" setup>
import { useRoute } from 'vue-router'

import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/Header/AppHeader.vue'

const route = useRoute()

const isHeaderVisible = computed(() => {
  return route.path !== '/signin' && route.path !== '/signup'
})
const isFooterVisible = computed(() => {
  return route.path !== '/signin' && route.path !== '/signup' && route.path !== '/dashboard'
})
</script>
<template>
  <v-app>
    <AppHeader v-if="isHeaderVisible" />
    <v-main>
      <router-view />
      <v-divider />
    </v-main>

    <AppFooter v-if="isFooterVisible" />
  </v-app>
</template>
