<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { definePage } from 'unplugin-vue-router/runtime'

import { useAppStore } from '@/stores/app'

import Favorites from '@/components/Profile/Favorites.vue'
import Payments from '@/components/Profile/Payments.vue'
import UserDetails from '@/components/Profile/UserDetails.vue'

definePage({
  alias: ['/profile'],
  name: 'profile'
})

const tab = ref(1)

const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)
</script>
<template>
  <v-tabs v-model="tab" align-tabs="center" color="deep-purple-accent-4" class="tw-bg-black">
    <v-tab :value="1">User</v-tab>
    <v-tab :value="2">Favorites</v-tab>
    <v-tab :value="3">Payments</v-tab>
  </v-tabs>

  <v-tabs-window
    v-model="tab"
    class="tw-h-[calc(100vh-60px)]"
    :class="isDark ? 'tw-bg-black' : 'tw-bg-white'"
  >
    <v-tabs-window-item :value="1">
      <v-container fluid>
        <UserDetails />
      </v-container>
    </v-tabs-window-item>

    <v-tabs-window-item :value="2">
      <v-container fluid>
        <Favorites />
      </v-container>
    </v-tabs-window-item>

    <v-tabs-window-item :value="3">
      <v-container fluid>
        <Payments />
      </v-container>
    </v-tabs-window-item>
  </v-tabs-window>
</template>
<style scoped lang="scss"></style>
