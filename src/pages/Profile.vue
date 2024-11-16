<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { definePage } from 'unplugin-vue-router/runtime'

import Favorites from '@/components/Profile/Favorites.vue'
import UserDetails from '@/components/Profile/UserDetails.vue'
import { useAppStore } from '@/stores/app'

definePage({
  alias: ['/user/me'],
  name: 'profile'
})

const tab = ref(1)

const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)
</script>
<template>
  <v-tabs v-model="tab" align-tabs="center" color="deep-purple-accent-4">
    <v-tab :value="1">User</v-tab>
    <v-tab :value="2">Favorites</v-tab>
  </v-tabs>

  <v-tabs-window v-model="tab" class="tw-h-[calc(100vh-60px)]" :class="isDark ? 'tw-bg-black' : ''">
    <v-tabs-window-item :value="1">
      <v-container fluid>
        <UserDetails />
      </v-container>
    </v-tabs-window-item>

    <v-tabs-window-item :value="2" class="tw-h-full tw-flex tw-justify-center tw-items-center">
      <v-container fluid>
        <Favorites />
      </v-container>
    </v-tabs-window-item>
  </v-tabs-window>
</template>
<style scoped lang="scss"></style>
