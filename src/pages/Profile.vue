<script setup lang="ts">
import { definePage } from 'unplugin-vue-router/runtime'

import Favorites from '@/components/Profile/Favorites.vue'
import UserDetails from '@/components/Profile/UserDetails.vue'

definePage({
  alias: ['/user/me'],
  name: 'profile'
})

const tab = ref(1)
</script>
<template>
  <v-tabs v-model="tab" align-tabs="center" color="deep-purple-accent-4">
    <v-tab :value="1">User</v-tab>
    <v-tab :value="2">Favorites</v-tab>
  </v-tabs>

  <v-tabs-window v-model="tab">
    <v-tabs-window-item :value="1" :transition="false">
      <v-container fluid>
        <UserDetails />
      </v-container>
    </v-tabs-window-item>

    <v-tabs-window-item :value="2" :transition="false">
      <v-container fluid>
        <Favorites />
      </v-container>
    </v-tabs-window-item>
  </v-tabs-window>
</template>
<style scoped lang="scss"></style>
