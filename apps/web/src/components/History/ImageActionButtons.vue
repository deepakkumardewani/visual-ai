<script setup lang="ts">
import { faDownload, farHeart, fasHeart, faTrashAlt } from '@/plugins/icons';
import { storeToRefs } from 'pinia';

import { IImageObject } from '@/types';

import { useGenerateStore } from '@/stores/generate';

import { deleteImage, downloadImage, favoriteImage, getDownloadImageUrl } from '@/utils/helpers';

const props = defineProps<{
  item: IImageObject;
}>();
const generateStore = useGenerateStore();
const { deletingImageIds } = storeToRefs(generateStore);

const isDeletingThis = computed(() => deletingImageIds.value.includes(props.item._id));
</script>
<template>
  <button
    type="button"
    class="tile-action"
    aria-label="Download image"
    @click="downloadImage($event, getDownloadImageUrl(props.item.images[0]))"
  >
    <font-awesome-icon :icon="faDownload" class="tw-h-3 tw-w-3" aria-hidden="true" />
  </button>

  <button
    type="button"
    class="tile-action"
    :aria-label="props.item.isFavorite ? 'Remove from favorites' : 'Add to favorites'"
    @click="favoriteImage($event, props.item._id)"
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
    @click="deleteImage($event, props.item)"
  >
    <font-awesome-icon :icon="faTrashAlt" class="tw-h-3 tw-w-3" aria-hidden="true" />
  </button>
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
