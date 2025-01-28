<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useDisplay } from 'vuetify'

import { IImage, IImageObject } from '@/types'

import { useAppStore } from '@/stores/app'

const { mobile } = useDisplay()
const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)

const props = defineProps<{
  selectedImages: Set<IImageObject>
}>()
const handleBulkDelete = () => {
  const publicIdsToDelete: string[] = []

  Array.from(props.selectedImages).forEach((image) => {
    if (image.featureType === 'image') {
      // For image type, only collect aiImagePublicId
      image.images.forEach((img: IImage) => {
        if (img.aiImagePublicId) {
          publicIdsToDelete.push(img.aiImagePublicId)
        }
      })
    } else {
      // For other types (enhance), collect both original and enhanced public IDs
      image.images.forEach((img: IImage) => {
        if (img.originalPublicId) {
          publicIdsToDelete.push(img.originalPublicId)
        }
        if (img.enhancedPublicId) {
          publicIdsToDelete.push(img.enhancedPublicId)
        }
      })
    }
  })

  console.log('Public IDs to delete:', publicIdsToDelete)
  // You can now use this array of publicIdsToDelete for your delete operation
}
</script>
<template>
  <div class="tw-flex tw-gap-2 tw-items-center">
    <v-btn
      :icon="mobile"
      :variant="mobile ? 'text' : 'tonal'"
      :size="mobile ? 'small' : 'default'"
      :color="isDark ? 'grey-darken-3' : 'grey-lighten-3'"
      class="tw-rounded-lg tw-p-0 tw-transition-all hover:tw-scale-105"
    >
      <v-icon class="tw-mr-0 sm:tw-mr-2" :color="isDark ? 'white' : 'black'"
        >fas fa-download</v-icon
      >
      <span v-if="!mobile" class="tw-text-sm" :class="isDark ? 'tw-text-white' : 'tw-text-black'"
        >Download</span
      >
    </v-btn>

    <v-btn
      :icon="mobile"
      :variant="mobile ? 'text' : 'tonal'"
      :size="mobile ? 'small' : 'default'"
      :color="isDark ? 'grey-darken-3' : 'grey-lighten-3'"
      class="tw-rounded-lg tw-transition-all hover:tw-scale-105"
    >
      <v-icon class="tw-mr-2" :color="isDark ? 'white' : 'black'">fas fa-heart</v-icon>
      <span v-if="!mobile" class="tw-text-sm" :class="isDark ? 'tw-text-white' : 'tw-text-black'"
        >Favorite</span
      >
    </v-btn>

    <v-btn
      :icon="mobile"
      :variant="mobile ? 'text' : 'tonal'"
      :size="mobile ? 'small' : 'default'"
      :color="isDark ? 'grey-darken-3' : 'grey-lighten-3'"
      class="tw-rounded-lg tw-transition-all hover:tw-scale-105"
      @click="handleBulkDelete"
    >
      <v-icon class="tw-mr-2" :color="isDark ? 'white' : 'black'">fas fa-trash-alt</v-icon>
      <span v-if="!mobile" class="tw-text-sm" :class="isDark ? 'tw-text-white' : 'tw-text-black'"
        >Delete</span
      >
    </v-btn>
  </div>
</template>
<style scoped lang="scss">
.v-btn {
  text-transform: none;
}
</style>
