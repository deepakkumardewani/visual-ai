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
  <div class="history-container tw-flex tw-flex-col">
    <div
      v-if="history.length > 0"
      class="history-toolbar tw-relative tw-flex tw-flex-none tw-items-center tw-border-b tw-border-hairline/70 tw-py-4"
    >
      <!-- Default chrome always occupies space so selection mode cannot shift layout -->
      <div
        class="history-toolbar__row tw-flex tw-w-full tw-items-center tw-gap-4"
        :class="{ 'tw-invisible tw-pointer-events-none': isSelecting }"
        :aria-hidden="isSelecting"
        :inert="isSelecting"
      >
        <h2 class="history-toolbar__title">
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

    <div class="history-scroll tw-flex-1 tw-overflow-y-auto tw-pb-16 tw-pt-6 no-scrollbar">
      <NoResults :isFavorites="props.isFavorites" :groupedHistory="groupedHistory" />

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

        <div :class="['asset-grid', sizeClasses[selectedSize as keyof typeof sizeClasses]]">
          <div
            v-for="subItem in item.data"
            :key="subItem._id"
            class="asset-tile tw-relative tw-aspect-square tw-cursor-pointer tw-overflow-hidden tw-rounded-card tw-bg-surface-2"
            :class="{
              'asset-tile--selecting': isSelecting,
              'asset-tile--selected': isImageSelected(subItem._id ?? ''),
              'asset-tile--idle': !isImageSelected(subItem._id ?? ''),
              'tw-opacity-50':
                isBulkDeleting || isBulkFavoriting || (isBulkDownloading && isSelecting),
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
                      isImageSelected(subItem._id ?? '') ? 'Deselect image' : 'Select image'
                    "
                    @click.stop="toggleImageSelection($event, subItem)"
                  >
                    <font-awesome-icon
                      :icon="faCircleCheck"
                      class="tw-h-[18px] tw-w-[18px] tw-drop-shadow"
                      :class="
                        isImageSelected(subItem._id ?? '') ? 'tw-text-accent' : 'tw-text-white/80'
                      "
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

@media (prefers-reduced-motion: reduce) {
  .asset-tile__img,
  .tile-overlay {
    transition: none;
  }

  .asset-tile:hover .asset-tile__img {
    transform: none;
  }
}
</style>
