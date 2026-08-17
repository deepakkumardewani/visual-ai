<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';

import { useAppStore } from '@/stores/app';
import { useAsideStore } from '@/stores/aside';

import { ACCEPTED_IMAGE_ACCEPT, useImageDrop } from '@/composables/useImageDrop';

const appStore = useAppStore();
const asideStore = useAsideStore();
const { feature } = storeToRefs(appStore);
const { pendingFeatureImage } = storeToRefs(asideStore);

const image = ref<File | null>(null);
const width = ref(0);
const height = ref(0);
const imgSource = ref('');
const uploadInput = ref<HTMLInputElement | null>(null);
const errorMsg = ref('');

const fileSize = computed(() => (image.value ? formatFileSize(image.value.size) : ''));
const showUpscaleMeta = computed(() => Boolean(image.value && feature.value === 'upscale'));

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function resetImage() {
  image.value = null;
  width.value = 0;
  height.value = 0;
  imgSource.value = '';
  errorMsg.value = '';
  if (uploadInput.value) uploadInput.value.value = '';
}

function applyImageFile(file: File) {
  errorMsg.value = '';
  image.value = file;
  const reader = new FileReader();
  reader.onload = (event) => {
    imgSource.value = String(event.target?.result ?? '');
    const img = new Image();
    img.onload = () => {
      width.value = img.width;
      height.value = img.height;
    };
    img.src = imgSource.value;
  };
  reader.onerror = () => {
    errorMsg.value = 'Could not read that file. Try another image.';
    resetImage();
  };
  reader.readAsDataURL(file);
}

const { isDragging, acceptFile, handleDragOver, handleDragLeave, handleDrop } = useImageDrop({
  listenPaste: true,
  onImage: applyImageFile,
  onError: (message) => {
    errorMsg.value = message;
  },
});

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) acceptFile(file);
}

function applyPendingFeatureImage() {
  const pending = asideStore.consumePendingFeatureImage();
  if (pending) applyImageFile(pending);
}

onMounted(applyPendingFeatureImage);

watch(pendingFeatureImage, (file) => {
  if (file) applyPendingFeatureImage();
});

defineExpose({
  image,
  width,
  height,
});
</script>

<template>
  <div data-testid="image-upload" class="tw-w-full">
    <div
      class="tw-relative tw-flex tw-min-h-[9.5rem] tw-w-full tw-flex-col tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-dashed tw-px-4 tw-py-6 tw-transition-colors tw-duration-fast"
      :class="
        isDragging
          ? 'tw-border-accent tw-bg-accent/10'
          : 'tw-border-ink-faint/50 tw-bg-surface-2/40 hover:tw-border-ink-muted'
      "
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <input
        id="feature-image-upload"
        ref="uploadInput"
        type="file"
        :accept="ACCEPTED_IMAGE_ACCEPT"
        class="tw-sr-only"
        data-testid="image-upload-input"
        @change="handleFileChange"
      />

      <template v-if="imgSource">
        <button
          type="button"
          class="tw-absolute tw-right-2 tw-top-2 tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-bg-surface-1/90 tw-text-ink-muted tw-shadow-sm hover:tw-text-ink focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent"
          aria-label="Remove image"
          @click="resetImage"
        >
          <font-awesome-icon icon="xmark" class="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
        </button>
        <img
          :src="imgSource"
          alt="Upload preview"
          class="tw-max-h-36 tw-w-full tw-rounded-lg tw-object-contain"
        />
        <div
          v-if="showUpscaleMeta"
          class="tw-mt-2 tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-text-eyebrow tw-text-ink-muted"
        >
          <span>{{ fileSize }}</span>
          <span>{{ width }} × {{ height }}px</span>
        </div>
      </template>

      <button
        v-else
        type="button"
        class="tw-flex tw-cursor-pointer tw-flex-col tw-items-center tw-gap-2 tw-border-0 tw-bg-transparent tw-text-center"
        data-testid="image-upload-trigger"
        @click="uploadInput?.click()"
      >
        <span
          class="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-full tw-bg-surface-3/70 tw-text-ink-muted"
          aria-hidden="true"
        >
          <font-awesome-icon icon="upload" class="tw-h-5 tw-w-5" />
        </span>
        <span class="tw-text-body-sm tw-font-medium tw-text-ink">Upload Image</span>
        <span class="tw-text-eyebrow tw-text-ink-faint">JPG, PNG, or WEBP · up to 5MB</span>
      </button>
    </div>

    <p v-if="errorMsg" class="tw-mt-2 tw-text-eyebrow tw-text-red-400" role="alert">
      {{ errorMsg }}
    </p>
  </div>
</template>
