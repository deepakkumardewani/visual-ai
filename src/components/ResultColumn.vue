<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useAppStore } from '@/stores/app'
import { useGenerateStore } from '@/stores/generate'

import { ImgComparisonSlider } from '@img-comparison-slider/vue'

const generateStore = useGenerateStore()
const appStore = useAppStore()
const { isLoading, image, originalImage, enhancedImage } = storeToRefs(generateStore)
const { feature } = storeToRefs(appStore)
// const original = ref(
//   'https://res.cloudinary.com/ddzuitkzt/image/upload/v1726428714/private/development/uploads/deepak_kumar_sH03wK/colorize/original-294282f0-7399-11ef-b184-67d6ad997806.jpg'
// )
// const enhanced = ref(
//   'https://replicate.delivery/pbxt/lhsjqIR4JE4LLZtGLA0w44FwyyeXytAI4CIg4eLiGmT8gOdTA/out.png'
// )
const downloadImage = () => {
  let imageUrl = ''
  if (feature.value === 'ai_image') {
    imageUrl = image.value
  } else if (feature.value === 'image_upscaler' || feature.value === 'colorize_image') {
    imageUrl = enhancedImage.value
  }

  if (imageUrl) {
    fetch(imageUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = 'generated_image.png'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      })
      .catch((error) => console.error('Error downloading image:', error))
  }
}

const showBorder = computed(() => {
  return image.value === '' && enhancedImage.value === '' && originalImage.value === ''
})
</script>
<template>
  <div
    class="image rounded-lg align-center justify-center"
    :class="{ 'tw-h-full tw-border tw-border-purple-300': showBorder }"
  >
    <v-skeleton-loader v-if="isLoading" type="image"></v-skeleton-loader>
    <div v-else>
      <v-hover>
        <template v-slot:default="{ isHovering, props }">
          <div v-bind="props" class="image-container">
            <div v-if="feature === 'ai_image'">
              <v-img width="auto" height="auto" cover :src="image">
                <template v-slot:placeholder>
                  <div class="d-flex align-center justify-center fill-height">
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
            <div v-if="feature === 'image_upscaler' || feature === 'colorize_image'">
              <ImgComparisonSlider class="tw-w-full">
                <!-- eslint-disable -->
                <img class="tw-w-full" slot="first" :src="originalImage" />
                <img class="tw-w-full" slot="second" :src="enhancedImage" />
                <!-- eslint-enable -->
              </ImgComparisonSlider>
            </div>
            <div v-if="isHovering" class="download-btn">
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

.image-container {
  position: relative;
}
img-comparison-slider {
  outline: none;
}

.image {
  position: relative;
  overflow: hidden;
  // height: 100vh;

  &::before {
    content: '';
    position: absolute;
    top: -100%;
    left: -100%;
    right: -100%;
    bottom: -100%;
    background: radial-gradient(circle at 50% 50%, #261f2a, #251531, #2f032f, #2e0854);
    opacity: 0.7;
    background-size: 200% 200%;
    animation: moveGradient 10s ease infinite;
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
