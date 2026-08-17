<script setup lang="ts">
import { FeatureType } from '@/pages/utils';
import {
  faCopy,
  faDice,
  faDownload,
  faEllipsis,
  faExpand,
  faLink,
  faObjectUngroup,
  faTimes,
  faTrashAlt,
  faUpload,
  farHeart,
  fasHeart,
} from '@/plugins/icons';
import { onClickOutside, useMediaQuery } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';

import type { IImageObject } from '@/types';

import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';

import AppModal from '@/components/AppModal.vue';
import ConfirmDeleteImageDialog from '@/components/Dialogs/ConfirmDeleteImageDialog.vue';
import SideBySide from '@/components/SideBySide.vue';

import { useImageChainActions } from '@/composables/useImageChainActions';
import { useShareActions } from '@/composables/useShareActions';
import { deleteImage, downloadImage, favoriteImage, getDownloadImageUrl } from '@/utils/helpers';

const isMobile = useMediaQuery('(max-width: 600px)');
const dialogStore = useDialogStore();
const userStore = useUserStore();
const { history } = storeToRefs(userStore);
const { showImageDialog, activeImageId } = storeToRefs(dialogStore);
const generateStore = useGenerateStore();
const { isDeleting, isFavoriting } = storeToRefs(generateStore);
const { shareLink, copyPrompt } = useShareActions();
const { useAsReference, sendToUpscale, sendToRemoveBg, moreLikeThis } = useImageChainActions();

const isFavorite = ref(false);
const showDeleteConfirm = ref(false);
const chainMenuOpen = ref(false);
const chainMenuRoot = ref<HTMLElement | null>(null);

onClickOutside(chainMenuRoot, () => {
  chainMenuOpen.value = false;
});

const props = defineProps<{
  item: IImageObject | undefined;
}>();

const isThisDialogOpen = computed(
  () => showImageDialog.value && !!props.item && props.item._id === activeImageId.value,
);

const imageCount = computed(() => props.item?.images?.length ?? 0);

const galleryLayoutClass = computed(() => {
  const count = imageCount.value;
  if (count <= 1) return 'image-dialog__gallery--single';
  if (count === 2) return 'image-dialog__gallery--two';
  if (count === 3) return 'image-dialog__gallery--three';
  return 'image-dialog__gallery--grid';
});

const isImageFeature = computed(() => props.item?.featureType === FeatureType.IMAGE);

const primaryImage = computed(() => props.item?.images?.[0]);

const enhanceDownloadUrl = computed(() => {
  const image = primaryImage.value;
  if (!image) return '';
  return getDownloadImageUrl(image);
});

const hasPrompt = computed(() => Boolean(props.item?.prompt?.trim()));

const shareUrl = computed(() => {
  if (enhanceDownloadUrl.value) return enhanceDownloadUrl.value;
  return typeof window !== 'undefined' ? window.location.href : '';
});

function getImageUrl(index: number): string {
  const images = props.item?.images;
  if (!images?.[index]) return '';
  const cloudinaryBaseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL;
  const image = images[index];
  if (image.aiImagePublicId) {
    return `${cloudinaryBaseUrl}/q_auto,f_auto/${image.aiImagePublicId}`;
  }
  return (image.aiImageUrl as string) || '';
}

function downloadAtIndex(event: Event, index: number) {
  const image = props.item?.images?.[index];
  if (!image) return;
  void downloadImage(event, getDownloadImageUrl(image));
}

const originalImageUrl = computed(() => {
  const image = primaryImage.value;
  if (!image) return '';
  const cloudinaryBaseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL;
  const remoteOriginal =
    typeof image.originalImageUrl === 'string' && /^https?:\/\//i.test(image.originalImageUrl)
      ? image.originalImageUrl
      : '';
  // Prefer remote originals; multer filenames are not valid Cloudinary public IDs.
  if (image.originalPublicId && image.originalPublicId.includes('/')) {
    return `${cloudinaryBaseUrl}/q_auto,f_auto/${image.originalPublicId}`;
  }
  if (remoteOriginal) return remoteOriginal;
  if (image.originalPublicId) {
    return `${cloudinaryBaseUrl}/q_auto,f_auto/${image.originalPublicId}`;
  }
  return '';
});

const enhancedImageUrl = computed(() => {
  const image = primaryImage.value;
  if (!image) return '';
  const cloudinaryBaseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL;
  if (image.enhancedPublicId) {
    // Preserve alpha for remove-bg — f_auto can flatten to JPEG (black matte).
    const formatTransform =
      props.item?.featureType === FeatureType.REMOVE_BG ? 'q_auto,f_png' : 'q_auto,f_auto';
    return `${cloudinaryBaseUrl}/${formatTransform}/${image.enhancedPublicId}`;
  }
  return (image.enhancedImageUrl as string) || '';
});

const isTransparentEnhance = computed(() => props.item?.featureType === FeatureType.REMOVE_BG);

function openDeleteConfirm() {
  showDeleteConfirm.value = true;
}

function closeDeleteConfirm() {
  showDeleteConfirm.value = false;
}

async function confirmDelete(event: Event) {
  if (!props.item) return;
  showDeleteConfirm.value = false;
  await deleteImage(event, props.item);
}

function closeImageDialog() {
  showDeleteConfirm.value = false;
  dialogStore.hideImage();
}

async function handleShare() {
  await shareLink({ title: 'Visual AI creation', url: shareUrl.value });
}

async function handleCopyPrompt() {
  if (!props.item?.prompt) return;
  await copyPrompt(props.item.prompt);
}

function toggleChainMenu(event: Event) {
  event.stopPropagation();
  chainMenuOpen.value = !chainMenuOpen.value;
}

async function runChain(action: () => void | Promise<boolean | void>, event: Event) {
  event.stopPropagation();
  chainMenuOpen.value = false;
  const result = await action();
  if (result === false) return;
  dialogStore.hideImage();
}

watch(
  () => props.item?._id,
  () => {
    showDeleteConfirm.value = false;
  },
);

watch(
  () => props.item,
  (newItem) => {
    const item = history.value.find((entry) => entry._id === newItem?._id);
    if (item) {
      isFavorite.value = item.isFavorite ?? false;
    }
  },
  { immediate: true, deep: true },
);

watch(history, (newHistory) => {
  const newItem = newHistory.find((entry) => entry._id === props.item?._id);
  if (newItem) {
    isFavorite.value = newItem.isFavorite ?? false;
  }
});

watch(isThisDialogOpen, (open) => {
  if (!open) showDeleteConfirm.value = false;
});
</script>

<template>
  <AppModal
    :open="isThisDialogOpen"
    :fullscreen="isMobile"
    max-width="min(96vw, 88rem)"
    :show-close="false"
    :close-on-escape="!showDeleteConfirm"
    :close-on-overlay="!showDeleteConfirm"
    labelled-by="image-dialog-title"
    @close="closeImageDialog"
  >
    <div class="image-dialog">
      <header class="image-dialog__toolbar">
        <div class="image-dialog__start">
          <button type="button" class="icon-btn" aria-label="Close" @click="closeImageDialog">
            <font-awesome-icon :icon="faTimes" aria-hidden="true" />
          </button>
          <span id="image-dialog-title" class="tw-sr-only">Image preview</span>
        </div>

        <div class="image-dialog__actions">
          <button
            type="button"
            class="icon-btn"
            title="Share"
            aria-label="Share"
            :disabled="!shareUrl"
            @click="handleShare"
          >
            <font-awesome-icon :icon="faLink" aria-hidden="true" />
          </button>
          <button
            v-if="hasPrompt"
            type="button"
            class="icon-btn"
            title="Copy prompt"
            aria-label="Copy prompt"
            @click="handleCopyPrompt"
          >
            <font-awesome-icon :icon="faCopy" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="icon-btn"
            title="Favorite"
            :disabled="isFavoriting"
            :aria-label="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
            @click="favoriteImage($event, item?._id ?? '')"
          >
            <font-awesome-icon
              :icon="isFavorite ? fasHeart : farHeart"
              :class="{ 'icon-btn__fav--active': isFavorite }"
              aria-hidden="true"
            />
          </button>
          <button
            v-if="!isImageFeature"
            type="button"
            class="icon-btn"
            title="Download"
            aria-label="Download"
            :disabled="!enhanceDownloadUrl"
            @click="downloadImage($event, enhanceDownloadUrl)"
          >
            <font-awesome-icon :icon="faDownload" aria-hidden="true" />
          </button>

          <div ref="chainMenuRoot" class="chain-menu">
            <button
              type="button"
              class="icon-btn"
              title="More actions"
              aria-label="More actions"
              aria-haspopup="menu"
              :aria-expanded="chainMenuOpen"
              @click="toggleChainMenu"
            >
              <font-awesome-icon :icon="faEllipsis" aria-hidden="true" />
            </button>
            <div
              v-if="chainMenuOpen"
              class="chain-menu__panel"
              role="menu"
              aria-label="Image chaining actions"
              @click.stop
            >
              <button
                type="button"
                role="menuitem"
                class="chain-menu__item"
                :disabled="!primaryImage"
                @click="runChain(() => useAsReference(primaryImage), $event)"
              >
                <font-awesome-icon :icon="faUpload" aria-hidden="true" />
                Use as reference
              </button>
              <button
                type="button"
                role="menuitem"
                class="chain-menu__item"
                :disabled="!primaryImage"
                @click="runChain(() => sendToUpscale(primaryImage), $event)"
              >
                <font-awesome-icon :icon="faExpand" aria-hidden="true" />
                Upscale this
              </button>
              <button
                type="button"
                role="menuitem"
                class="chain-menu__item"
                :disabled="!primaryImage"
                @click="runChain(() => sendToRemoveBg(primaryImage), $event)"
              >
                <font-awesome-icon :icon="faObjectUngroup" aria-hidden="true" />
                Remove background
              </button>
              <button
                v-if="hasPrompt"
                type="button"
                role="menuitem"
                class="chain-menu__item"
                @click="runChain(() => moreLikeThis(item), $event)"
              >
                <font-awesome-icon :icon="faDice" aria-hidden="true" />
                More like this
              </button>
            </div>
          </div>

          <button
            type="button"
            class="icon-btn icon-btn--danger"
            title="Delete"
            :disabled="isDeleting"
            aria-label="Delete"
            @click="openDeleteConfirm"
          >
            <font-awesome-icon :icon="faTrashAlt" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div class="image-dialog__stage">
        <div v-if="isImageFeature" class="image-dialog__gallery" :class="galleryLayoutClass">
          <figure
            v-for="(img, index) in item?.images"
            :key="img.name || index"
            class="image-dialog__frame"
          >
            <img
              :src="getImageUrl(index)"
              :alt="item?.prompt || `Generated image ${index + 1}`"
              class="image-dialog__img"
              draggable="false"
            />
            <div class="image-dialog__overlay">
              <div class="image-dialog__overlay-fade" aria-hidden="true" />
              <button
                type="button"
                class="tile-download"
                :aria-label="`Download image ${index + 1}`"
                @click="downloadAtIndex($event, index)"
              >
                <font-awesome-icon :icon="faDownload" class="tw-h-3 tw-w-3" aria-hidden="true" />
              </button>
            </div>
          </figure>
        </div>

        <div v-else class="image-dialog__compare">
          <SideBySide
            :original-image="originalImageUrl"
            :enhanced-image="enhancedImageUrl"
            :transparent="isTransparentEnhance"
            max-height="min(70dvh, 42rem)"
          />
        </div>
      </div>

      <footer class="image-dialog__footer">
        <p v-if="item?.prompt" class="image-dialog__prompt">
          {{ item.prompt }}
        </p>
        <div class="image-dialog__chips">
          <span v-if="item?.modelName" class="chip">{{ item.modelName }}</span>
          <span v-if="primaryImage?.aspectRatio" class="chip">{{ primaryImage.aspectRatio }}</span>
          <span v-if="primaryImage?.width && primaryImage?.height" class="chip">
            {{ primaryImage.width }} × {{ primaryImage.height }}
          </span>
        </div>
      </footer>
    </div>
  </AppModal>

  <ConfirmDeleteImageDialog
    :open="showDeleteConfirm"
    :image-count="imageCount"
    :loading="isDeleting"
    :layer="1"
    @close="closeDeleteConfirm"
    @confirm="confirmDelete"
  />
</template>

<style scoped lang="scss">
.image-dialog {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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
  gap: 0.4rem;
}

.chain-menu {
  position: relative;
}

.chain-menu__panel {
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 0;
  z-index: 30;
  display: flex;
  min-width: 11.5rem;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.35rem;
  border-radius: 0.5rem;
  border: 1px solid rgb(var(--tw-hairline) / 0.8);
  background: rgb(var(--tw-surface-1) / 0.98);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.chain-menu__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2rem;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  color: rgb(var(--tw-ink));
  font-size: 0.75rem;
  font-weight: 500;
  text-align: left;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: rgb(var(--tw-surface-2));
    color: #c98a5a;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  &:focus-visible {
    outline: 2px solid #c98a5a;
    outline-offset: 1px;
  }
}

.image-dialog__stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.image-dialog__gallery {
  width: 100%;
  display: grid;
  gap: 0.65rem;
  align-items: stretch;

  &--single {
    grid-template-columns: 1fr;
    max-width: 52rem;
    margin-inline: auto;
  }

  &--two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  &--three {
    grid-template-columns: repeat(3, minmax(0, 1fr));

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }

  &--grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    @media (min-width: 1100px) {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
}

.image-dialog__compare {
  width: 100%;
}

.image-dialog__frame {
  position: relative;
  margin: 0;
  border-radius: 10px;
  overflow: hidden;
  background: rgb(var(--tw-surface-2));
  box-shadow: inset 0 0 0 1px rgb(var(--tw-hairline) / 0.5);

  &:hover .image-dialog__overlay,
  &:focus-within .image-dialog__overlay {
    opacity: 1;
  }
}

.image-dialog__img {
  display: block;
  width: 100%;
  max-height: min(64dvh, 38rem);
  object-fit: contain;
  background: rgb(var(--tw-surface-2));
  pointer-events: none;
  user-select: none;
}

.image-dialog__gallery--single .image-dialog__img {
  max-height: min(70dvh, 42rem);
}

.image-dialog__overlay {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.image-dialog__overlay-fade {
  position: absolute;
  inset-inline: 0;
  top: 0;
  height: 3.5rem;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.45), transparent);
}

.tile-download {
  pointer-events: auto;
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 1.75rem;
  width: 1.75rem;
  border: 0;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.55);
  color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  &:focus-visible {
    outline: 2px solid #c9a84c;
    outline-offset: 2px;
  }
}

@media (hover: none) {
  .image-dialog__overlay {
    opacity: 1;
  }
}

.image-dialog__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.65rem 1rem;
  padding-top: 0.15rem;
}

.image-dialog__prompt {
  margin: 0;
  flex: 1 1 16rem;
  min-width: 0;
  max-width: 48rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: rgb(var(--tw-ink-muted));
  white-space: normal;
  overflow-wrap: anywhere;
}

.image-dialog__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  justify-content: flex-end;
  margin-left: auto;
}

.chip {
  display: inline-flex;
  align-items: center;
  min-height: 1.6rem;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: rgb(var(--tw-surface-2));
  border: 1px solid rgb(var(--tw-border) / 0.55);
  color: rgb(var(--tw-ink-muted));
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border: 0;
  border-radius: 999px;
  background: rgb(var(--tw-surface-2) / 0.8);
  color: rgb(var(--tw-ink-primary));
  cursor: pointer;
  transition: background-color 0.15s ease;

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

.icon-btn__fav--active {
  color: #c98a5a;
}

.icon-btn--danger:hover:not(:disabled) {
  background: rgba(176, 60, 60, 0.18);
  color: #e08585;
}

@media (prefers-reduced-motion: reduce) {
  .image-dialog__overlay,
  .tile-download,
  .icon-btn {
    transition: none;
  }
}
</style>
