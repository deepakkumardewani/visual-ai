<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'

import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const image = ref()
const width = ref(0)
const height = ref(0)

const uploadInput = ref<HTMLInputElement | null>(null)
const imagePreview = ref<HTMLElement | null>(null)

let isEventListenerAdded = false
const UPLOAD_TEXT = 'Click, or Drag image, here to upload'
const IMAGE_FORMAT_TEXT = 'JPG, PNG, or WEBP upto 5MB'
const isDragging = ref(false)
const { feature } = storeToRefs(appStore)
function handleDragLeave() {
  isDragging.value = false
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    handleFileUpload(file)
  }
}

function handleFileUpload(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    image.value = file
    const img = new Image()
    img.onload = () => {
      width.value = img.width
      height.value = img.height
    }
    img.src = e.target?.result as string
    if (imagePreview.value) {
      imagePreview.value.innerHTML = `<img src="${e.target?.result}" class="tw-max-h-48 tw-rounded-lg tw-mx-auto" alt="Image preview" />`
    }

    // Add event listener for image preview only once
    if (!isEventListenerAdded) {
      imagePreview.value?.addEventListener('click', () => {
        uploadInput.value?.click()
      })

      isEventListenerAdded = true
    }
  }
  try {
    reader.readAsDataURL(file)
  } catch (error) {
    console.error('Error starting file read:', error)
  }
}

function createImageReader() {
  uploadInput.value = document.getElementById('upload') as HTMLInputElement
  imagePreview.value = document.getElementById('image-preview') as HTMLElement

  uploadInput?.value?.addEventListener('change', (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (file) {
      handleFileUpload(file)
    }
  })

  uploadInput.value?.addEventListener('click', (event) => {
    event.stopPropagation()
  })
}

onMounted(() => {
  createImageReader()
})

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 KB'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const fileSize = computed(() => {
  return image.value ? formatFileSize(image.value.size) : ''
})

defineExpose({
  image,
  width,
  height
})
</script>
<template>
  <div class="tw-max-w-sm tw-mx-auto tw-rounded-lg tw-overflow-hidden tw-items-center">
    <div class="tw-py-1">
      <div
        id="image-preview"
        class="tw-max-w-sm tw-p-4 tw-mb-2 tw-rounded-lg tw-items-center tw-mx-auto tw-text-center tw-border-dashed tw-border-2 tw-border-gray-400"
        :class="{ 'tw-border-purple-500 tw-rounded-lg animate-border': isDragging }"
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
        <label
          for="upload"
          class="tw-cursor-pointer tw-p-4 tw-rounded-lg tw-block tw-transition-all tw-duration-300"
        >
          <v-icon
            class="tw-w-8 tw-h-8 tw-mx-auto tw-mb-4 tw-text-neutral-600 dark:tw-text-neutral-300"
            >fas fa-upload</v-icon
          >
          <h5
            class="tw-mb-2 tw-text-xl tw-font-bold tw-tracking-tight tw-text-neutral-600 dark:tw-text-neutral-300"
          >
            {{ UPLOAD_TEXT }}
          </h5>
          <p
            class="tw-font-normal tw-text-sm md:tw-px-6 tw-text-neutral-600 dark:tw-text-neutral-300"
          >
            {{ IMAGE_FORMAT_TEXT }}
          </p>
        </label>
      </div>
      <!-- Add image information row -->
      <div
        v-if="image && feature === 'upscale'"
        class="tw-flex tw-justify-between tw-mt-2 tw-text-sm tw-text-neutral-600 dark:tw-text-neutral-300 tw-px-2"
      >
        <div>
          <v-icon icon="fas fa-file-image" size="x-small" class="tw-mr-1" />
          {{ fileSize }}
        </div>
        <div>
          <v-icon icon="fas fa-expand" size="x-small" class="tw-mr-1" />
          {{ width }} x {{ height }}px
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
    border-image-source: linear-gradient(to right, #9333ea, #7e22ce, #6b21a8, #581c87);
  }
  25% {
    border-image-source: linear-gradient(to bottom, #9333ea, #7e22ce, #6b21a8, #581c87);
  }
  50% {
    border-image-source: linear-gradient(to left, #9333ea, #7e22ce, #6b21a8, #581c87);
  }
  75% {
    border-image-source: linear-gradient(to top, #9333ea, #7e22ce, #6b21a8, #581c87);
  }
  100% {
    border-image-source: linear-gradient(to right, #9333ea, #7e22ce, #6b21a8, #581c87);
  }
}
</style>
