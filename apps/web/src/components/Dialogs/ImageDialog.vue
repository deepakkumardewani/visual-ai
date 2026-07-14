<script setup lang="ts">
import { FeatureType } from '@/pages/utils';
import {
  faChevronLeft,
  faChevronRight,
  faDownload,
  faFile,
  faTimes,
  faTrashAlt,
  farHeart,
  fasHeart,
} from '@/plugins/icons';
import { useMediaQuery } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';

import { IImageObject } from '@/types';

import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';

import AppModal from '@/components/AppModal.vue';
import SideBySide from '@/components/SideBySide.vue';

import { deleteImage, downloadImage, favoriteImage, formatFileSize } from '@/utils/helpers';

const isMobile = useMediaQuery('(max-width: 600px)');
const dialogStore = useDialogStore();
const userStore = useUserStore();
const { history } = storeToRefs(userStore);
const { showImageDialog } = storeToRefs(dialogStore);
const generateStore = useGenerateStore();
const { isDeleting, isFavoriting } = storeToRefs(generateStore);
const isFavorite = ref(false);
const currentImageIndex = ref(0);

const props = defineProps<{
  item: IImageObject | undefined;
}>();

function nextImage() {
  if (!props.item?.images) return;
  const urls = Array.isArray(props.item.images) ? props.item.images : [];
  if (currentImageIndex.value < urls.length - 1) {
    currentImageIndex.value++;
  }
}

function previousImage() {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--;
  }
}

const downloadImageUrl = computed(() => {
  if (!props.item?.images) return '';
  const publicId = props.item.images[currentImageIndex.value]?.aiImagePublicId
    ? props.item.images[currentImageIndex.value]?.aiImagePublicId
    : props.item.images[currentImageIndex.value]?.enhancedPublicId;
  const format = props.item.images[currentImageIndex.value]?.format;
  const cloudinaryBaseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL;
  return `${cloudinaryBaseUrl}/q_auto,f_auto/${publicId}.${format}`;
});

function getCurrentImageUrl() {
  const images = props.item?.images;
  if (!images) return '';
  const cloudinaryBaseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL;
  const optimizedUrl = `${cloudinaryBaseUrl}/q_auto,f_auto/${images[currentImageIndex.value]?.aiImagePublicId}`;
  return images[currentImageIndex.value]?.aiImagePublicId
    ? optimizedUrl
    : (images[currentImageIndex.value]?.aiImageUrl as string);
}

const originalImageUrl = computed(() => {
  const images = props.item?.images;
  if (!images) return '';
  const cloudinaryBaseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL;
  const optimizedUrl = `${cloudinaryBaseUrl}/q_auto,f_auto/${images[currentImageIndex.value]?.originalPublicId}`;
  return images[currentImageIndex.value]?.originalPublicId
    ? optimizedUrl
    : (images[currentImageIndex.value]?.originalImageUrl as string);
});

const enhancedImageUrl = computed(() => {
  const images = props.item?.images;
  if (!images) return '';
  const cloudinaryBaseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL;
  const optimizedUrl = `${cloudinaryBaseUrl}/q_auto,f_auto/${images[currentImageIndex.value]?.enhancedPublicId}`;
  return images[currentImageIndex.value]?.enhancedPublicId
    ? optimizedUrl
    : (images[currentImageIndex.value]?.enhancedImageUrl as string);
});

watch(
  () => props.item,
  (newItem) => {
    const item = history.value.find((entry) => entry._id === newItem?._id);
    if (item) {
      isFavorite.value = item.isFavorite;
    }
  },
  { immediate: true, deep: true },
);

watch(history, (newHistory) => {
  const newItem = newHistory.find((entry) => entry._id === props.item?._id);
  if (newItem) {
    isFavorite.value = newItem.isFavorite;
  }
});
</script>

<template>
  <AppModal
    :open="showImageDialog"
    :fullscreen="isMobile"
    max-width="62rem"
    :show-close="false"
    labelled-by="image-dialog-title"
    @close="dialogStore.hideImage"
  >
    <div class="image-dialog">
      <div class="image-dialog__toolbar">
        <div class="image-dialog__start">
          <button
            type="button"
            class="icon-btn"
            aria-label="Close"
            @click="dialogStore.hideImage()"
          >
            <font-awesome-icon :icon="faTimes" aria-hidden="true" />
          </button>
          <p v-if="item?.prompt && !isMobile" id="image-dialog-title" class="image-dialog__prompt">
            {{ item.prompt }}
          </p>
          <span v-else id="image-dialog-title" class="tw-sr-only">Image preview</span>
        </div>

        <div class="image-dialog__actions">
          <button
            type="button"
            class="icon-btn"
            title="Favorite"
            :disabled="isFavoriting"
            aria-label="Favorite"
            @click="favoriteImage($event, item?._id ?? '')"
          >
            <font-awesome-icon :icon="isFavorite ? fasHeart : farHeart" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="icon-btn"
            title="Download"
            aria-label="Download"
            @click="downloadImage($event, downloadImageUrl)"
          >
            <font-awesome-icon :icon="faDownload" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="icon-btn"
            title="Delete"
            :disabled="isDeleting"
            aria-label="Delete"
            @click="deleteImage($event, item as IImageObject)"
          >
            <font-awesome-icon :icon="faTrashAlt" aria-hidden="true" />
          </button>
        </div>
      </div>

      <p v-if="item?.prompt && isMobile" class="image-dialog__prompt image-dialog__prompt--mobile">
        {{ item.prompt }}
      </p>

      <div class="image-dialog__stage">
        <div v-if="item?.featureType === FeatureType.IMAGE" class="image-dialog__viewer">
          <div v-if="(item?.images?.length ?? 0) > 1" class="image-dialog__nav">
            <button
              type="button"
              class="nav-btn"
              :disabled="currentImageIndex === 0"
              aria-label="Previous image"
              @click="previousImage"
            >
              <font-awesome-icon :icon="faChevronLeft" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="nav-btn"
              :disabled="currentImageIndex === (item.images?.length ?? 1) - 1"
              aria-label="Next image"
              @click="nextImage"
            >
              <font-awesome-icon :icon="faChevronRight" aria-hidden="true" />
            </button>
          </div>

          <img
            :key="currentImageIndex"
            :src="getCurrentImageUrl()"
            :alt="item?.prompt || 'Generated image'"
            class="image-dialog__img"
          />
        </div>

        <div v-else>
          <SideBySide
            :original-image="originalImageUrl"
            :enhanced-image="enhancedImageUrl"
            :in-dialog="true"
          />
        </div>
      </div>

      <div class="image-dialog__meta">
        <div v-if="(item?.images?.length ?? 0) > 1" class="image-dialog__count">
          {{ currentImageIndex + 1 }} / {{ item?.images?.length }}
        </div>
        <div class="image-dialog__chips">
          <span v-if="item?.modelName" class="chip">{{ item.modelName }}</span>
          <span v-if="item?.images?.[0]?.aspectRatio" class="chip">{{
            item.images?.[0]?.aspectRatio
          }}</span>
          <span v-if="item?.images?.[0]?.bytes" class="chip">{{
            formatFileSize(item?.images?.[currentImageIndex]?.bytes)
          }}</span>
          <span class="chip">
            <font-awesome-icon :icon="faFile" aria-hidden="true" />
            {{ item?.images?.[0]?.width }} × {{ item?.images?.[0]?.height }}
          </span>
        </div>
      </div>
    </div>
  </AppModal>
</template>

<style scoped lang="scss">
.image-dialog {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: min(80dvh, 48rem);
  margin: -0.5rem;
}

.image-dialog__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.image-dialog__start,
.image-dialog__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.image-dialog__prompt {
  margin: 0;
  max-width: 36rem;
  font-size: 0.9rem;
  color: rgb(var(--tw-ink-muted));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-dialog__prompt--mobile {
  white-space: normal;
  padding: 0 0.25rem;
}

.image-dialog__stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
}

.image-dialog__viewer {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-dialog__nav {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.75rem;
  pointer-events: none;
  z-index: 2;
}

.image-dialog__img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
}

.image-dialog__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.image-dialog__count {
  margin-right: auto;
  font-size: 0.85rem;
  color: rgb(var(--tw-ink-muted));
  font-variant-numeric: tabular-nums;
}

.image-dialog__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: flex-end;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 1.75rem;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  background: rgb(var(--tw-surface-2));
  border: 1px solid rgb(var(--tw-border) / 0.6);
  color: rgb(var(--tw-ink-muted));
  font-size: 0.75rem;
  font-weight: 600;
}

.icon-btn,
.nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 0;
  border-radius: 999px;
  background: rgb(var(--tw-surface-2) / 0.8);
  color: rgb(var(--tw-ink-primary));
  cursor: pointer;
  pointer-events: auto;

  &:hover:not(:disabled) {
    background: rgb(var(--tw-surface-3));
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid #c9a84c;
    outline-offset: 2px;
  }
}
</style>
