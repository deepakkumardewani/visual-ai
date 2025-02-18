<script setup lang="ts">
import { faGear } from '@/plugins/icons'
import { ref } from 'vue'

import AspectRatio from '@/components/Aside/AspectRatio.vue'
import ImageFormat from '@/components/Aside/ImageFormat.vue'
import ImageVariation from '@/components/Aside/ImageVariation.vue'
import OutputQuality from '@/components/Aside/OutputQuality.vue'

const menu = ref(false)
</script>
<template>
  <v-menu
    v-model="menu"
    content-class="custom-menu"
    :close-on-content-click="false"
    location="bottom"
    offset="10"
  >
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props" class="pa-2 ml-4" variant="tonal" size="sm">
        <font-awesome-icon :icon="faGear" />
      </v-btn>
    </template>

    <v-card min-width="400" class="pa-4">
      <div class="mb-6">
        <div class="tw-flex tw-shrink-0 tw-gap-4 tw-justify-between">
          <div class="tw-flex-1">
            <AspectRatio />
          </div>
          <div class="tw-flex-1">
            <ImageFormat />
          </div>
        </div>
      </div>
      <div class="mb-6">
        <div class="tw-flex tw-shrink-0 tw-gap-4 tw-justify-between">
          <div class="tw-w-1/2">
            <OutputQuality />
          </div>
          <div class="tw-w-1/2">
            <ImageVariation />
          </div>
        </div>
      </div>
    </v-card>
  </v-menu>
</template>
