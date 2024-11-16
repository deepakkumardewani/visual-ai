<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'

import Aside from '@/components/Aside/Aside.vue'
import Tabs from '@/components/Header/Tabs.vue'
import History from '@/components/History.vue'
import ResultColumn from '@/components/ResultColumn.vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)
const { tab } = storeToRefs(appStore)
const route = useRoute()
const { mobile } = useDisplay()
</script>
<template>
  <div class="bg-asideBg tw-mt-1" v-if="route.path === '/dashboard' && mobile">
    <Tabs />
    <v-divider />
  </div>
  <v-tabs-window v-model="tab" :class="isDark ? 'tw-bg-black' : ''">
    <v-tabs-window-item :value="1" :transition="false" :reverse-transition="false">
      <div class="sm:tw-flex tw-h-screen dashboard">
        <div class="tw-w-full sm:tw-w-1/4 tw-p-1 tw-pb-2">
          <Aside />
        </div>

        <div class="tw-w-full sm:tw-w-3/4 tw-h-full tw-overflow-y-auto tw-p-1 tw-pb-2 no-scrollbar">
          <ResultColumn />
        </div>
      </div>
    </v-tabs-window-item>
    <v-tabs-window-item
      :value="2"
      :transition="false"
      :reverse-transition="false"
      class="tw-h-[calc(100vh-60px)]"
    >
      <History />
    </v-tabs-window-item>
  </v-tabs-window>
</template>

<style scoped lang="scss">
.dashboard {
  max-height: calc(100vh - 60px) !important;
}
:deep(.v-skeleton-loader) {
  height: 100%;
  width: 100%;
  .v-skeleton-loader__image {
    height: 100%;
  }
}
</style>
