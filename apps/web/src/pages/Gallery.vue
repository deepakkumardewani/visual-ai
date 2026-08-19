<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';

import type { GalleryImage } from '@/types';

import { useAppStore } from '@/stores/app';

import AppModal from '@/components/AppModal.vue';

import gallery from '@/utils/gallery.json';

const appStore = useAppStore();
const { isDark } = storeToRefs(appStore);
const images = ref<GalleryImage[]>([]);
const dialog = ref(false);
const selectedImage = ref<GalleryImage | null>(null);
const loadedUrls = ref<Set<string>>(new Set());

onMounted(() => {
  images.value = gallery;
});

const openDialog = (image: GalleryImage) => {
  selectedImage.value = image;
  dialog.value = true;
};

const markLoaded = (url: string) => {
  const next = new Set(loadedUrls.value);
  next.add(url);
  loadedUrls.value = next;
};
</script>

<template>
  <div class="tw-w-full" :class="isDark ? 'tw-bg-black' : 'tw-bg-white'">
    <div
      class="tw-w-full tw-columns-2 tw-gap-2 tw-px-4 tw-py-4 sm:tw-gap-4 lg:tw-columns-3 xl:tw-columns-4"
    >
      <div v-for="(image, index) in images" :key="index" class="tw-mb-2 sm:tw-mb-4">
        <button
          type="button"
          class="tw-relative tw-w-full tw-cursor-pointer tw-overflow-hidden tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-transition-shadow hover:tw-shadow-lg"
          @click="openDialog(image)"
        >
          <div class="tw-relative tw-w-full" :style="{ aspectRatio: image.aspectRatio }">
            <div
              v-if="!loadedUrls.has(image.url)"
              class="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center"
            >
              <span class="gallery-spinner" aria-hidden="true" />
            </div>
            <img
              :src="image.url"
              :alt="image.prompt"
              class="gallery-image tw-h-full tw-w-full tw-object-cover"
              @load="markLoaded(image.url)"
            />
          </div>
        </button>
      </div>
    </div>

    <AppModal v-model:open="dialog" fullscreen>
      <template v-if="selectedImage" #title>
        {{ selectedImage.prompt }}
      </template>
      <div
        v-if="selectedImage"
        class="tw-flex tw-h-full tw-flex-col tw-items-center tw-justify-center tw-p-6"
      >
        <div class="tw-relative tw-mx-auto tw-w-full tw-max-w-7xl">
          <div class="tw-rounded-lg tw-bg-black/20 tw-p-4 tw-backdrop-blur-sm">
            <img
              :src="selectedImage.url"
              :alt="selectedImage.prompt"
              class="tw-mx-auto tw-max-h-[80vh] tw-w-auto tw-rounded-lg tw-object-contain"
              :style="{ aspectRatio: selectedImage.aspectRatio }"
            />
            <div class="tw-mt-4">
              <p
                class="tw-rounded-lg tw-bg-black/50 tw-p-4 tw-text-center tw-text-lg tw-text-white"
              >
                {{ selectedImage.prompt }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<style scoped>
.gallery-image {
  transition: transform 1s ease;
  transition-delay: 0s;
}

.gallery-image:hover {
  transition: transform 3.5s ease;
  transform: scale(1.5);
  transition-delay: 1s;
}

.gallery-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid rgba(201, 168, 76, 0.25);
  border-top-color: #c9a84c;
  border-radius: 50%;
  animation: gallery-spin 0.8s linear infinite;
}

@keyframes gallery-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
