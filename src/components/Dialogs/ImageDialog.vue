<script setup lang="ts">
import { FeatureType } from '@/pages/utils'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useDisplay } from 'vuetify'

import { IImageObject } from '@/types'

import { useDialogStore } from '@/stores/dialog'
import { useGenerateStore } from '@/stores/generate'
import { useUserStore } from '@/stores/user'

import SideBySide from '@/components/SideBySide.vue'

import { deleteImage, downloadImage, favoriteImage, formatFileSize } from '@/utils/helpers'

const { mobile } = useDisplay()
const dialogStore = useDialogStore()
const userStore = useUserStore()
const { history } = storeToRefs(userStore)
const { showImageDialog } = storeToRefs(dialogStore)
const generateStore = useGenerateStore()
const { isDeleting, isFavoriting } = storeToRefs(generateStore)
const isFavorite = ref(false)
const currentImageIndex = ref(0)

const props = defineProps<{
  item: IImageObject | undefined
}>()

const nextImage = () => {
  if (!props.item?.images) return
  const urls = Array.isArray(props.item.images) ? props.item.images : []
  if (currentImageIndex.value < urls.length - 1) {
    currentImageIndex.value++
  }
}

const previousImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

const downloadImageUrl = computed(() => {
  if (!props.item?.images) return ''
  const publicId = props.item.images[currentImageIndex.value]?.aiImagePublicId
    ? props.item.images[currentImageIndex.value]?.aiImagePublicId
    : props.item.images[currentImageIndex.value]?.enhancedPublicId
  const format = props.item.images[currentImageIndex.value]?.format
  const cloudinaryBaseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL
  const optimizedUrl = `${cloudinaryBaseUrl}/q_auto,f_auto/${publicId}.${format}`
  return optimizedUrl
})
const getCurrentImageUrl = () => {
  if (!props.item?.images) return ''
  const cloudinaryBaseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL
  const optimizedUrl = `${cloudinaryBaseUrl}/q_auto,f_auto/${props.item.images[currentImageIndex.value]?.aiImagePublicId}`
  return optimizedUrl
}

const originalImageUrl = computed(() => {
  if (!props.item?.images) return ''
  const cloudinaryBaseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL
  const optimizedUrl = `${cloudinaryBaseUrl}/q_auto,f_auto/${props.item.images[currentImageIndex.value]?.originalPublicId}`
  return optimizedUrl
})
const enhancedImageUrl = computed(() => {
  if (!props.item?.images) return ''
  const cloudinaryBaseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL
  const optimizedUrl = `${cloudinaryBaseUrl}/q_auto,f_auto/${props.item.images[currentImageIndex.value]?.enhancedPublicId}`
  return optimizedUrl
})
watch(
  () => props.item,
  (newItem) => {
    const item = history.value.find((item) => item._id === newItem?._id)
    if (item) {
      isFavorite.value = item.isFavorite
    }
  },
  { immediate: true, deep: true }
)

watch(history, (newHistory) => {
  const newItem = newHistory.find((item) => item._id === props.item?._id)
  if (newItem) {
    isFavorite.value = newItem.isFavorite
  }
})
</script>

<template>
  <v-dialog
    :fullscreen="mobile"
    :max-width="mobile ? '100%' : '1000'"
    :max-height="mobile ? '100%' : '1000'"
    v-model="showImageDialog"
    content-class="tw-flex tw-items-center tw-justify-center"
  >
    <v-card class="tw-flex tw-flex-col tw-h-[98vh] tw-w-[95vw]">
      <div class="action-buttons tw-flex tw-p-4">
        <div class="tw-flex tw-flex-2 tw-items-center tw-justify-start">
          <v-btn icon size="small" variant="text" @click="dialogStore.hideImage()">
            <v-icon>fas fa-times</v-icon>
          </v-btn>

          <div
            v-if="item?.prompt && !mobile"
            class="tw-flex tw-items-center tw-font-normal tw-ml-3 tw-mr-10"
          >
            {{ item.prompt }}
          </div>
        </div>

        <div class="tw-flex tw-flex-1 tw-gap-3 tw-justify-end">
          <v-tooltip location="bottom" text="Favorite">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                icon
                :loading="isFavoriting"
                size="x-small"
                variant="text"
                @click="favoriteImage($event, item?._id ?? '')"
              >
                <v-icon>{{ isFavorite ? 'fas fa-heart' : 'far fa-heart' }}</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <v-tooltip location="bottom" text="Download">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                icon
                size="x-small"
                variant="text"
                @click="downloadImage($event, downloadImageUrl)"
              >
                <v-icon>fas fa-download</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <v-tooltip location="bottom" text="Delete">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                icon
                :loading="isDeleting"
                size="x-small"
                variant="text"
                @click="deleteImage($event, item as IImageObject)"
              >
                <v-icon>fas fa-trash-alt</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </div>
      </div>

      <div
        v-if="item?.prompt && mobile"
        class="tw-flex tw-items-center tw-font-normal tw-ml-3 tw-mr-10"
      >
        {{ item.prompt }}
      </div>
      <div class="image tw-flex-grow tw-flex tw-items-center tw-justify-center tw-p-0">
        <div v-if="item?.featureType === FeatureType.IMAGE" class="tw-relative tw-w-full tw-h-full">
          <div
            v-if="item?.images?.length > 1"
            class="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-between tw-px-4 tw-pointer-events-none"
          >
            <v-btn
              icon
              variant="tonal"
              class="nav-btn tw-pointer-events-auto tw-z-10"
              @click="previousImage"
              :disabled="currentImageIndex === 0"
            >
              <v-icon>fas fa-chevron-left</v-icon>
            </v-btn>

            <v-btn
              icon
              variant="tonal"
              class="nav-btn tw-pointer-events-auto tw-z-10"
              @click="nextImage"
              :disabled="currentImageIndex === item.images.length - 1"
            >
              <v-icon>fas fa-chevron-right</v-icon>
            </v-btn>
          </div>

          <v-img
            :key="currentImageIndex"
            :src="getCurrentImageUrl()"
            height="80vh"
            :width="mobile ? '100vw' : 'auto'"
            contain
            class="tw-mx-auto"
          ></v-img>
        </div>

        <div v-if="item?.featureType !== FeatureType.IMAGE">
          <SideBySide
            :original-image="originalImageUrl"
            :enhanced-image="enhancedImageUrl"
            :in-dialog="true"
          />
        </div>
      </div>

      <div class="tw-flex">
        <div
          v-if="item?.images && item?.images?.length > 1"
          class="tw-flex tw-flex-1 tw-items-center tw-justify-end tw-py-2"
        >
          {{ currentImageIndex + 1 }} / {{ item.images?.length }}
        </div>
        <div class="tw-flex tw-flex-1 tw-gap-4 tw-justify-end tw-p-4">
          <div v-if="item?.modelName" class="tw-flex tw-gap-2">
            <v-chip size="small">{{ item.modelName }}</v-chip>
          </div>
          <div v-if="item?.images?.[0]?.aspectRatio" class="tw-flex tw-gap-2">
            <v-chip size="small">{{ item.images?.[0]?.aspectRatio }}</v-chip>
          </div>
          <div v-if="item?.images?.[0]?.bytes" class="tw-flex tw-gap-2">
            <v-chip size="small">{{
              formatFileSize(item?.images?.[currentImageIndex]?.bytes)
            }}</v-chip>
          </div>
          <div class="tw-flex tw-items-center">
            <v-chip size="small">
              <v-icon size="small">far fa-file</v-icon>
              <div class="tw-ml-1">
                {{ item?.images?.[0]?.width }} x {{ item?.images?.[0]?.height }}
              </div>
            </v-chip>
          </div>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease-out;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
