<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { IImageObject } from '@/types'
import { IImage } from '@/types'

import { useAppStore } from '@/stores/app'
import { useGenerateStore } from '@/stores/generate'

import { deleteImage, downloadImage, favoriteImage } from '@/utils/helpers'

const props = defineProps<{
  item: IImageObject
}>()
const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)
const generateStore = useGenerateStore()
const { deletingImageIds } = storeToRefs(generateStore)

const downloadImageUrl = (image: IImage) => {
  const publicId = image.aiImagePublicId ? image.aiImagePublicId : image.enhancedPublicId
  const format = image.format
  const cloudinaryBaseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL
  // const optimizedUrl = `${cloudinaryBaseUrl}/q_auto,f_auto/${publicId}.${format}`
  return `${cloudinaryBaseUrl}/${publicId}.${format}`
}
</script>
<template>
  <v-btn
    icon
    size="x-small"
    :color="isDark ? 'black' : 'white'"
    @click="downloadImage($event, downloadImageUrl(props.item.images[0]))"
  >
    <v-icon :color="isDark ? 'white' : 'black'">fas fa-download</v-icon>
  </v-btn>
  <v-btn
    icon
    size="x-small"
    :color="isDark ? 'black' : 'white'"
    @click="favoriteImage($event, props.item._id)"
  >
    <v-icon :color="isDark ? 'white' : 'black'">{{
      props.item.isFavorite ? 'fas fa-heart' : 'far fa-heart'
    }}</v-icon>
  </v-btn>
  <v-btn
    icon
    :loading="deletingImageIds.includes(props.item._id)"
    size="x-small"
    :color="isDark ? 'black' : 'white'"
    @click="deleteImage($event, props.item)"
  >
    <v-icon :color="isDark ? 'white' : 'black'">fas fa-trash-alt</v-icon>
  </v-btn>
</template>
<style scoped lang="scss"></style>
