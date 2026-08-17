<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { FeatureType } from '@/types';

import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';

import StarterPromptsGrid from '@/components/Dashboard/Canvas/StarterPromptsGrid.vue';
import UserGenerationsGrid from '@/components/Dashboard/Feed/UserGenerationsGrid.vue';

const generateStore = useGenerateStore();
const userStore = useUserStore();
const { isLoading } = storeToRefs(generateStore);
const { history, isReady: isUserReady } = storeToRefs(userStore);

const hasSavedGenerations = computed(() =>
  history.value.some((item) => item.featureType === FeatureType.IMAGE),
);

// Wait for user history sync before choosing empty-state vs creations —
// otherwise the starter grid flashes for users who already have generations.
const showStarterPrompts = computed(
  () => isUserReady.value && !isLoading.value && !hasSavedGenerations.value,
);
</script>

<template>
  <div data-testid="result-canvas" class="result-canvas tw-w-full tw-bg-canvas">
    <div
      v-if="!isUserReady"
      data-testid="result-canvas-loading"
      aria-busy="true"
      aria-label="Loading your creations"
      class="tw-px-4 tw-pb-12 tw-pt-6 sm:tw-px-6"
    >
      <div class="tw-mb-6 tw-flex tw-items-baseline tw-gap-2.5">
        <div class="tw-h-6 tw-w-36 tw-animate-pulse tw-rounded tw-bg-surface-2" />
        <div class="tw-h-5 tw-w-8 tw-animate-pulse tw-rounded-full tw-bg-surface-2" />
      </div>
      <div class="tw-flex tw-flex-col tw-gap-8">
        <div class="tw-flex tw-flex-col tw-gap-3">
          <div class="tw-h-4 tw-w-2/3 tw-max-w-md tw-animate-pulse tw-rounded tw-bg-surface-2" />
          <div class="tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-grid-cols-3">
            <div
              v-for="n in 3"
              :key="n"
              class="tw-aspect-[4/3] tw-animate-pulse tw-rounded-card tw-bg-surface-2"
            />
          </div>
        </div>
      </div>
    </div>
    <StarterPromptsGrid v-else-if="showStarterPrompts" />
    <UserGenerationsGrid v-else />
  </div>
</template>
