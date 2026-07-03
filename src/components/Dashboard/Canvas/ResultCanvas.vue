<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed } from "vue";

import { useGenerateStore } from "@/stores/generate";

import CommunityFeed from "@/components/Dashboard/Canvas/CommunityFeed.vue";
import ResultColumn from "@/components/ResultColumn.vue";

const generateStore = useGenerateStore();
const { isLoading, images } = storeToRefs(generateStore);

const showCommunityFeed = computed(() => {
  if (isLoading.value) return false;
  if (images.value.length === 0) return true;
  return !images.value[0]?.aiImageUrl;
});
</script>

<template>
  <div data-testid="result-canvas" class="result-canvas tw-h-full tw-w-full tw-bg-canvas">
    <CommunityFeed v-if="showCommunityFeed" />
    <ResultColumn v-else />
  </div>
</template>

<style scoped lang="scss">
:deep(.v-skeleton-loader) {
  height: 100%;
  width: 100%;

  .v-skeleton-loader__image {
    height: 100%;
  }
}
</style>
