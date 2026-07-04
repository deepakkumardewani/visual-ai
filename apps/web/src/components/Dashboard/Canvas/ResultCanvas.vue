<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { FeatureType } from '@/types';

import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';

import CommunityFeed from '@/components/Dashboard/Canvas/CommunityFeed.vue';
import UserGenerationsGrid from '@/components/Dashboard/Feed/UserGenerationsGrid.vue';
import ResultColumn from '@/components/ResultColumn.vue';

const generateStore = useGenerateStore();
const userStore = useUserStore();
const { isLoading, images } = storeToRefs(generateStore);
const { history } = storeToRefs(userStore);

const hasActiveResults = computed(
  () => images.value.length > 0 && Boolean(images.value[0]?.aiImageUrl),
);

const hasSavedGenerations = computed(() =>
  history.value.some((item) => item.featureType === FeatureType.IMAGE),
);

const showCommunityFeed = computed(() => {
  if (isLoading.value || hasActiveResults.value) return false;
  return !hasSavedGenerations.value;
});

const showUserHistory = computed(
  () => !isLoading.value && !hasActiveResults.value && hasSavedGenerations.value,
);
</script>

<template>
  <div data-testid="result-canvas" class="result-canvas tw-h-full tw-w-full tw-bg-canvas">
    <CommunityFeed v-if="showCommunityFeed" />
    <UserGenerationsGrid v-else-if="showUserHistory" />
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
