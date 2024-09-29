<script setup lang="ts">
import Aside from '@/components/Aside/Aside.vue'
import ResultColumn from '@/components/ResultColumn.vue'
</script>
<template>
  <div class="pa-2 sm:tw-flex tw-h-screen dashboard">
    <div class="tw-w-full sm:tw-w-1/4 tw-p-4">
      <Aside />
    </div>

    <div class="tw-w-full sm:tw-w-3/4 tw-h-[55%] sm:tw-h-full tw-overflow-y-auto tw-p-4">
      <ResultColumn />
    </div>
  </div>
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
