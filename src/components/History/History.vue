<script setup lang="ts">
import { groupByDate } from '@/pages/utils'
import { faCircleCheck, faXmark } from '@/plugins/icons'
import { storeToRefs } from 'pinia'
import { useDisplay } from 'vuetify'

import type { GroupedObject, IImage, IImageObject } from '@/types'

import { useAppStore } from '@/stores/app'
import { useDialogStore } from '@/stores/dialog'
import { useHistoryStore } from '@/stores/history'
import { useUserStore } from '@/stores/user'

import ImageDialog from '@/components/Dialogs/ImageDialog.vue'
import FeatureIcon from '@/components/History/FeatureIcon.vue'
import Filter from '@/components/History/Filter.vue'
import ImageActionButtons from '@/components/History/ImageActionButtons.vue'
import NoResults from '@/components/History/NoResults.vue'
import SelectActionButtons from '@/components/History/SelectActionButtons.vue'

import { SIZE_CLASSES } from '@/utils/constants'

const props = withDefaults(defineProps<{ isFavorites?: boolean }>(), {
  isFavorites: false
})
const userStore = useUserStore()
const dialogStore = useDialogStore()

const { mobile } = useDisplay()
const { isDark } = storeToRefs(useAppStore())
const { isBulkDeleting, isBulkFavoriting, isBulkDownloading } = storeToRefs(useHistoryStore())
const { history } = storeToRefs(userStore)
const { selectedSize } = storeToRefs(useHistoryStore())

const groupedHistory = ref<GroupedObject[]>([])
const imageDialogItem = ref<IImageObject | undefined>()
const selectedFeatureType = ref<string[]>([])
const searchQuery = ref('')
const sizeClasses = SIZE_CLASSES

const carouselIndexes = ref<{ [key: string]: number }>({})
const carouselIntervals = ref<{ [key: string]: number }>({})
const isCarouselActive = ref<{ [key: string]: boolean }>({})
const carouselTimeouts = ref<{ [key: string]: number }>({})
const selectedImages = ref<IImageObject[]>([])

const showImage = (item: IImageObject) => {
  if (isBulkDeleting.value || isBulkFavoriting.value || isBulkDownloading.value) return
  imageDialogItem.value = item
  dialogStore.showImage()
}

// watch(deletingImageIds, (newVal) => {
//   // console.log('deletingImageIds', newVal)
// })

const startCarousel = (itemId: string, images: IImage[]) => {
  if (carouselIntervals.value[itemId]) return

  // Create a timeout before starting the carousel
  carouselTimeouts.value[itemId] = window.setTimeout(() => {
    // Only start if the timeout wasn't cleared
    if (carouselTimeouts.value[itemId]) {
      // Set active state for smooth transition
      isCarouselActive.value[itemId] = true

      carouselIndexes.value[itemId] = 0
      carouselIntervals.value[itemId] = window.setInterval(() => {
        carouselIndexes.value[itemId] = (carouselIndexes.value[itemId] + 1) % images.length
      }, 2000)

      // Clear the timeout reference
      delete carouselTimeouts.value[itemId]
    }
  }, 500)
}

const stopCarousel = (itemId: string) => {
  // Clear the timeout if it exists
  if (carouselTimeouts.value[itemId]) {
    clearTimeout(carouselTimeouts.value[itemId])
    delete carouselTimeouts.value[itemId]
  }

  // Clear the interval if it exists
  if (carouselIntervals.value[itemId]) {
    clearInterval(carouselIntervals.value[itemId])
    delete carouselIntervals.value[itemId]
    delete carouselIndexes.value[itemId]
    isCarouselActive.value[itemId] = false
  }
}
const getImageUrl = (image: IImage) => {
  const cloudinaryBaseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL
  const optimizedUrl = `${cloudinaryBaseUrl}/q_auto,f_auto/${image.aiImagePublicId ? image.aiImagePublicId : image.enhancedPublicId}`
  return optimizedUrl
}

const toggleImageSelection = async (event: Event, image: IImageObject) => {
  if (isBulkDeleting.value || isBulkFavoriting.value || isBulkDownloading.value) return
  event.stopPropagation()
  if (selectedImages.value.some((item) => item._id === image._id)) {
    selectedImages.value = selectedImages.value.filter((item) => item._id !== image._id)
  } else {
    selectedImages.value.push(image)
  }
}

const isImageSelected = (imageId: string) => {
  return Array.from(selectedImages.value).some((item) => item._id === imageId)
}

const selectAllInGroup = (groupData: IImageObject[]) => {
  groupData.forEach((item) => {
    selectedImages.value.push(item)
  })
}

const areAllSelectedInGroup = (groupData: IImageObject[]): boolean => {
  return groupData.every((item) =>
    Array.from(selectedImages.value).some((selected) => selected._id === item._id)
  )
}

const toggleGroupSelection = (groupData: IImageObject[]) => {
  if (isBulkDeleting.value || isBulkFavoriting.value || isBulkDownloading.value) return
  if (areAllSelectedInGroup(groupData)) {
    groupData.forEach((item) => {
      selectedImages.value = selectedImages.value.filter((selected) => selected._id !== item._id)
    })
  } else {
    selectAllInGroup(groupData)
  }
}

watch(
  [history, selectedFeatureType, searchQuery],
  ([newHistory, newFeatureTypes, query]) => {
    if (newHistory) {
      let filteredHistory = newHistory

      // Feature type filter
      if (newFeatureTypes.length > 0) {
        filteredHistory = filteredHistory.filter((item: IImageObject) =>
          newFeatureTypes.includes(item.featureType)
        )
      }

      // Search query filter
      if (query.trim()) {
        const searchTerm = query.toLowerCase().trim()
        filteredHistory = filteredHistory.filter((item: IImageObject) =>
          item.prompt?.toLowerCase().includes(searchTerm)
        )
      }

      // Favorites filter
      if (props.isFavorites) {
        filteredHistory = filteredHistory.filter((item: IImageObject) => item.isFavorite)
      }

      groupedHistory.value = groupByDate(filteredHistory)
    }
  },
  { immediate: true, deep: true }
)

watch(
  [isBulkDeleting, isBulkFavoriting, isBulkDownloading],
  ([isDeleting, isFavoriting, isDownloading]) => {
    if (isDeleting || isFavoriting || isDownloading) {
      selectedImages.value = []
    }
  }
)
</script>

<template>
  <div class="history-container tw-p-3 tw-h-[calc(100vh-64px)] tw-flex tw-flex-col">
    <div class="tw-flex-none">
      <div
        v-if="history.length > 0"
        class="tw-flex tw-justify-between tw-mt-4 tw-pb-4 tw-gap-4 tw-border-b dark:tw-border-neutral-800"
      >
        <div
          v-if="selectedImages.length > 0"
          class="tw-flex tw-flex-1 tw-items-center tw-justify-start tw-gap-2"
        >
          <div>
            <v-btn icon size="large" variant="text" @click="selectedImages = []">
              <font-awesome-icon :icon="faXmark" :color="isDark ? 'white' : 'black'" />
            </v-btn>
          </div>
          <div class="tw-text-2xl tw-text-black dark:tw-text-white">
            {{ selectedImages.length }}
          </div>
        </div>

        <div
          v-if="selectedImages.length === 0"
          class="tw-flex tw-flex-1 tw-items-center tw-justify-end tw-flex-wrap"
        >
          <Filter ref="filterRef" />
        </div>
        <div v-else class="tw-flex tw-items-center tw-justify-end tw-gap-0 sm:tw-gap-4">
          <SelectActionButtons :selectedImages="selectedImages" />
        </div>
      </div>
    </div>

    <div class="tw-flex-1 tw-overflow-y-auto tw-pt-4">
      <NoResults :isFavorites="props.isFavorites" :groupedHistory="groupedHistory" />

      <div v-for="item in groupedHistory" :key="item.title" class="tw-mb-6">
        <v-hover v-slot="{ isHovering, props }">
          <div v-bind="props" class="tw-flex tw-items-center tw-gap-2">
            <div
              class="tw-text-2xl tw-font-bold tw-mb-2 tw-text-neutral-500 dark:tw-text-neutral-400"
            >
              {{ item.title }}
            </div>
            <font-awesome-icon
              v-if="isHovering || selectedImages.length > 0"
              :icon="faCircleCheck"
              :class="[
                isBulkDeleting || isBulkFavoriting || isBulkDownloading
                  ? 'tw-cursor-not-allowed'
                  : 'tw-cursor-pointer',
                areAllSelectedInGroup(item.data) ? 'tw-text-blue-500' : 'tw-text-neutral-500'
              ]"
              size="lg"
              @click="toggleGroupSelection(item.data)"
            ></font-awesome-icon>
          </div>
        </v-hover>

        <div :class="['tw-grid tw-gap-4', sizeClasses[selectedSize as keyof typeof sizeClasses]]">
          <template v-for="subItem in item.data" :key="subItem._id">
            <v-hover v-slot="{ isHovering, props }">
              <div
                v-bind="props"
                class="tw-cursor-pointer dark:tw-bg-darkBorder tw-bg-lightBorder tw-p-1 tw-aspect-square"
                :class="{
                  'tw-opacity-50':
                    isBulkDeleting ||
                    isBulkFavoriting ||
                    (isBulkDownloading && selectedImages.length > 0)
                }"
              >
                <div class="tw-h-full tw-relative">
                  <!-- Image content -->
                  <div class="tw-h-full tw-z-[1]" @click="showImage(subItem)">
                    <template v-if="subItem.images.length === 1">
                      <v-img
                        :aspect-ratio="1"
                        cover
                        :src="getImageUrl(subItem.images[0])"
                        :alt="subItem.featureType"
                        class="tw-rounded-lg tw-h-full"
                      >
                        <template v-slot:placeholder>
                          <div class="d-flex align-center justify-center fill-height">
                            <v-progress-circular
                              color="grey-lighten-4"
                              indeterminate
                            ></v-progress-circular>
                          </div>
                        </template>
                      </v-img>
                    </template>

                    <template v-else>
                      <div
                        class="tw-relative tw-flex tw-h-full"
                        @mouseenter="startCarousel(subItem._id, subItem.images)"
                        @mouseleave="stopCarousel(subItem._id)"
                      >
                        <template v-for="(img, index) in subItem.images" :key="index">
                          <v-img
                            cover
                            :src="img.aiImageUrl"
                            :alt="subItem.featureType"
                            class="tw-rounded-sm"
                            :class="{
                              'tw-border-black tw-border-2': !isCarouselActive[subItem._id]
                            }"
                            :style="{
                              transition: 'all 0.5s ease-in-out',
                              width: isHovering
                                ? carouselIndexes[subItem._id] === index
                                  ? '100%'
                                  : '0%'
                                : '25%',
                              transform: !isHovering
                                ? `translateX(${index * 1}px)`
                                : `translateX(0)`
                            }"
                          >
                            <template v-slot:placeholder>
                              <div class="d-flex align-center justify-center fill-height">
                                <v-progress-circular
                                  color="grey-lighten-4"
                                  indeterminate
                                ></v-progress-circular>
                              </div>
                            </template>
                          </v-img>
                        </template>
                      </div>
                    </template>
                  </div>

                  <!-- Overlay content -->
                  <div class="tw-absolute tw-inset-0 tw-p-2 tw-pointer-events-none">
                    <!-- Add vignette gradient -->
                    <div
                      v-if="isHovering || mobile"
                      class="tw-absolute tw-inset-0 tw-bg-gradient-to-b tw-from-black/50 tw-to-transparent tw-h-20 tw-pointer-events-none"
                    ></div>

                    <div class="tw-flex tw-justify-between tw-items-start tw-relative tw-z-10">
                      <!-- Left side icons -->
                      <div class="tw-flex tw-items-center tw-gap-1 tw-pointer-events-auto">
                        <div
                          class="tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center tw-flex-shrink-0"
                        >
                          <v-icon
                            v-if="isHovering || mobile || selectedImages.length > 0"
                            @click.stop="toggleImageSelection($event, subItem)"
                            icon="fas fa-circle-check"
                            class="tw-z-[2] !tw-h-5 !tw-w-5 check-icon-with-gradient"
                            :class="[
                              isBulkDeleting || isBulkFavoriting || isBulkDownloading
                                ? 'tw-cursor-not-allowed'
                                : 'tw-cursor-pointer',
                              isImageSelected(subItem._id)
                                ? 'tw-text-blue-500'
                                : 'tw-text-neutral-200'
                            ]"
                            size="small"
                          ></v-icon>
                        </div>
                        <div
                          class="tw-h-6 tw-flex tw-items-center tw-justify-center tw-flex-shrink-0"
                        >
                          <FeatureIcon v-if="isHovering || mobile" :item="subItem" />
                        </div>
                      </div>

                      <!-- Right side action buttons -->
                      <div
                        v-if="isHovering || mobile"
                        class="tw-flex tw-flex-col tw-gap-2 tw-pointer-events-auto"
                      >
                        <ImageActionButtons :item="subItem" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </v-hover>
          </template>
        </div>
      </div>
    </div>
  </div>
  <ImageDialog :item="imageDialogItem" />
</template>

<style scoped lang="scss">
.v-btn {
  opacity: 0.7;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 1;
  }
}

.image-list-move,
.image-list-enter-active,
.image-list-leave-active {
  transition: all 0.3s ease;
}

.image-list-enter-from,
.image-list-leave-to {
  opacity: 0;
}

.image-list-leave-active {
  position: absolute;
}

.v-img {
  transition: clip-path 0.3s ease;
}

.history-container {
  height: calc(100vh - 64px);
  overflow: hidden;
}
</style>
