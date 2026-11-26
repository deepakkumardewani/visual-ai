<script setup lang="ts">
import { faCircleCheck, faDownload, faTrashAlt, faXmark } from '@/plugins/icons';
import { storeToRefs } from 'pinia';

import type { IImage, IImageObject, MediaAssetDto } from '@visual-ai/shared';

import { useAppStore } from '@/stores/app';
import { useCollectionsStore } from '@/stores/collections';
import { useDialogStore } from '@/stores/dialog';
import {
  getHistoryItemFeature,
  getHistoryItemId,
  groupHistoryItems,
  matchesChip,
  mergeHistoryItems,
  useHistoryStore,
  type HistoryGroup,
  type HistoryItem,
} from '@/stores/history';
import type { PlayerTrack } from '@/stores/player';
import { useUserStore } from '@/stores/user';

import TrackCard from '@/components/Audio/TrackCard.vue';
import ImageDialog from '@/components/Dialogs/ImageDialog.vue';
import CollectionsStrip from '@/components/History/CollectionsStrip.vue';
import FeatureIcon from '@/components/History/FeatureIcon.vue';
import Filter from '@/components/History/Filter.vue';
import ImageActionButtons from '@/components/History/ImageActionButtons.vue';
import NoResults from '@/components/History/NoResults.vue';
import SelectActionButtons from '@/components/History/SelectActionButtons.vue';
import HandoffMenu from '@/components/Studio/HandoffMenu.vue';
import AppModal from '@/components/AppModal.vue';

import { thumbUrl } from '@/utils/cloudinaryUrl';
import { SIZE_CLASSES } from '@/utils/constants';

const props = withDefaults(defineProps<{ isFavorites?: boolean; embedded?: boolean }>(), {
  isFavorites: false,
  embedded: false,
});
const userStore = useUserStore();
const dialogStore = useDialogStore();
const collectionsStore = useCollectionsStore();
const appStore = useAppStore();
const historyStore = useHistoryStore();

const {
  isBulkDeleting,
  isBulkFavoriting,
  isBulkDownloading,
  selectedSize,
  selectedFeatureTypes,
  searchQuery,
  activeChip,
  mediaAssets,
} = storeToRefs(historyStore);
const { selectedCollectionId, collections } = storeToRefs(collectionsStore);
const { history } = storeToRefs(userStore);

const groupedHistory = ref<HistoryGroup[]>([]);
const mediaPendingDelete = ref<MediaAssetDto | null>(null);
const isDeletingMedia = ref(false);
const imageDialogItem = ref<IImageObject | undefined>();
const sizeClasses = SIZE_CLASSES;

const selectedImages = ref<IImageObject[]>([]);

const isBulkBusy = computed(
  () => isBulkDeleting.value || isBulkFavoriting.value || isBulkDownloading.value,
);
const isSelecting = computed(() => selectedImages.value.length > 0);

const showImage = (item: IImageObject) => {
  if (isBulkBusy.value) return;
  imageDialogItem.value = item;
  dialogStore.showImage(item._id);
};

const getImageUrl = (image: IImage) => {
  const cloudinaryBaseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL;
  const publicId = image.aiImagePublicId ?? image.enhancedPublicId;
  if (publicId) {
    return `${cloudinaryBaseUrl}/q_auto,f_auto/${publicId}`;
  }
  // Fresh generations may not be on Cloudinary yet — fall back to the raw URL.
  return image.aiImageUrl ?? image.enhancedImageUrl ?? '';
};

const toggleImageSelection = async (event: Event, image: IImageObject) => {
  if (isBulkBusy.value) return;
  event.stopPropagation();
  if (selectedImages.value.some((item) => item._id === image._id)) {
    selectedImages.value = selectedImages.value.filter((item) => item._id !== image._id);
  } else {
    selectedImages.value.push(image);
  }
};

const isImageSelected = (imageId: string) => {
  return selectedImages.value.some((item) => item._id === imageId);
};

/** Bulk actions are image-only; media items are managed one at a time. */
const imagesInGroup = (group: HistoryGroup): IImageObject[] =>
  group.data.flatMap((entry) => (entry.kind === 'image' ? [entry.item] : []));

const selectAllInGroup = (groupData: IImageObject[]) => {
  groupData.forEach((item) => {
    selectedImages.value.push(item);
  });
};

const areAllSelectedInGroup = (groupData: IImageObject[]): boolean => {
  return groupData.every((item) =>
    selectedImages.value.some((selected) => selected._id === item._id),
  );
};

const toggleGroupSelection = (groupData: IImageObject[]) => {
  if (isBulkBusy.value) return;
  if (areAllSelectedInGroup(groupData)) {
    groupData.forEach((item) => {
      selectedImages.value = selectedImages.value.filter((selected) => selected._id !== item._id);
    });
  } else {
    selectAllInGroup(groupData);
  }
};

const toPlayerTrack = (asset: MediaAssetDto): PlayerTrack => ({
  id: asset.id,
  title: asset.title,
  src: asset.url,
  artworkUrl: asset.posterUrl,
});

const closeMediaDelete = () => {
  mediaPendingDelete.value = null;
};

const confirmMediaDelete = async () => {
  const asset = mediaPendingDelete.value;
  if (!asset || isDeletingMedia.value) return;
  isDeletingMedia.value = true;
  const deleted = await historyStore.deleteMedia(asset.id);
  isDeletingMedia.value = false;
  mediaPendingDelete.value = null;
  appStore.snackbarText = deleted ? 'Deleted' : 'Could not delete. Please try again.';
  appStore.snackbar = true;
};

const isImageVisible = (item: IImageObject, searchTerm: string) => {
  if (searchTerm && !item.prompt?.toLowerCase().includes(searchTerm)) return false;
  if (props.isFavorites && !item.isFavorite) return false;
  if (!selectedCollectionId.value) return true;
  const active = collections.value.find((c) => c.id === selectedCollectionId.value);
  return item._id != null && new Set(active?.imageIds ?? []).has(item._id);
};

const isMediaVisible = (asset: MediaAssetDto, searchTerm: string) => {
  // Favorites and collections only hold images.
  if (props.isFavorites || selectedCollectionId.value) return false;
  if (!searchTerm) return true;
  return [asset.prompt, asset.title].some((text) => text?.toLowerCase().includes(searchTerm));
};

const isEntryVisible = (entry: HistoryItem, searchTerm: string, featureTypes: string[]) => {
  if (!matchesChip(entry, activeChip.value)) return false;
  if (featureTypes.length > 0 && !featureTypes.includes(getHistoryItemFeature(entry))) {
    return false;
  }
  return entry.kind === 'image'
    ? isImageVisible(entry.item, searchTerm)
    : isMediaVisible(entry.item, searchTerm);
};

watch(
  [
    history,
    mediaAssets,
    selectedFeatureTypes,
    searchQuery,
    activeChip,
    selectedCollectionId,
    collections,
  ],
  () => {
    const searchTerm = searchQuery.value.toLowerCase().trim();
    const visible = mergeHistoryItems(history.value, mediaAssets.value).filter((entry) =>
      isEntryVisible(entry, searchTerm, selectedFeatureTypes.value),
    );
    groupedHistory.value = groupHistoryItems(visible);
  },
  { immediate: true, deep: true },
);

onMounted(() => {
  void historyStore.loadMedia();
});

watch(
  [isBulkDeleting, isBulkFavoriting, isBulkDownloading],
  ([deleting, favoriting, downloading]) => {
    if (deleting || favoriting || downloading) {
      selectedImages.value = [];
    }
  },
);
</script>

<template>
  <div class="history-container tw-flex tw-flex-col">
    <div
      v-if="history.length + mediaAssets.length > 0"
      class="history-toolbar tw-relative tw-flex tw-flex-none tw-items-center tw-border-b tw-border-hairline/70 tw-py-4"
    >
      <!-- Default chrome always occupies space so selection mode cannot shift layout -->
      <div
        class="history-toolbar__row tw-flex tw-w-full tw-items-center tw-gap-4"
        :class="{ 'tw-invisible tw-pointer-events-none': isSelecting }"
        :aria-hidden="isSelecting"
        :inert="isSelecting"
      >
        <h2 v-if="!props.embedded" class="history-toolbar__title">
          {{ props.isFavorites ? 'Favorites' : 'Assets' }}
        </h2>
        <div class="tw-ml-auto tw-flex tw-min-w-0 tw-flex-1 tw-justify-end sm:tw-flex-none">
          <Filter />
        </div>
      </div>

      <div
        v-if="isSelecting"
        class="history-toolbar__selection tw-absolute tw-inset-y-0 tw-left-0 tw-right-0 tw-flex tw-items-center tw-gap-3"
      >
        <button
          type="button"
          aria-label="Clear selection"
          class="tw-flex tw-h-11 tw-w-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-text-ink-muted tw-transition-colors tw-duration-fast hover:tw-bg-surface-2 hover:tw-text-ink"
          @click="selectedImages = []"
        >
          <font-awesome-icon :icon="faXmark" class="tw-h-4 tw-w-4" aria-hidden="true" />
        </button>
        <span class="tw-text-sm tw-font-medium tw-tabular-nums tw-text-ink">
          {{ selectedImages.length }} selected
        </span>
        <div class="tw-ml-auto">
          <SelectActionButtons :selectedImages="selectedImages" />
        </div>
      </div>
    </div>

    <CollectionsStrip v-if="history.length > 0 && !props.isFavorites" />

    <div class="history-scroll tw-flex-1 tw-overflow-y-auto tw-pb-16 tw-pt-6 no-scrollbar">
      <NoResults
        :isFavorites="props.isFavorites"
        :groupedHistory="groupedHistory"
        :totalCount="history.length + mediaAssets.length"
      />

      <div
        v-for="(item, groupIndex) in groupedHistory"
        :key="item.title"
        class="history-date-group"
        :class="{ 'history-date-group--divided': groupIndex > 0 }"
      >
        <div class="group-header tw-mb-3 tw-flex tw-items-center tw-gap-2.5">
          <h3 class="history-date-group__title">{{ item.title }}</h3>
          <span class="history-date-group__count" aria-hidden="true">{{ item.data.length }}</span>
          <button
            v-if="imagesInGroup(item).length > 0"
            type="button"
            class="group-check"
            :class="{
              'group-check--visible': isSelecting,
              'tw-cursor-not-allowed': isBulkBusy,
              'tw-text-accent': areAllSelectedInGroup(imagesInGroup(item)),
              'tw-text-ink-faint': !areAllSelectedInGroup(imagesInGroup(item)),
            }"
            :aria-label="`Select all in ${item.title}`"
            @click="toggleGroupSelection(imagesInGroup(item))"
          >
            <font-awesome-icon :icon="faCircleCheck" class="tw-h-4 tw-w-4" aria-hidden="true" />
          </button>
        </div>

        <div :class="['asset-grid', sizeClasses[selectedSize as keyof typeof sizeClasses]]">
          <template v-for="entry in item.data" :key="getHistoryItemId(entry)">
            <div
              v-if="entry.kind === 'image'"
              class="asset-tile tw-relative tw-aspect-square tw-cursor-pointer tw-overflow-hidden tw-rounded-card tw-bg-surface-2"
              :class="{
                'asset-tile--selecting': isSelecting,
                'asset-tile--selected': isImageSelected(entry.item._id ?? ''),
                'asset-tile--idle': !isImageSelected(entry.item._id ?? ''),
                'tw-opacity-50':
                  isBulkDeleting || isBulkFavoriting || (isBulkDownloading && isSelecting),
              }"
              @click="showImage(entry.item)"
            >
              <img
                v-if="entry.item.images.length === 1"
                :src="thumbUrl(getImageUrl(entry.item.images[0]))"
                :alt="entry.item.prompt?.slice(0, 80) || entry.item.featureType"
                loading="lazy"
                class="asset-tile__img tw-h-full tw-w-full tw-object-cover"
              />

              <div
                v-else
                class="multi-image-stack tw-h-full"
                :class="`multi-image-stack--${Math.min(entry.item.images.length, 4)}`"
              >
                <div
                  v-for="(img, index) in entry.item.images.slice(0, 4)"
                  :key="index"
                  class="multi-image-stack__cell"
                >
                  <img
                    :src="thumbUrl(getImageUrl(img))"
                    :alt="entry.item.prompt?.slice(0, 80) || entry.item.featureType"
                    loading="lazy"
                    class="asset-tile__img tw-h-full tw-w-full tw-object-cover"
                  />
                </div>
              </div>

              <div class="tile-overlay tw-pointer-events-none tw-absolute tw-inset-0">
                <div
                  class="tw-absolute tw-inset-x-0 tw-top-0 tw-h-16 tw-bg-gradient-to-b tw-from-black/45 tw-to-transparent"
                />
                <div class="tw-relative tw-z-10 tw-flex tw-items-start tw-justify-between tw-p-2">
                  <div class="tw-flex tw-items-center tw-gap-1.5">
                    <button
                      type="button"
                      class="tw-pointer-events-auto tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center"
                      :class="isBulkBusy ? 'tw-cursor-not-allowed' : 'tw-cursor-pointer'"
                      :aria-label="
                        isImageSelected(entry.item._id ?? '') ? 'Deselect image' : 'Select image'
                      "
                      @click.stop="toggleImageSelection($event, entry.item)"
                    >
                      <font-awesome-icon
                        :icon="faCircleCheck"
                        class="tw-h-[18px] tw-w-[18px] tw-drop-shadow"
                        :class="
                          isImageSelected(entry.item._id ?? '')
                            ? 'tw-text-accent'
                            : 'tw-text-white/80'
                        "
                        aria-hidden="true"
                      />
                    </button>
                    <FeatureIcon :item="entry.item" />
                  </div>

                  <div class="tw-pointer-events-auto tw-flex tw-flex-col tw-gap-1.5">
                    <ImageActionButtons :item="entry.item" />
                  </div>
                </div>
              </div>
            </div>
            <article
              v-else
              class="tw-flex tw-flex-col tw-gap-2"
              :data-testid="`history-${entry.item.type}-item`"
            >
              <TrackCard v-if="entry.item.type === 'audio'" :track="toPlayerTrack(entry.item)" />
              <img
                v-else-if="entry.item.type === 'image'"
                :src="entry.item.url"
                :alt="entry.item.title"
                loading="lazy"
                class="tw-aspect-video tw-w-full tw-rounded-card tw-bg-surface-2 tw-object-contain"
              />
              <video
                v-else
                :src="entry.item.url"
                :poster="entry.item.posterUrl"
                :aria-label="entry.item.title"
                controls
                preload="none"
                playsinline
                class="tw-aspect-video tw-w-full tw-rounded-card tw-bg-surface-2 tw-object-cover"
              />
              <div class="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                <FeatureIcon :feature="entry.item.feature" />
                <HandoffMenu :asset="entry.item" />
                <div class="tw-ml-auto tw-flex tw-items-center tw-gap-1">
                  <a
                    :href="entry.item.url"
                    download
                    target="_blank"
                    rel="noopener"
                    class="media-action"
                    :aria-label="`Download ${entry.item.title}`"
                  >
                    <font-awesome-icon
                      :icon="faDownload"
                      class="tw-h-3.5 tw-w-3.5"
                      aria-hidden="true"
                    />
                  </a>
                  <button
                    type="button"
                    class="media-action"
                    :aria-label="`Delete ${entry.item.title}`"
                    @click="mediaPendingDelete = entry.item"
                  >
                    <font-awesome-icon
                      :icon="faTrashAlt"
                      class="tw-h-3.5 tw-w-3.5"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>
            </article>
          </template>
        </div>
      </div>
    </div>
  </div>
  <ImageDialog :item="imageDialogItem" />
  <AppModal
    :open="mediaPendingDelete !== null"
    max-width="28rem"
    labelled-by="delete-media-title"
    described-by="delete-media-desc"
    @close="closeMediaDelete"
  >
    <template #title>
      <span id="delete-media-title">Delete {{ mediaPendingDelete?.type ?? 'item' }}</span>
    </template>
    <p id="delete-media-desc" class="tw-m-0 tw-text-sm tw-text-ink-muted">
      Are you sure you want to delete "{{ mediaPendingDelete?.title }}"? This action cannot be
      undone.
    </p>
    <template #actions>
      <button type="button" class="media-confirm-btn" @click="closeMediaDelete">Keep</button>
      <button
        type="button"
        class="media-confirm-btn media-confirm-btn--danger"
        :disabled="isDeletingMedia"
        @click="confirmMediaDelete"
      >
        {{ isDeletingMedia ? 'Deleting…' : 'Delete' }}
      </button>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.history-container {
  height: calc(100vh - 64px);
  overflow: hidden;
}

/*
  Padding lives on the children — not the overflow:hidden parent.
  Parent padding + overflow:hidden clips selection rings so the orange
  border looks flush against the viewport edge when an item is selected.
*/
.history-toolbar,
.history-scroll {
  min-width: 0;
  padding-inline: 2.5rem;
}

.history-toolbar__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: rgb(var(--tw-ink));
}

.history-toolbar__selection {
  /* Match parent horizontal padding so overlay aligns with the reserved row */
  padding-inline: 2.5rem;
}

.history-date-group {
  margin-bottom: 2rem;
}

.history-date-group--divided {
  margin-top: 2rem;
  padding-top: 1.75rem;
  border-top: 1px solid rgb(var(--tw-hairline) / 0.7);
}

.history-date-group__title {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: rgb(var(--tw-ink-muted));
}

.history-date-group__count {
  font-size: 0.75rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: rgb(var(--tw-ink-faint));
}

.asset-grid {
  display: grid;
  gap: 0.75rem;
}

/* Overlay chrome appears on hover, in selection mode, or always on touch devices */
.tile-overlay {
  opacity: 0;
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.asset-tile:hover .tile-overlay,
.asset-tile:focus-within .tile-overlay,
.asset-tile--selecting .tile-overlay {
  opacity: 1;
}

@media (hover: none) {
  .tile-overlay {
    opacity: 1;
  }
}

.asset-tile__img {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.asset-tile:hover .asset-tile__img {
  transform: scale(1.03);
}

/* Inset selection ring — never clipped by overflow ancestors */
.asset-tile--selected {
  box-shadow: inset 0 0 0 2px rgb(201 138 90);
}

.asset-tile--idle {
  box-shadow: inset 0 0 0 1px rgb(var(--tw-hairline) / 0.55);
}

/* Group select-all: revealed by header hover, selection mode, or touch */
.group-check {
  opacity: 0;
  margin-left: 0.15rem;
  transition:
    opacity 0.15s ease,
    color 0.15s ease;
}

.group-header:hover .group-check,
.group-check:focus-visible,
.group-check--visible {
  opacity: 1;
}

@media (hover: none) {
  .group-check {
    opacity: 1;
  }
}

/* Quad-stack preview for multi-image generations — every image visible at a glance */
.multi-image-stack {
  display: grid;
  gap: 2px;

  &--2 {
    grid-template-columns: 1fr 1fr;
  }

  &--3 {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;

    .multi-image-stack__cell:first-child {
      grid-row: span 2;
    }
  }

  &--4 {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
  }
}

.multi-image-stack__cell {
  overflow: hidden;
  height: 100%;
  width: 100%;
}

/* 44px tap target on every pointer; the visible glyph stays small. */
.media-action,
.media-confirm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border-radius: 9999px;
  color: rgb(var(--tw-ink-muted));
  transition: color 0.15s ease;

  &:hover {
    color: rgb(var(--tw-ink));
  }

  &:focus-visible {
    outline: 2px solid #c98a5a;
    outline-offset: 2px;
  }
}

.media-action {
  min-width: 44px;
}

.media-confirm-btn {
  padding: 0 1.15rem;
  border: 1px solid rgb(var(--tw-border));
  font-size: 0.875rem;
  font-weight: 600;
}

.media-confirm-btn--danger {
  border-color: rgba(176, 60, 60, 0.45);
  color: #e08585;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

@media (prefers-reduced-motion: reduce) {
  .media-action,
  .media-confirm-btn,
  .asset-tile__img,
  .tile-overlay {
    transition: none;
  }

  .asset-tile:hover .asset-tile__img {
    transform: none;
  }
}
</style>
