<script setup lang="ts">
import { faDownload, fasHeart, faTrashAlt } from '@/plugins/icons';
import { storeToRefs } from 'pinia';

import { IImageObject } from '@/types';

import { useGenerateStore } from '@/stores/generate';

import { bulkDelete, bulkDownload, bulkFavorite } from '@/utils/helpers';

const generateStore = useGenerateStore();
const { isDeleting, isFavoriting } = storeToRefs(generateStore);

const props = defineProps<{
  selectedImages: IImageObject[];
}>();

const isBusy = computed(() => isDeleting.value || isFavoriting.value);

const handleBulkDelete = async () => {
  await bulkDelete(props.selectedImages);
};
const handleBulkFavorite = async () => {
  await bulkFavorite(props.selectedImages);
};
const handleBulkDownload = async () => {
  await bulkDownload(props.selectedImages);
};
</script>
<template>
  <div class="tw-flex tw-items-center tw-gap-2">
    <button type="button" class="bulk-btn" :disabled="isBusy" @click="handleBulkDownload">
      <font-awesome-icon :icon="faDownload" class="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
      <span class="tw-hidden sm:tw-inline">Download</span>
    </button>

    <button type="button" class="bulk-btn" :disabled="isBusy" @click="handleBulkFavorite">
      <font-awesome-icon :icon="fasHeart" class="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
      <span class="tw-hidden sm:tw-inline">Favorite</span>
    </button>

    <button
      type="button"
      class="bulk-btn bulk-btn--danger"
      :disabled="isBusy"
      @click="handleBulkDelete"
    >
      <font-awesome-icon :icon="faTrashAlt" class="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
      <span class="tw-hidden sm:tw-inline">Delete</span>
    </button>
  </div>
</template>
<style scoped lang="scss">
.bulk-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 36px;
  padding: 0 0.875rem;
  border: 1px solid rgb(var(--tw-hairline));
  border-radius: 9999px;
  background: rgb(var(--tw-surface-2));
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--tw-ink));
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover:not(:disabled) {
    background: rgb(var(--tw-surface-3));
    border-color: rgba(201, 138, 90, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.bulk-btn--danger:hover:not(:disabled) {
  color: rgb(248 113 113);
  border-color: rgba(248, 113, 113, 0.4);
}
</style>
