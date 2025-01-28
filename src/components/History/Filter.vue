<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'

import { useHistoryStore } from '@/stores/history'

import { IMAGE_SIZE_OPTIONS } from '@/utils/constants'

const { mobile } = useDisplay()
const { selectedSize } = storeToRefs(useHistoryStore())
const searchQuery = ref('')

const imageSizes = computed(() => {
  return IMAGE_SIZE_OPTIONS.filter((size) => {
    if (mobile.value && (size.value === 'mini' || size.value === 'small')) {
      return false
    }
    return true
  })
})
const selectedFeatureType = ref<string[]>([])
const featureTypes = ref<any[]>([
  {
    id: 'image',
    title: 'Text-to-Image'
  },
  {
    id: 'upscale',
    title: 'Upscale'
  },
  {
    id: 'colorize',
    title: 'Colorize'
  },
  {
    id: 'revive',
    title: 'Revive'
  }
])
</script>
<template>
  <div class="tw-flex tw-gap-4 tw-w-full sm:tw-w-[30vw] tw-mb-2 sm:tw-mb-0 sm:tw-mr-4">
    <v-select
      class="tw-flex-1"
      v-model="selectedSize"
      :items="imageSizes"
      label="Image size"
      density="compact"
      variant="outlined"
      hide-details
      item-title="title"
      item-value="value"
    ></v-select>

    <v-select
      class="tw-flex-1"
      v-model="selectedFeatureType"
      :items="featureTypes"
      label="Filter by feature"
      density="compact"
      variant="outlined"
      hide-details
      item-title="title"
      item-value="id"
      multiple
      chips
      closable-chips
    ></v-select>
  </div>

  <v-text-field
    v-model="searchQuery"
    label="Search by prompt"
    density="compact"
    variant="outlined"
    class="tw-w-full md:tw-w-auto md:tw-max-w-[200px]"
    hide-details
  >
    <template v-slot:prepend-inner>
      <v-icon class="tw-mr-1" size="x-small" icon="fas fa-search" />
    </template>
    <template v-slot:append-inner>
      <v-btn icon size="x-small" variant="text" v-if="searchQuery" @click="searchQuery = ''">
        <v-icon icon="fas fa-xmark" />
      </v-btn>
    </template>
  </v-text-field>
</template>
<style scoped lang="scss"></style>
