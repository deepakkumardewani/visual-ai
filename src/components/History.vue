<script setup lang="ts">
import { FeatureIcon } from '@/pages/utils'
import { GroupedObject, groupByDate } from '@/pages/utils'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

import type { IImage, IImageObject } from '@/types'

import { useAppStore } from '@/stores/app'
import { useDialogStore } from '@/stores/dialog'
import { useGenerateStore } from '@/stores/generate'
import { useUserStore } from '@/stores/user'

import ImageDialog from '@/components/Dialogs/ImageDialog.vue'

import { IMAGE_SIZE_OPTIONS, SIZE_CLASSES } from '@/utils/constants'
import { deleteImage, downloadImage, favoriteImage } from '@/utils/helpers'

const router = useRouter()
const userStore = useUserStore()
const dialogStore = useDialogStore()
const appStore = useAppStore()
const generateStore = useGenerateStore()

const { isDark } = storeToRefs(appStore)
const { mobile } = useDisplay()
const { history } = storeToRefs(userStore)
const { tab } = storeToRefs(appStore)
const { deletingImageIds } = storeToRefs(generateStore)

const groupedHistory = ref<GroupedObject[]>([])
const imageDialogItem = ref<IImageObject | undefined>()
const featureTypes = ref<any[]>([
  {
    id: 'image',
    title: 'Text-to-Image'
  },
  {
    id: 'upscale',
    title: 'Upscale'
  },
  {
    id: 'colorize',
    title: 'Colorize'
  },
  {
    id: 'revive',
    title: 'Revive'
  }
])
const imageSizes = computed(() => {
  return IMAGE_SIZE_OPTIONS.filter((size) => {
    if (mobile.value && size.value === 'mini') {
      return false
    }
    return true
  })
})
const selectedSize = ref('medium')
const selectedFeatureType = ref<string[]>([])
const searchQuery = ref('')

const sizeClasses = SIZE_CLASSES

const props = withDefaults(defineProps<{ isFavorites?: boolean }>(), {
  isFavorites: false
})

const showImage = (item: IImageObject) => {
  imageDialogItem.value = item
  dialogStore.showImage()
}

function create() {
  if (props.isFavorites) {
    router.push('/dashboard')
  }
  tab.value = 1
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

watch(deletingImageIds, (newVal) => {
  console.log('deletingImageIds', newVal)
})

const carouselIndexes = ref<{ [key: string]: number }>({})
const carouselIntervals = ref<{ [key: string]: number }>({})
const isCarouselActive = ref<{ [key: string]: boolean }>({})
const carouselTimeouts = ref<{ [key: string]: number }>({})

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
      }, 1000)

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
  return image.aiImageUrl ?? image.enhancedImageUrl
}
</script>

<template>
  <div class="history-container tw-h-[calc(100vh-64px)] tw-flex tw-flex-col">
    <div class="tw-flex-none">
      <div
        v-if="history.length > 0"
        class="tw-flex tw-flex-wrap tw-justify-end tw-mt-4 tw-pb-4 tw-gap-4 tw-border-b dark:tw-border-neutral-800"
      >
        <div class="tw-flex tw-gap-4 tw-w-full sm:tw-w-[30vw]">
          <v-select
            class="tw-flex-1"
            v-model="selectedSize"
            :items="imageSizes"
            label="Image size"
            density="compact"
            variant="outlined"
            hide-details
            item-title="title"
            item-value="value"
          ></v-select>

          <v-select
            class="tw-flex-1"
            v-model="selectedFeatureType"
            :items="featureTypes"
            label="Filter by feature"
            density="compact"
            variant="outlined"
            hide-details
            item-title="title"
            item-value="id"
            multiple
            chips
            closable-chips
          ></v-select>
        </div>

        <v-text-field
          v-model="searchQuery"
          label="Search by prompt"
          density="compact"
          variant="outlined"
          class="tw-w-full md:tw-w-auto md:tw-max-w-[200px]"
          hide-details
        >
          <template v-slot:prepend-inner>
            <v-icon class="tw-mr-1" size="x-small" icon="fas fa-search" />
          </template>
          <template v-slot:append-inner>
            <v-btn icon size="x-small" variant="text" v-if="searchQuery" @click="searchQuery = ''">
              <v-icon icon="fas fa-xmark" />
            </v-btn>
          </template>
        </v-text-field>
      </div>
    </div>

    <div class="tw-flex-1 tw-overflow-y-auto tw-pt-4">
      <div
        v-if="history.length === 0"
        class="tw-flex tw-justify-center tw-items-center tw-h-full tw-text-xl tw-mx-auto"
      >
        <div class="tw-text-center tw-text-neutral-400">
          <div>You have not created any thing yet.</div>
          <div>
            Go ahead and
            <span
              @click="create"
              class="tw-text-[#ba68c8] tw-cursor-pointer tw-font-bold hover:tw-underline"
              >create</span
            >
            something.
          </div>
        </div>
      </div>

      <div
        v-if="isFavorites && history.length !== 0 && groupedHistory.length === 0"
        class="tw-flex tw-justify-center tw-items-center tw-h-full tw-text-xl tw-mx-auto"
      >
        <div class="tw-text-center tw-text-neutral-400">
          <div>No results found.</div>
        </div>
      </div>

      <div
        v-if="isFavorites && history.length === 0 && groupedHistory.length === 0"
        class="tw-flex tw-justify-center tw-items-center tw-h-full tw-text-xl tw-mx-auto"
      >
        <div class="tw-text-center tw-text-neutral-400">
          <div>You have not added any favorites yet.</div>
        </div>
      </div>

      <div v-for="item in groupedHistory" :key="item.title" class="tw-mb-6">
        <div class="tw-text-2xl tw-font-bold tw-mb-2 tw-text-neutral-500 dark:tw-text-neutral-400">
          {{ item.title }}
        </div>

        <div :class="['tw-grid tw-gap-4', sizeClasses[selectedSize as keyof typeof sizeClasses]]">
          <template v-for="subItem in item.data" :key="subItem._id">
            <v-hover v-slot="{ isHovering, props }">
              <TransitionGroup name="image-list" tag="div">
                <div
                  :key="subItem._id"
                  v-bind="props"
                  class="tw-aspect-square tw-overflow-hidden tw-rounded-lg tw-relative"
                >
                  <div
                    @click="showImage(subItem)"
                    class="tw-cursor-pointer dark:tw-bg-darkBorder tw-bg-lightBorder tw-p-1 tw-aspect-square"
                  >
                    <template v-if="subItem.images.length === 1">
                      <v-img
                        :aspect-ratio="1"
                        cover
                        :src="getImageUrl(subItem.images[0])"
                        :alt="subItem.featureType"
                        class="tw-rounded-lg"
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
                                : `translateX(0)`,
                              zIndex: 100
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

                    <div
                      v-if="isHovering || mobile"
                      class="tw-absolute tw-inset-0 tw-flex tw-flex-row tw-items-start lg:tw-mx-3 lg:tw-my-3 tw-mx-2 tw-my-2 tw-opacity-90"
                    >
                      <v-chip size="small" :color="isDark ? 'black' : 'white'" label variant="flat">
                        <div>
                          <v-icon
                            :icon="
                              isDark
                                ? `${FeatureIcon[subItem.featureType as keyof typeof FeatureIcon]}Dark`
                                : FeatureIcon[subItem.featureType as keyof typeof FeatureIcon]
                            "
                            size="medium"
                            start
                          ></v-icon>
                        </div>
                        <div class="tw-text-xs tw-text-black dark:tw-text-white">
                          {{ subItem.featureType }}
                        </div>
                      </v-chip>
                    </div>
                    <div
                      v-if="(isHovering || mobile) && subItem.images.length === 1"
                      class="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-gap-2 tw-items-end tw-pr-2 tw-mr-2 tw-mt-4"
                    >
                      <v-btn
                        icon
                        size="x-small"
                        :color="isDark ? 'black' : 'white'"
                        @click="downloadImage($event, subItem.images[0].aiImageUrl)"
                      >
                        <v-icon :color="isDark ? 'white' : 'black'">fas fa-download</v-icon>
                      </v-btn>
                      <v-btn
                        icon
                        size="x-small"
                        :color="isDark ? 'black' : 'white'"
                        @click="favoriteImage($event, subItem._id)"
                      >
                        <v-icon :color="isDark ? 'white' : 'black'">{{
                          subItem.isFavorite ? 'fas fa-heart' : 'far fa-heart'
                        }}</v-icon>
                      </v-btn>
                      <v-btn
                        icon
                        :loading="deletingImageIds.includes(subItem._id)"
                        size="x-small"
                        :color="isDark ? 'black' : 'white'"
                        @click="deleteImage($event, subItem._id)"
                      >
                        <v-icon :color="isDark ? 'white' : 'black'">fas fa-trash-alt</v-icon>
                      </v-btn>
                    </div>
                  </div>
                </div>
              </TransitionGroup>
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
