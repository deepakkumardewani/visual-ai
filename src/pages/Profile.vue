<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAppStore } from '@/stores/app'

import History from '@/components/History.vue'
import Payments from '@/components/Profile/Payments.vue'
import Subscription from '@/components/Profile/Subscription.vue'
import UserDetails from '@/components/Profile/UserDetails.vue'

const route = useRoute()
const router = useRouter()
const tab = ref(1)

const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)

const TabMap = {
  user: 1,
  favorites: 2,
  payments: 3,
  subscription: 4
}

const handleTabChange = (newTab: number) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tabQuery = Object.entries(TabMap).find(([_, value]) => value === newTab)?.[0]

  if (tabQuery) {
    router.replace({
      query: {
        ...route.query,
        tab: tabQuery
      }
    })
  }
}

onMounted(() => {
  const tabQuery = route.query.tab
  if (tabQuery) {
    tab.value = TabMap[tabQuery as keyof typeof TabMap]
  }
})

watch(route, (newRoute) => {
  const tabQuery = newRoute.query.tab
  if (tabQuery) {
    tab.value = TabMap[tabQuery as keyof typeof TabMap]
  }
})
</script>

<template>
  <v-tabs
    v-model="tab"
    align-tabs="center"
    color="deep-purple-accent-4"
    :class="isDark ? 'tw-bg-black' : 'tw-bg-white'"
    @update:modelValue="(v: unknown) => handleTabChange(v as number)"
  >
    <v-tab :value="1">User</v-tab>
    <v-tab :value="2">Favorites</v-tab>
    <v-tab :value="3">Payments</v-tab>
    <v-tab :value="4">Subscription</v-tab>
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
      <History :is-favorites="true" />
    </v-tabs-window-item>

    <v-tabs-window-item :value="3">
      <v-container fluid>
        <Payments />
      </v-container>
    </v-tabs-window-item>

    <v-tabs-window-item :value="4">
      <v-container fluid>
        <Subscription />
      </v-container>
    </v-tabs-window-item>
  </v-tabs-window>
</template>
<style scoped lang="scss"></style>
