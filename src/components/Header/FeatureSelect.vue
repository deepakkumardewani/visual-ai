<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import { useAppStore } from '@/stores/app'

const route = useRoute()
const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)

type Feature = {
  id: string
  title: string
  icon: string
}
const features = ref<Feature[]>([
  {
    id: 'ai_image',
    title: 'AI Image Generator',
    icon: '$imageFrame'
  },
  {
    id: 'image_upscaler',
    title: 'Image Upscaler',
    icon: '$expand'
  },
  {
    id: 'colorize_image',
    title: 'Colorize Image',
    icon: '$dropper'
  },
  {
    id: 'revive_old_photos',
    title: 'Revive Old Photos',
    icon: '$camera'
  }
])

const feature = ref<Feature>(features.value[1])

function handleSelected(item: Feature) {
  appStore.setFeature(item.id)
}

onMounted(() => {
  appStore.setFeature(feature.value.id)
})
</script>
<template>
  <v-select
    v-if="route.path === '/dashboard'"
    @update:model-value="handleSelected"
    :items="features"
    v-model="feature"
    max-width="250"
    bg-color="transparent"
    color="purple-lighten-3"
    variant="outlined"
    density="compact"
    hide-details
    item-title="title"
    item-value="title"
    return-object
  >
    <template v-slot:item="{ item, props }">
      <v-list-item :prepend-icon="isDark ? `${item.raw.icon}Dark` : item.raw.icon" v-bind="props">
      </v-list-item>
    </template>
  </v-select>
</template>

<style scoped></style>
