<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import type { GroupedObject } from '@/types';

import { useCollectionsStore } from '@/stores/collections';
import { useUserStore } from '@/stores/user';

import { APP_SURFACE } from '@/utils/dashboardRoutes';

defineProps<{
  isFavorites?: boolean;
  groupedHistory?: GroupedObject[];
}>();
const router = useRouter();
const { history } = storeToRefs(useUserStore());
const { selectedCollectionId, collections } = storeToRefs(useCollectionsStore());

const selectedCollectionName = computed(
  () =>
    collections.value.find((item) => item.id === selectedCollectionId.value)?.name ??
    'this collection',
);

function create() {
  void router.push({ name: APP_SURFACE.CREATE });
}
</script>
<template>
  <div
    v-if="history.length === 0"
    class="tw-flex tw-h-full tw-items-center tw-justify-center tw-px-6"
  >
    <div class="tw-text-center">
      <p class="tw-text-sm tw-font-medium tw-text-ink">Nothing here yet</p>
      <p class="tw-mt-1 tw-text-sm tw-text-ink-muted">
        Go ahead and
        <button
          type="button"
          class="tw-font-medium tw-text-accent hover:tw-underline"
          @click="create"
        >
          create
        </button>
        something.
      </p>
    </div>
  </div>

  <div
    v-if="!isFavorites && history.length !== 0 && groupedHistory?.length === 0"
    class="tw-flex tw-h-full tw-items-center tw-justify-center tw-px-6"
  >
    <div v-if="selectedCollectionId" class="tw-max-w-sm tw-text-center">
      <p class="tw-text-sm tw-font-medium tw-text-ink">{{ selectedCollectionName }} is empty</p>
      <p class="tw-mt-1 tw-text-sm tw-text-ink-muted">
        Switch to All, select images, then use Add to collection.
      </p>
    </div>
    <p v-else class="tw-text-sm tw-text-ink-muted">No results match your filters.</p>
  </div>

  <div
    v-if="isFavorites && history.length !== 0 && groupedHistory?.length === 0"
    class="tw-flex tw-h-full tw-items-center tw-justify-center tw-px-6"
  >
    <p class="tw-text-sm tw-text-ink-muted">You have not added any favorites yet.</p>
  </div>
</template>
<style scoped lang="scss"></style>
