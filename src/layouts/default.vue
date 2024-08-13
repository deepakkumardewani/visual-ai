<script lang="ts" setup>
import { useRoute } from 'vue-router'

import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'

const route = useRoute()
</script>
<template>
  <v-app>
    <AppHeader v-if="route.path !== '/login'" />
    <v-main>
      <router-view />
    </v-main>
    <div class="d-flex justify-center mb-12" style="z-index: 1">
      <!-- <v-btn>helo</v-btn> -->
      <iframe
        src="//www.topcreativeformat.com/902df83ba8e546bcd7a1e3781cde1806/invoke.js"
        height="60"
        width="468"
        frameborder="0"
        scrolling="no"
      ></iframe>
    </div>
    <AppFooter v-if="route.path !== '/login'" />
  </v-app>
</template>
