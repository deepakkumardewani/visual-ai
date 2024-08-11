<script lang="ts" setup>
import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
import { useRoute } from 'vue-router'
const route = useRoute()
</script>
<template>
  <v-app>
    <AppHeader v-if="route.path !== '/login'" />
    <v-main>
      <router-view />
    </v-main>
    <AppFooter v-if="route.path !== '/login'" />
  </v-app>
</template>
