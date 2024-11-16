<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useDisplay } from 'vuetify'

import SideBySide from '@/components/SideBySide.vue'
import { useAppStore } from '@/stores/app'
import { useGenerateStore } from '@/stores/generate'
import { downloadImage } from '@/utils/helpers'

const { mobile } = useDisplay()
const generateStore = useGenerateStore()
const appStore = useAppStore()
const { isLoading, images, upscaleInProgress, imageData } = storeToRefs(generateStore)
const { feature } = storeToRefs(appStore)

const gridClass = computed(() => {
  if (!images.value) return ''

  const imageCount = images.value.length

  if (imageCount === 4) {
    if (imageData.value.imageType === 'vertical') {
      return 'grid-vertical'
    }
    return 'grid-horizontal' // for horizontal and square
  }

  return 'tw-flex tw-flex-wrap tw-gap-4 tw-justify-center' // default flex layout
})
</script>
<template>
  <v-alert
    :model-value="upscaleInProgress"
    class="my-4"
    color="info"
    icon="$info"
    title="Upscaling in progress"
    text="You can close this dialog and check later on the history tab"
    closable
  ></v-alert>

  <div
    class="image rounded-lg"
    :class="{ 'tw-h-full': !mobile, 'tw-h-[59%] tw-overflow-scroll': mobile }"
  >
    <v-skeleton-loader v-if="isLoading" type="image"></v-skeleton-loader>
    <div v-else class="tw-justify-center tw-flex" :class="{ 'tw-h-full': feature === 'ai_image' }">
      <div
        v-if="feature === 'ai_image'"
        class="tw-w-full tw-flex"
        :class="{ 'tw-items-center': !mobile }"
      >
        <!-- Handle array of images -->
        <div v-if="images.length > 1" :class="gridClass">
          <div
            v-for="img in images"
            :key="img.name"
            class="tw-relative tw-flex tw-items-center tw-justify-center image-container"
            :class="{ 'tw-mb-3': mobile }"
          >
            <v-hover v-slot:default="{ isHovering, props }">
              <div class="tw-relative tw-w-full tw-h-full tw-rounded-md" v-bind="props">
                <v-img :src="img.aiImageUrl" contain class="generated-image tw-rounded-lg">
                  <template v-slot:placeholder>
                    <div class="tw-flex tw-items-center tw-justify-center tw-h-full">
                      <v-skeleton-loader type="image"></v-skeleton-loader>
                    </div>
                  </template>
                </v-img>
                <div v-if="isHovering || mobile" class="download-btn">
                  <v-btn @click="downloadImage($event, img.aiImageUrl)" icon size="small">
                    <v-icon icon="fas fa-download"></v-icon>
                  </v-btn>
                </div>
              </div>
            </v-hover>
          </div>
        </div>
        <!-- Single image handling -->
        <div v-else class="tw-relative tw-h-full tw-w-full">
          <v-hover>
            <template v-slot:default="{ isHovering, props }">
              <div class="tw-w-full tw-flex tw-items-center tw-h-full tw-rounded-md" v-bind="props">
                <v-img :src="images?.[0]?.aiImageUrl" contain class="tw-rounded-md">
                  <template v-slot:placeholder>
                    <div class="tw-flex tw-items-center tw-justify-center tw-h-full">
                      <v-skeleton-loader type="image"></v-skeleton-loader>
                    </div>
                  </template>
                  <template v-slot:error>
                    <v-img
                      class="mx-auto"
                      height="300"
                      max-width="500"
                      src="https://picsum.photos/500/300?image=232"
                    ></v-img>
                  </template>
                </v-img>
                <div v-if="images?.[0]?.aiImageUrl && (isHovering || mobile)" class="download-btn">
                  <v-btn @click="downloadImage($event, images?.[0]?.aiImageUrl)" icon>
                    <v-icon icon="fas fa-download"></v-icon>
                  </v-btn>
                </div>
              </div>
            </template>
          </v-hover>
        </div>
      </div>
      <div
        v-if="
          feature === 'image_upscaler' ||
          feature === 'colorize_image' ||
          feature === 'revive_old_photos'
        "
      >
        <v-hover>
          <template v-slot:default="{ isHovering, props }">
            <div
              v-bind="props"
              class="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center"
            >
              <SideBySide
                :original-image="images?.[0]?.originalImageUrl ?? ''"
                :enhanced-image="images?.[0]?.enhancedImageUrl ?? ''"
              />
              <div
                v-if="
                  (images?.[0]?.originalImageUrl !== '' &&
                    images?.[0]?.enhancedImageUrl !== '' &&
                    isHovering) ||
                  mobile
                "
                class="download-btn"
              >
                <v-btn @click="downloadImage($event, images?.[0]?.enhancedImageUrl ?? '')" icon>
                  <v-icon icon="fas fa-download"></v-icon>
                </v-btn>
              </div>
            </div>
          </template>
        </v-hover>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.download-btn {
  position: absolute;
  top: 10px;
  right: 10px;
}

img-comparison-slider {
  outline: none;
}

.image {
  position: relative;
  background: radial-gradient(circle at 50% 50%, #261f2a, #251531, #2f032f, #2e0854);
  opacity: 0.7;
  background-size: 200% 200%;
  animation: moveGradient 10s ease infinite;
}

.image-container {
  width: 100%;
  height: 100%;

  .generated-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.grid-horizontal {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 1.5rem;
  width: 100%;
  padding: 1rem;
}

.grid-vertical {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: 1fr;
  gap: 1.5rem;
  width: 100%;
  height: 80vh;
  padding: 1rem;
}

// Responsive adjustments for mobile
@media (max-width: 640px) {
  .grid-horizontal,
  .grid-vertical {
    height: auto;
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }
}

// Tablet adjustments
@media (min-width: 641px) and (max-width: 1024px) {
  .grid-vertical {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
  }
}

@keyframes moveGradient {
  0%,
  100% {
    background-position: 0% 0%;
  }
  25% {
    background-position: 100% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
  75% {
    background-position: 0% 100%;
  }
}
</style>
