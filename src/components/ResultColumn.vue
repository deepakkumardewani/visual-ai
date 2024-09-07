<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useGenerateStore } from '@/stores/generate'

const generateStore = useGenerateStore()
const { isLoading, image } = storeToRefs(generateStore)

// download image to local storage
function downloadImage() {
  const link = document.createElement('a')
  link.href = image.value
  link.download = 'image.jpg'
  link.click()
}
</script>
<template>
  <div
    class="image rounded-lg align-center justify-center"
    :class="{ 'tw-h-full border-thin': image === '' }"
  >
    <v-skeleton-loader v-if="isLoading" type="image"></v-skeleton-loader>
    <div v-else>
      <v-hover>
        <template v-slot:default="{ isHovering, props }">
          <div v-bind="props" class="image-container">
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
</style>
