<script lang="ts" setup>
import { faXmark } from '@/plugins/icons';
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';

import type { GalleryImage } from '@/types';

import { useAppStore } from '@/stores/app';

import gallery from '@/utils/gallery.json';

const appStore = useAppStore();
const { isDark } = storeToRefs(appStore);
const images = ref<GalleryImage[]>([]);
const dialog = ref(false);
const selectedImage = ref<GalleryImage | null>(null);
// const hoverTimeout = ref<number | null>(null)
const dialogOrigin = ref({ x: 0, y: 0, width: 0, height: 0 });
// const isHovering = ref(false)
// const dialogWidth = ref('90vw')
// const dialogHeight = ref('90vh')

onMounted(async () => {
  images.value = gallery;
});

const openDialog = (image: GalleryImage, event?: MouseEvent) => {
  selectedImage.value = image;
  if (event) {
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    dialogOrigin.value = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }
  dialog.value = true;
};

// const handleMouseEnter = (image: GalleryImage, event: MouseEvent) => {
//   isHovering.value = true
//   hoverTimeout.value = window.setTimeout(() => {
//     isHovering.value = false
//     openDialog(image, event)
//   }, 3000)
// }

// const handleMouseLeave = () => {
//   isHovering.value = false
//   if (hoverTimeout.value) {
//     clearTimeout(hoverTimeout.value)
//     hoverTimeout.value = null
//   }
// }

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.classList.contains('v-overlay__scrim')) {
    dialog.value = false;
  }
};
</script>

<template>
  <v-container fluid :class="isDark ? 'tw-bg-black' : 'tw-bg-white'">
    <div class="tw-columns-2 lg:tw-columns-3 xl:tw-columns-4 tw-gap-2 sm:tw-gap-4">
      <div v-for="(image, index) in images" :key="index" class="tw-mb-2 sm:tw-mb-4">
        <v-card
          @click="(e: MouseEvent) => openDialog(image, e)"
          class="tw-cursor-pointer hover:tw-shadow-lg tw-transition-shadow tw-relative"
        >
          <v-img
            :src="image.url"
            :alt="image.prompt"
            class="gallery-image"
            :aspect-ratio="image.aspectRatio"
          >
            <template v-slot:placeholder>
              <div class="tw-flex tw-items-center tw-justify-center tw-h-full">
                <v-progress-circular indeterminate></v-progress-circular>
              </div>
            </template>
          </v-img>
        </v-card>
      </div>
    </div>

    <v-dialog
      v-model="dialog"
      fullscreen
      transition="dialog-transition"
      :retain-focus="false"
      class="gallery-dialog"
      @click:outside="handleClickOutside"
      opacity="0.7"
      scrim="black"
    >
      <v-card
        v-if="selectedImage"
        class="tw-relative tw-bg-transparent tw-shadow-none tw-h-full"
        elevation="0"
      >
        <div class="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full tw-p-6">
          <div class="tw-relative tw-w-full tw-max-w-7xl tw-mx-auto">
            <!-- Close button -->
            <v-btn
              icon
              variant="text"
              class="tw-absolute tw-right-4 tw-top-4 tw-z-10"
              size="small"
              @click="dialog = false"
            >
              <font-awesome-icon :icon="faXmark" />
            </v-btn>

            <!-- Image container -->
            <div class="tw-bg-black/20 tw-backdrop-blur-sm tw-rounded-lg tw-p-4">
              <v-img
                :src="selectedImage.url"
                :alt="selectedImage.prompt"
                class="tw-max-h-[80vh] tw-w-auto tw-mx-auto tw-rounded-lg"
                :aspect-ratio="selectedImage.aspectRatio"
                contain
              />

              <!-- Prompt text -->
              <div class="tw-mt-4">
                <p
                  class="tw-text-white tw-text-center tw-p-4 tw-text-lg tw-bg-black/50 tw-rounded-lg"
                >
                  {{ selectedImage.prompt }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
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

.overlay-fade {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

.prompt-overlay {
  display: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

:deep(.dialog-transition-enter-active),
:deep(.dialog-transition-leave-active) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.dialog-transition-enter-from) {
  opacity: 0;
  transform: scale(0.5);
  transform-origin: v-bind(
    '`${dialogOrigin.x + dialogOrigin.width/2}px ${dialogOrigin.y + dialogOrigin.height/2}px`'
  );
}

:deep(.dialog-transition-leave-to) {
  opacity: 0;
  transform: scale(0.5);
  transform-origin: center center;
}

:deep(.dialog-transition-enter-to),
:deep(.dialog-transition-leave-from) {
  opacity: 1;
  transform: scale(1);
}

.gallery-dialog :deep(.v-overlay__content) {
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
}

.gallery-dialog :deep(.v-card) {
  box-shadow: none !important;
  background: transparent !important;
}

:deep(.dialog-transition-enter-active),
:deep(.dialog-transition-leave-active) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.dialog-transition-enter-from),
:deep(.dialog-transition-leave-to) {
  opacity: 0;
  transform: scale(0.98);
}

:deep(.dialog-transition-enter-to),
:deep(.dialog-transition-leave-from) {
  opacity: 1;
  transform: scale(1);
}
</style>
