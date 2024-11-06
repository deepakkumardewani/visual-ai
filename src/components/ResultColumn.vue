<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useDisplay } from 'vuetify'

import SideBySide from '@/components/SideBySide.vue'
import { useAppStore } from '@/stores/app'
import { useGenerateStore } from '@/stores/generate'
import { downloadImage } from '@/utils/helpers'

const { mobile } = useDisplay()
const generateStore = useGenerateStore()
const appStore = useAppStore()
const { isLoading, image, originalImage, enhancedImage, upscaleInProgress } =
  storeToRefs(generateStore)
const { feature } = storeToRefs(appStore)

// const showBorder = computed(() => {
//   return image.value === '' && enhancedImage.value === '' && originalImage.value === ''
// })
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

  <div class="image rounded-lg">
    <v-skeleton-loader v-if="isLoading" type="image"></v-skeleton-loader>
    <div v-else class="tw-justify-center tw-flex" :class="{ 'tw-h-full': feature === 'ai_image' }">
      <v-hover>
        <template v-slot:default="{ isHovering, props }">
          <div
            v-if="image !== '' || (originalImage !== '' && enhancedImage !== '')"
            v-bind="props"
            class="tw-relative tw-w-full tw-flex tw-items-center tw-justify-center"
          >
            <div
              v-if="feature === 'ai_image'"
              class="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center"
            >
              <v-img :src="image" class="tw-w-full" contain>
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
            </div>
            <div
              v-if="
                feature === 'image_upscaler' ||
                feature === 'colorize_image' ||
                feature === 'revive_old_photos'
              "
              class="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center"
            >
              <SideBySide :original-image="originalImage" :enhanced-image="enhancedImage" />
            </div>
            <div v-if="isHovering || mobile" class="download-btn">
              <v-btn @click="downloadImage" icon>
                <v-icon icon="fas fa-download"></v-icon>
              </v-btn>
            </div>
          </div>
        </template>
      </v-hover>
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
  height: 100%;
  background: radial-gradient(circle at 50% 50%, #261f2a, #251531, #2f032f, #2e0854);
  opacity: 0.7;
  background-size: 200% 200%;
  animation: moveGradient 10s ease infinite;
  // &::before {
  //   content: '';
  //   position: absolute;
  //   top: -100%;
  //   left: -100%;
  //   right: -100%;
  //   bottom: -100%;
  //   background: radial-gradient(circle at 50% 50%, #261f2a, #251531, #2f032f, #2e0854);
  //   opacity: 0.7;
  //   background-size: 200% 200%;
  //   animation: moveGradient 10s ease infinite;
  // }
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
