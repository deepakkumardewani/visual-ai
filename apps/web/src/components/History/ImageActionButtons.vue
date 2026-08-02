<script setup lang="ts">
import { faDownload, farHeart, fasHeart, faTrashAlt } from '@/plugins/icons';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

import type { IImageObject } from '@/types';

import { useGenerateStore } from '@/stores/generate';

import ConfirmDeleteImageDialog from '@/components/Dialogs/ConfirmDeleteImageDialog.vue';

import { deleteImage, downloadImage, favoriteImage, getDownloadImageUrl } from '@/utils/helpers';

const props = withDefaults(
  defineProps<{
    item: IImageObject;
    /** When set, download that specific image instead of the first. */
    imageIndex?: number;
  }>(),
  { imageIndex: 0 },
);

const generateStore = useGenerateStore();
const { deletingImageIds } = storeToRefs(generateStore);

const showDeleteConfirm = ref(false);

const isDeletingThis = computed(() =>
  props.item._id ? deletingImageIds.value.includes(props.item._id) : false,
);

const downloadTarget = computed(() => {
  const images = props.item.images ?? [];
  return images[props.imageIndex] ?? images[0];
});

const imageCount = computed(() => props.item.images?.length ?? 1);

function openDeleteConfirm(event: Event) {
  event.stopPropagation();
  showDeleteConfirm.value = true;
}

function closeDeleteConfirm() {
  showDeleteConfirm.value = false;
}

async function confirmDelete(event: Event) {
  showDeleteConfirm.value = false;
  await deleteImage(event, props.item);
}
</script>

<template>
  <button
    type="button"
    class="tile-action"
    aria-label="Download image"
    :disabled="!downloadTarget"
    @click="downloadTarget && downloadImage($event, getDownloadImageUrl(downloadTarget))"
  >
    <font-awesome-icon :icon="faDownload" class="tw-h-3 tw-w-3" aria-hidden="true" />
  </button>

  <button
    type="button"
    class="tile-action"
    :aria-label="props.item.isFavorite ? 'Remove from favorites' : 'Add to favorites'"
    @click="favoriteImage($event, props.item._id ?? '')"
  >
    <font-awesome-icon
      :icon="props.item.isFavorite ? fasHeart : farHeart"
      class="tw-h-3 tw-w-3"
      :class="{ 'tw-text-accent': props.item.isFavorite }"
      aria-hidden="true"
    />
  </button>

  <button
    type="button"
    class="tile-action"
    :class="{ 'tile-action--busy': isDeletingThis }"
    :disabled="isDeletingThis"
    aria-label="Delete image"
    @click="openDeleteConfirm"
  >
    <font-awesome-icon :icon="faTrashAlt" class="tw-h-3 tw-w-3" aria-hidden="true" />
  </button>

  <ConfirmDeleteImageDialog
    :open="showDeleteConfirm"
    :image-count="imageCount"
    :loading="isDeletingThis"
    @close="closeDeleteConfirm"
    @confirm="confirmDelete"
  />
</template>

<style scoped lang="scss">
.tile-action {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 1.75rem;
  width: 1.75rem;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.55);
  color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  transition: background-color 0.15s ease;

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.8);
  }

  &:disabled {
    cursor: not-allowed;
  }
}

.tile-action--busy {
  animation: tile-action-busy 1s ease-in-out infinite;
}

@keyframes tile-action-busy {
  50% {
    opacity: 0.4;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tile-action--busy {
    animation: none;
    opacity: 0.5;
  }
}
</style>
