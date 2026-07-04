<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useDisplay } from 'vuetify';

import { useAppStore } from '@/stores/app';

const appStore = useAppStore();
const { mobile } = useDisplay();

const image = ref();
const width = ref(0);
const height = ref(0);

const uploadInput = ref<HTMLInputElement | null>(null);
const imagePreview = ref<HTMLElement | null>(null);
const imgSource = ref('');

let isEventListenerAdded = false;
const UPLOAD_TEXT = mobile.value ? 'Upload Image' : 'Click, or Drag image, here to upload';
const IMAGE_FORMAT_TEXT = 'JPG, PNG, or WEBP upto 5MB';
const isDragging = ref(false);
const { feature } = storeToRefs(appStore);
function handleDragLeave() {
  isDragging.value = false;
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
  isDragging.value = true;
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;
  const file = e.dataTransfer?.files[0];
  if (file && file.type.startsWith('image/')) {
    handleFileUpload(file);
  }
}

function removeImage() {
  image.value = null;
  width.value = 0;
  height.value = 0;
  if (mobile.value) {
    imgSource.value = '';
  }
}

function handleFileUpload(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    image.value = file;
    const img = new Image();
    img.onload = () => {
      width.value = img.width;
      height.value = img.height;
    };
    img.src = e.target?.result as string;
    imgSource.value = e.target?.result as string;
    if (!mobile.value && imagePreview.value) {
      // imagePreview.value.innerHTML = `<img src="${imgSource.value}" class="tw-rounded-sm" alt="Image preview" />`

      // Only add click event listener if there's no image and it hasn't been added before
      if (!isEventListenerAdded && !image.value) {
        imagePreview.value?.addEventListener('click', () => {
          uploadInput.value?.click();
        });
        isEventListenerAdded = true;
      }
    }
  };
  try {
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('Error starting file read:', error);
  }
}

function createImageReader() {
  uploadInput.value = document.getElementById('upload') as HTMLInputElement;
  imagePreview.value = document.getElementById('image-preview') as HTMLElement;

  uploadInput?.value?.addEventListener('change', (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      handleFileUpload(file);
    }
  });

  uploadInput.value?.addEventListener('click', (event) => {
    event.stopPropagation();
  });
}

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const fileSize = computed(() => {
  return image.value ? formatFileSize(image.value.size) : '';
});
onMounted(() => {
  createImageReader();
});
defineExpose({
  image,
  width,
  height,
});
</script>
<template>
  <div class="tw-max-w-sm tw-mx-auto tw-rounded-lg tw-overflow-hidden tw-items-center">
    <div class="tw-py-1">
      <div class="tw-relative tw-flex tw-items-center tw-justify-center">
        <div
          id="image-preview"
          class="tw-flex tw-flex-1 tw-max-w-sm tw-p-2 tw-mb-2 tw-rounded-lg tw-items-center tw-mx-auto tw-text-center tw-border-dashed tw-border-2 tw-border-gray-400"
          :class="{
            'tw-border-[#C9A84C] tw-rounded-lg animate-border': isDragging,
            'tw-h-16 tw-p-0': image && mobile,
          }"
          @dragleave="handleDragLeave"
          @dragover="handleDragOver"
          @drop="handleDrop"
        >
          <input
            id="upload"
            type="file"
            class="tw-hidden"
            accept="image/jpeg, image/png, image/webp"
          />
          <template v-if="!mobile">
            <div v-if="image">
              <img :src="imgSource" alt="Preview" class="tw-object-cover tw-rounded" />
            </div>
            <label
              v-else
              for="upload"
              class="tw-cursor-pointer tw-p-2 sm:tw-p-4 tw-rounded-lg tw-block tw-transition-all tw-duration-300"
            >
              <v-icon
                class="tw-w-6 tw-h-6 sm:tw-w-8 sm:tw-h-8 tw-mx-auto tw-mb-2 sm:tw-mb-4 tw-text-neutral-600 dark:tw-text-neutral-300"
                >fas fa-upload</v-icon
              >
              <h5
                class="tw-mb-1 sm:tw-mb-2 tw-text-base sm:tw-text-xl tw-font-bold tw-tracking-tight tw-text-neutral-600 dark:tw-text-neutral-300"
              >
                {{ UPLOAD_TEXT }}
              </h5>
              <p
                class="tw-font-normal tw-text-xs sm:tw-text-sm md:tw-px-6 tw-text-neutral-600 dark:tw-text-neutral-300"
              >
                {{ IMAGE_FORMAT_TEXT }}
              </p>
            </label>
          </template>
          <template v-if="mobile">
            <div class="tw-flex tw-items-center tw-justify-between tw-px-4">
              <div class="tw-w-16 tw-h-12 tw-flex tw-items-center tw-justify-center">
                <img
                  v-if="image"
                  :src="imgSource"
                  alt="Preview"
                  class="tw-h-12 tw-w-12 tw-object-cover tw-rounded"
                />
              </div>
              <div class="tw-flex-1 tw-mx-4 tw-text-center">
                <label for="upload" class="tw-cursor-pointer tw-flex tw-items-center tw-gap-2">
                  <v-icon class="tw-text-neutral-600 dark:tw-text-neutral-300"
                    >fas fa-upload</v-icon
                  >
                  <span class="tw-text-sm">Upload Image</span>
                </label>
              </div>
            </div>
          </template>
        </div>

        <div class="tw-flex tw-items-center tw-justify-center tw-ml-2">
          <v-icon
            v-if="image && mobile"
            class="tw-cursor-pointer tw-text-neutral-600 dark:tw-text-neutral-300"
            size="small"
            @click="removeImage"
            >fas fa-trash</v-icon
          >
        </div>
      </div>

      <!-- Add image information row -->
      <div
        v-if="image && feature === 'upscale'"
        class="tw-flex tw-justify-between tw-mt-1 sm:tw-mt-2 tw-text-xs sm:tw-text-sm tw-text-neutral-600 dark:tw-text-neutral-300 tw-px-2"
      >
        <div class="tw-flex tw-items-center">
          <div class="tw-flex tw-items-center">
            <v-icon icon="fas fa-file-image" size="x-small" class="tw-mr-1" />
            {{ fileSize }}
          </div>
          <div class="tw-mx-2 tw-h-4 tw-w-px tw-bg-neutral-300 dark:tw-bg-neutral-600"></div>
          <div class="tw-flex tw-items-center">
            <v-icon icon="fas fa-expand" size="x-small" class="tw-mr-1" />
            {{ width }} x {{ height }}px
          </div>
        </div>
        <div v-if="!mobile" class="tw-flex tw-items-center">
          <v-icon
            class="tw-cursor-pointer tw-text-neutral-600 dark:tw-text-neutral-300 hover:tw-text-red-500 dark:hover:tw-text-red-400"
            size="x-small"
            @click="removeImage"
          >
            fas fa-trash
          </v-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.animate-border {
  border-image-slice: 1;
  border-image-width: 2px;
  border-image-outset: 0;
  border-image-repeat: stretch;
  animation: borderAnimation 4s ease infinite;
}
@keyframes borderAnimation {
  0% {
    border-image-source: linear-gradient(to right, #c9a84c, #d4b577, #c98a5a, #b39649);
  }
  25% {
    border-image-source: linear-gradient(to bottom, #c9a84c, #d4b577, #c98a5a, #b39649);
  }
  50% {
    border-image-source: linear-gradient(to left, #c9a84c, #d4b577, #c98a5a, #b39649);
  }
  75% {
    border-image-source: linear-gradient(to top, #c9a84c, #d4b577, #c98a5a, #b39649);
  }
  100% {
    border-image-source: linear-gradient(to right, #c9a84c, #d4b577, #c98a5a, #b39649);
  }
}

img.tw-rounded-full {
  @apply tw-transition-all tw-duration-300;
}
</style>
