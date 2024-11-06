<script setup lang="ts">
import { onMounted, ref } from 'vue'

const image = ref()

const uploadInput = ref<HTMLInputElement | null>(null)
const imagePreview = ref<HTMLElement | null>(null)

let isEventListenerAdded = false
const UPLOAD_TEXT = 'Click, or Drag image, here to upload'
const IMAGE_FORMAT_TEXT = 'JPG, PNG, or WEBP upto 5MB'
const isDragging = ref(false)

function handleDragLeave() {
  isDragging.value = false
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
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
    imagePreview!.value!.innerHTML = `<img src="${e.target?.result}" class="tw-max-h-48 tw-rounded-lg tw-mx-auto" alt="Image preview" />`
    // imagePreview!.value!.classList.remove('tw-border-dashed', 'tw-border-2', 'tw-border-gray-400')

    // Add event listener for image preview only once
    if (!isEventListenerAdded) {
      imagePreview.value?.addEventListener('click', () => {
        uploadInput.value?.click()
      })

      isEventListenerAdded = true
    }
  }
  reader.readAsDataURL(file)
}

function createImageReader() {
  uploadInput.value = document.getElementById('upload') as HTMLInputElement
  imagePreview.value = document.getElementById('image-preview') as HTMLElement

  uploadInput?.value?.addEventListener('change', (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (file) {
      handleFileUpload(file)
    } else {
      imagePreview.value!.innerHTML = `<div class="tw-bg-gray-200 tw-h-48 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-text-gray-500">No image preview</div>`
      imagePreview.value!.classList.add('tw-border-dashed', 'tw-border-2', 'tw-border-gray-400')

      // Remove the event listener when there's no image
      imagePreview.value?.removeEventListener('click', () => {
        uploadInput.value?.click()
      })

      isEventListenerAdded = false
    }
  })

  uploadInput.value?.addEventListener('click', (event) => {
    event.stopPropagation()
  })
}

onMounted(() => {
  createImageReader()
})

defineExpose({
  image
})
</script>
<template>
  <div class="tw-max-w-sm tw-mx-auto tw-rounded-lg tw-overflow-hidden tw-items-center">
    <div class="tw-py-1">
      <div
        id="image-preview"
        class="tw-max-w-sm tw-p-4 tw-mb-4 tw-rounded-lg tw-items-center tw-mx-auto tw-text-center tw-border-dashed tw-border-2 tw-border-gray-400"
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
          <v-icon class="tw-w-8 tw-h-8 tw-text-black dark:tw-text-white tw-mx-auto tw-mb-4"
            >fas fa-upload</v-icon
          >
          <h5
            class="tw-mb-2 tw-text-xl tw-font-bold tw-tracking-tight tw-text-black dark:tw-text-white"
          >
            {{ UPLOAD_TEXT }}
          </h5>
          <p class="tw-font-normal tw-text-sm tw-text-black dark:tw-text-white md:tw-px-6">
            {{ IMAGE_FORMAT_TEXT }}
          </p>
        </label>
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
