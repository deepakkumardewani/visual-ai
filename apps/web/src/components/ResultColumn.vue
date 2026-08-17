<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';

import { FeatureType } from '@/types';
import type { IImage } from '@/types';

import { useAppStore } from '@/stores/app';
import { useGenerateStore } from '@/stores/generate';

import GenerationErrorBanner from '@/components/Dashboard/Canvas/GenerationErrorBanner.vue';
import SideBySide from '@/components/SideBySide.vue';

import { downloadImage } from '@/utils/helpers';

const { mobile } = useDisplay();
const generateStore = useGenerateStore();
const appStore = useAppStore();
const {
  isLoading,
  images,
  upscaleInProgress,
  colorizeInProgress,
  reviveInProgress,
  removeBgInProgress,
  imageData,
  errMsg,
} = storeToRefs(generateStore);
const { feature } = storeToRefs(appStore);
const snackbar = ref(false);
const snackbarTimeout = ref(2000);

const activeErrMsg = computed(() => errMsg.value[feature.value] ?? '');

const getAIImageUrl = (image: IImage): string => {
  const cloudinaryBaseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL;
  const optimizedUrl = `${cloudinaryBaseUrl}/q_auto,f_auto/${image?.aiImagePublicId}`;
  return image?.aiImagePublicId ? optimizedUrl : (image?.aiImageUrl as string);
};
const originalImageUrl = computed((): string => {
  const cloudinaryBaseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL;
  const optimizedUrl = `${cloudinaryBaseUrl}/q_auto,f_auto/${images.value[0]?.originalPublicId}`;
  if (feature.value === 'upscale' && imageData.value?.featureType === 'upscale') {
    return images.value[0]?.originalPublicId
      ? optimizedUrl
      : (images.value[0]?.originalImageUrl as string);
  }
  if (feature.value === 'colorize' && imageData.value?.featureType === 'colorize') {
    return images.value[0]?.originalPublicId
      ? optimizedUrl
      : (images.value[0]?.originalImageUrl as string);
  }
  if (feature.value === 'revive' && imageData.value?.featureType === 'revive') {
    return images.value[0]?.originalPublicId
      ? optimizedUrl
      : (images.value[0]?.originalImageUrl as string);
  }
  if (feature.value === 'remove_bg' && imageData.value?.featureType === 'remove_bg') {
    return images.value[0]?.originalPublicId
      ? optimizedUrl
      : (images.value[0]?.originalImageUrl as string);
  }
  return '';
});
const enhancedImageUrl = computed((): string => {
  const cloudinaryBaseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL;
  const optimizedUrl = `${cloudinaryBaseUrl}/q_auto,f_auto/${images.value[0]?.enhancedPublicId}`;
  if (feature.value === 'upscale' && imageData.value?.featureType === 'upscale') {
    return images.value[0]?.enhancedPublicId
      ? optimizedUrl
      : (images.value[0]?.enhancedImageUrl as string);
  }
  if (feature.value === 'colorize' && imageData.value?.featureType === 'colorize') {
    return images.value[0]?.enhancedPublicId
      ? optimizedUrl
      : (images.value[0]?.enhancedImageUrl as string);
  }
  if (feature.value === 'revive' && imageData.value?.featureType === 'revive') {
    return images.value[0]?.enhancedPublicId
      ? optimizedUrl
      : (images.value[0]?.enhancedImageUrl as string);
  }
  if (feature.value === 'remove_bg' && imageData.value?.featureType === 'remove_bg') {
    return images.value[0]?.enhancedPublicId
      ? optimizedUrl
      : (images.value[0]?.enhancedImageUrl as string);
  }
  return '';
});

const showDefaultAnimation = computed(() => {
  if (feature.value === FeatureType.IMAGE) {
    if (!images.value[0] || images.value[0]?.aiImageUrl === '') {
      return true;
    }
    return false;
  }
  return originalImageUrl.value === '' && enhancedImageUrl.value === '';
});
const alertTitle = computed(() => {
  const action =
    upscaleInProgress.value && feature.value === 'upscale'
      ? 'Upscaling'
      : colorizeInProgress.value && feature.value === 'colorize'
        ? 'Colorizing'
        : reviveInProgress.value && feature.value === 'revive'
          ? 'Reviving'
          : removeBgInProgress.value && feature.value === 'remove_bg'
            ? 'Removing background'
            : '';
  if (action) {
    return `${action} your image`;
  }
  return '';
});
const alertText = computed(() => {
  const action =
    upscaleInProgress.value && feature.value === 'upscale'
      ? 'upscaling'
      : colorizeInProgress.value && feature.value === 'colorize'
        ? 'colorizing'
        : reviveInProgress.value && feature.value === 'revive'
          ? 'reviving'
          : removeBgInProgress.value && feature.value === 'remove_bg'
            ? 'removing the background'
            : '';

  if (action) {
    return `You can keep working -- ${action} runs in the background and might take longer than expected. You can close this dialog and check later on the history tab.`;
  }
  return '';
});

const showSkeleton = computed(() => {
  if (feature.value === FeatureType.IMAGE) {
    return isLoading.value;
  }
  if (feature.value === FeatureType.UPSCALE) {
    return upscaleInProgress.value;
  }
  if (feature.value === FeatureType.COLORIZE) {
    return colorizeInProgress.value;
  }
  if (feature.value === FeatureType.REVIVE) {
    return reviveInProgress.value;
  }
  if (feature.value === FeatureType.REMOVE_BG) {
    return removeBgInProgress.value;
  }
  return false;
});
const showAlert = computed(() => {
  if (feature.value === FeatureType.IMAGE) {
    return false;
  }
  if (feature.value === FeatureType.UPSCALE) {
    return upscaleInProgress.value;
  }
  if (feature.value === FeatureType.COLORIZE) {
    return colorizeInProgress.value;
  }
  if (feature.value === FeatureType.REVIVE) {
    return reviveInProgress.value;
  }
  if (feature.value === FeatureType.REMOVE_BG) {
    return removeBgInProgress.value;
  }
  return false;
});
const gridClass = computed(() => {
  if (!images.value) return '';

  const imageCount = images.value.length;

  if (imageCount === 4) {
    if (imageData.value?.imageType === 'vertical') {
      return 'grid-vertical';
    }
    return 'grid-horizontal'; // for horizontal and square
  }

  return 'tw-flex tw-flex-wrap tw-gap-4 tw-justify-center'; // default flex layout
});

watch(activeErrMsg, (newVal) => {
  if (newVal !== '') {
    snackbar.value = true;
  }
});
</script>
<template>
  <GenerationErrorBanner :feature="feature" />
  <v-alert
    :model-value="showAlert"
    class="my-4"
    color="info"
    icon="$info"
    :title="alertTitle"
    :text="alertText"
    closable
  ></v-alert>
  <div
    class="rounded-lg"
    :class="{
      'tw-h-full': !mobile,
      'tw-h-[80%] tw-overflow-scroll': mobile,
      image: showDefaultAnimation,
    }"
  >
    <v-skeleton-loader v-if="showSkeleton" type="image"></v-skeleton-loader>
    <div
      v-else
      class="tw-justify-center tw-flex"
      :class="{ 'tw-h-full': feature === FeatureType.IMAGE }"
    >
      <div
        v-if="feature === FeatureType.IMAGE"
        class="tw-w-full tw-flex"
        :class="{ 'tw-items-center': !mobile }"
      >
        <!-- Handle array of images -->
        <div v-if="images.length > 1" :class="gridClass" class="tw-relative tw-h-full tw-w-full">
          <div
            v-for="img in images"
            :key="img.name"
            class="tw-relative tw-flex tw-items-center tw-justify-center image-container"
            :class="{ 'tw-mb-3': mobile }"
          >
            <v-hover v-slot:default="{ isHovering, props }">
              <div class="tw-relative tw-w-full tw-h-full tw-rounded-md" v-bind="props">
                <v-img :src="getAIImageUrl(img)" contain class="generated-image tw-rounded-lg">
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
                <v-img :src="getAIImageUrl(images?.[0])" contain class="tw-rounded-md">
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
        class="tw-w-full tw-flex"
        v-if="feature === 'upscale' || feature === 'colorize' || feature === 'revive'"
      >
        <v-hover>
          <template v-slot:default="{ isHovering, props }">
            <div
              v-if="originalImageUrl !== '' && enhancedImageUrl !== ''"
              class="tw-w-full tw-h-full sm:tw-h-[90vh] tw-flex tw-items-center tw-justify-center tw-relative"
              v-bind="props"
            >
              <SideBySide
                :original-image="originalImageUrl"
                :enhanced-image="enhancedImageUrl"
                :transparent="feature === FeatureType.REMOVE_BG"
              />
              <div
                v-if="
                  (images?.[0] &&
                    originalImageUrl !== '' &&
                    images?.[0] &&
                    enhancedImageUrl !== '' &&
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
  <v-snackbar v-model="snackbar" :timeout="snackbarTimeout" location="bottom right" color="#C9A84C">
    {{ activeErrMsg }}
  </v-snackbar>
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
