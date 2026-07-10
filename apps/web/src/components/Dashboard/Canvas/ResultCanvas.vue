<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { FeatureType } from '@/types';

import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';

import CommunityFeed from '@/components/Dashboard/Canvas/CommunityFeed.vue';
import UserGenerationsGrid from '@/components/Dashboard/Feed/UserGenerationsGrid.vue';

const generateStore = useGenerateStore();
const userStore = useUserStore();
const { isLoading } = storeToRefs(generateStore);
const { history } = storeToRefs(userStore);

const hasSavedGenerations = computed(() =>
  history.value.some((item) => item.featureType === FeatureType.IMAGE),
);

// New generations stream into the feed in place, so the feed stays mounted
// while loading — the community feed only fills the true empty state.
const showCommunityFeed = computed(() => !isLoading.value && !hasSavedGenerations.value);
</script>

<template>
  <div data-testid="result-canvas" class="result-canvas tw-w-full tw-bg-canvas">
    <CommunityFeed v-if="showCommunityFeed" />
    <UserGenerationsGrid v-else />
  </div>
</template>
