<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useExploreStore } from '@/stores/explore';
import { useUserStore } from '@/stores/user';

import ImageViewer from '@/components/Explore/ImageViewer.vue';

import { APP_SURFACE } from '@/utils/dashboardRoutes';

const route = useRoute();
const router = useRouter();
const exploreStore = useExploreStore();
const userStore = useUserStore();

const { activeItem, isLoading, isLoadingItem, error } = storeToRefs(exploreStore);
const { userId } = storeToRefs(userStore);

const routeId = computed(() => String(route.params.id ?? ''));

watch(
  [routeId, userId],
  async ([id, uid]) => {
    if (!id) return;
    if (!uid) {
      // Feed API requires auth; send signed-out users to sign in.
      void router.replace({ name: 'signin', query: { redirect: route.fullPath } });
      return;
    }
    await exploreStore.ensureItem(id);
  },
  { immediate: true },
);

function goBackToExplore() {
  void router.push({ name: APP_SURFACE.EXPLORE });
}
</script>

<template>
  <div data-testid="explore-image-page" class="tw-h-[100dvh] tw-overflow-hidden tw-bg-canvas">
    <div
      v-if="(isLoading || isLoadingItem) && !activeItem"
      class="tw-flex tw-min-h-[100dvh] tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-px-4"
      aria-busy="true"
      aria-label="Loading image"
    >
      <div
        class="tw-h-48 tw-w-48 tw-animate-pulse tw-rounded-card tw-bg-surface-2 sm:tw-h-72 sm:tw-w-72"
      />
      <p class="tw-text-sm tw-text-ink-muted">Loading creation…</p>
    </div>

    <div
      v-else-if="error && !activeItem"
      role="alert"
      class="tw-mx-auto tw-flex tw-min-h-[100dvh] tw-max-w-md tw-flex-col tw-items-center tw-justify-center tw-gap-4 tw-px-5 tw-text-center"
    >
      <p class="tw-text-sm tw-text-ink-muted">{{ error }}</p>
      <button
        type="button"
        class="tw-min-h-11 tw-rounded-chip tw-bg-surface-2 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-ink hover:tw-bg-surface-3"
        @click="goBackToExplore"
      >
        Back to Explore
      </button>
    </div>

    <ImageViewer v-else-if="activeItem" :item="activeItem" />
  </div>
</template>
