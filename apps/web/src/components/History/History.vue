<script setup lang="ts">
import { groupByDate } from '@/pages/utils';
import { faCircleCheck, faXmark } from '@/plugins/icons';
import { storeToRefs } from 'pinia';

import type { GroupedObject, IImage, IImageObject } from '@/types';

import { useDialogStore } from '@/stores/dialog';
import { useHistoryStore } from '@/stores/history';
import { useUserStore } from '@/stores/user';

import ImageDialog from '@/components/Dialogs/ImageDialog.vue';
import FeatureIcon from '@/components/History/FeatureIcon.vue';
import Filter from '@/components/History/Filter.vue';
import ImageActionButtons from '@/components/History/ImageActionButtons.vue';
import NoResults from '@/components/History/NoResults.vue';
import SelectActionButtons from '@/components/History/SelectActionButtons.vue';

import { SIZE_CLASSES } from '@/utils/constants';

const props = withDefaults(defineProps<{ isFavorites?: boolean }>(), {
  isFavorites: false,
});
const userStore = useUserStore();
const dialogStore = useDialogStore();

const {
  isBulkDeleting,
  isBulkFavoriting,
  isBulkDownloading,
  selectedSize,
  selectedFeatureTypes,
  searchQuery,
} = storeToRefs(useHistoryStore());
const { history } = storeToRefs(userStore);

const groupedHistory = ref<GroupedObject[]>([]);
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
  dialogStore.showImage();
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

watch(
  [history, selectedFeatureTypes, searchQuery],
  ([newHistory, newFeatureTypes, query]) => {
    if (newHistory) {
      let filteredHistory = newHistory;

      // Feature type filter
      if (newFeatureTypes.length > 0) {
        filteredHistory = filteredHistory.filter((item: IImageObject) =>
          newFeatureTypes.includes(item.featureType),
        );
      }

      // Search query filter
      if (query.trim()) {
        const searchTerm = query.toLowerCase().trim();
        filteredHistory = filteredHistory.filter((item: IImageObject) =>
          item.prompt?.toLowerCase().includes(searchTerm),
        );
      }

      // Favorites filter
      if (props.isFavorites) {
        filteredHistory = filteredHistory.filter((item: IImageObject) => item.isFavorite);
      }

      groupedHistory.value = groupByDate(filteredHistory);
    }
  },
  { immediate: true, deep: true },
);

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
  <div class="history-container tw-flex tw-flex-col tw-px-4 sm:tw-px-6">
    <div
      v-if="history.length > 0"
      class="tw-flex tw-flex-none tw-flex-wrap tw-items-center tw-gap-3 tw-border-b tw-border-hairline tw-py-4"
    >
      <template v-if="isSelecting">
        <button
          type="button"
          aria-label="Clear selection"
          class="tw-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-full tw-text-ink-muted tw-transition-colors tw-duration-fast hover:tw-bg-surface-2 hover:tw-text-ink"
          @click="selectedImages = []"
        >
          <font-awesome-icon :icon="faXmark" class="tw-h-4 tw-w-4" aria-hidden="true" />
        </button>
        <span class="tw-text-sm tw-font-medium tw-text-ink">
          {{ selectedImages.length }} selected
        </span>
        <div class="tw-ml-auto">
          <SelectActionButtons :selectedImages="selectedImages" />
        </div>
      </template>

      <template v-else>
        <h2 class="tw-text-lg tw-font-semibold tw-tracking-tight tw-text-ink">
          {{ props.isFavorites ? 'Favorites' : 'Assets' }}
        </h2>
        <div class="tw-ml-auto tw-flex tw-min-w-0 tw-flex-1 tw-justify-end sm:tw-flex-none">
          <Filter />
        </div>
      </template>
    </div>

    <div class="tw-flex-1 tw-overflow-y-auto tw-pb-12 tw-pt-6 no-scrollbar">
      <NoResults :isFavorites="props.isFavorites" :groupedHistory="groupedHistory" />

      <div v-for="item in groupedHistory" :key="item.title" class="tw-mb-10">
        <div class="group-header tw-mb-3 tw-flex tw-items-baseline tw-gap-2.5">
          <h3 class="tw-text-sm tw-font-semibold tw-text-ink">{{ item.title }}</h3>
          <span class="tw-text-xs tw-text-ink-faint">{{ item.data.length }}</span>
          <button
            type="button"
            class="group-check"
            :class="{
              'group-check--visible': isSelecting,
              'tw-cursor-not-allowed': isBulkBusy,
              'tw-text-accent': areAllSelectedInGroup(item.data),
              'tw-text-ink-faint': !areAllSelectedInGroup(item.data),
            }"
            :aria-label="`Select all in ${item.title}`"
            @click="toggleGroupSelection(item.data)"
          >
            <font-awesome-icon :icon="faCircleCheck" class="tw-h-4 tw-w-4" aria-hidden="true" />
          </button>
        </div>

        <div :class="['tw-grid tw-gap-3', sizeClasses[selectedSize as keyof typeof sizeClasses]]">
          <div
            v-for="subItem in item.data"
            :key="subItem._id"
            class="asset-tile tw-relative tw-aspect-square tw-cursor-pointer tw-overflow-hidden tw-rounded-card tw-bg-surface-2"
            :class="{
              'asset-tile--selecting': isSelecting,
              'tw-opacity-50':
                isBulkDeleting || isBulkFavoriting || (isBulkDownloading && isSelecting),
              'tw-ring-2 tw-ring-accent': isImageSelected(subItem._id),
              'tw-ring-1 tw-ring-hairline/60': !isImageSelected(subItem._id),
            }"
            @click="showImage(subItem)"
          >
            <img
              v-if="subItem.images.length === 1"
              :src="getImageUrl(subItem.images[0])"
              :alt="subItem.prompt?.slice(0, 80) || subItem.featureType"
              loading="lazy"
              class="asset-tile__img tw-h-full tw-w-full tw-object-cover"
            />

            <div
              v-else
              class="multi-image-stack tw-h-full"
              :class="`multi-image-stack--${Math.min(subItem.images.length, 4)}`"
            >
              <div
                v-for="(img, index) in subItem.images.slice(0, 4)"
                :key="index"
                class="multi-image-stack__cell"
              >
                <img
                  :src="getImageUrl(img)"
                  :alt="subItem.prompt?.slice(0, 80) || subItem.featureType"
                  loading="lazy"
                  class="asset-tile__img tw-h-full tw-w-full tw-object-cover"
                />
              </div>
              <span
                class="tw-pointer-events-none tw-absolute tw-bottom-1.5 tw-right-1.5 tw-z-[2] tw-rounded-full tw-bg-black/60 tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold tw-text-white"
              >
                {{ subItem.images.length }}
              </span>
            </div>

            <div class="tile-overlay tw-pointer-events-none tw-absolute tw-inset-0">
              <div
                class="tw-absolute tw-inset-x-0 tw-top-0 tw-h-20 tw-bg-gradient-to-b tw-from-black/50 tw-to-transparent"
              />
              <div class="tw-relative tw-z-10 tw-flex tw-items-start tw-justify-between tw-p-2">
                <div class="tw-flex tw-items-center tw-gap-1.5">
                  <button
                    type="button"
                    class="tw-pointer-events-auto tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center"
                    :class="isBulkBusy ? 'tw-cursor-not-allowed' : 'tw-cursor-pointer'"
                    :aria-label="isImageSelected(subItem._id) ? 'Deselect image' : 'Select image'"
                    @click.stop="toggleImageSelection($event, subItem)"
                  >
                    <font-awesome-icon
                      :icon="faCircleCheck"
                      class="tw-h-[18px] tw-w-[18px] tw-drop-shadow"
                      :class="isImageSelected(subItem._id) ? 'tw-text-accent' : 'tw-text-white/80'"
                      aria-hidden="true"
                    />
                  </button>
                  <FeatureIcon :item="subItem" />
                </div>

                <div class="tw-pointer-events-auto tw-flex tw-flex-col tw-gap-1.5">
                  <ImageActionButtons :item="subItem" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <ImageDialog :item="imageDialogItem" />
</template>

<style scoped lang="scss">
.history-container {
  height: calc(100vh - 64px);
  overflow: hidden;
}

/* Overlay chrome appears on hover, in selection mode, or always on touch devices */
.tile-overlay {
  opacity: 0;
  transition: opacity 0.2s ease;
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
  transform: scale(1.04);
}

/* Group select-all: revealed by header hover, selection mode, or touch */
.group-check {
  opacity: 0;
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

@media (prefers-reduced-motion: reduce) {
  .asset-tile__img {
    transition: none;
  }

  .asset-tile:hover .asset-tile__img {
    transform: none;
  }
}
</style>
