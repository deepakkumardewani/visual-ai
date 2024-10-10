<script setup lang="ts">
import { storeToRefs } from 'pinia'

import Aside from '@/components/Aside/Aside.vue'
import History from '@/components/History.vue'
import ResultColumn from '@/components/ResultColumn.vue'
import { useAppStore } from '@/stores/app'

// import historyData from '@/utils/history.json'

const appStore = useAppStore()
const { tab } = storeToRefs(appStore)
</script>
<template>
  <v-tabs-window v-model="tab">
    <v-tabs-window-item :value="1">
      <div class="pa-2 sm:tw-flex tw-h-screen dashboard">
        <div class="tw-w-full sm:tw-w-1/4 tw-p-4">
          <Aside />
        </div>

        <div class="tw-w-full sm:tw-w-3/4 tw-h-[55%] sm:tw-h-full tw-overflow-y-auto tw-p-4">
          <ResultColumn />
        </div>
      </div>
    </v-tabs-window-item>
    <v-tabs-window-item :value="2">
      <History />
    </v-tabs-window-item>
  </v-tabs-window>
</template>

<style scoped lang="scss">
.dashboard {
  max-height: calc(100vh - 50px) !important;
}
:deep(.v-skeleton-loader) {
  height: 100%;
  width: 100%;
  .v-skeleton-loader__image {
    height: 100%;
  }
}
</style>
