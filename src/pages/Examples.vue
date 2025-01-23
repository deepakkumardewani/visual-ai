<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

import { useAppStore } from '@/stores/app'

import SideBySide from '@/components/SideBySide.vue'

const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)
const baseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL
const tab = ref(1)

const upscaleExamples = [
  {
    original: `${baseUrl}/examples/upscale/upscale-1.jpg`,
    upscaled: `${baseUrl}/examples/upscale/upscale-1.1.png`
  },
  {
    original: `${baseUrl}/examples/upscale/upscale-2.webp`,
    upscaled: `${baseUrl}/examples/upscale/upscale-2.2.png`
  },
  {
    original: `${baseUrl}/examples/upscale/upscale-3.jpg`,
    upscaled: `${baseUrl}/examples/upscale/upscale-3.3.png`
  },
  {
    original: `${baseUrl}/examples/upscale/upscale-4.jpg`,
    upscaled: `${baseUrl}/examples/upscale/upscale-4.4.png`
  },
  {
    original: `${baseUrl}/examples/upscale/upscale-5.jpg`,
    upscaled: `${baseUrl}/examples/upscale/upscale-5.5.png`
  }
]
const colorizeExamples = [
  {
    original: `${baseUrl}/examples/colorize/colorize-1.webp`,
    colorized: `${baseUrl}/examples/colorize/colorize-1.1.png`
  },
  {
    original: `${baseUrl}/examples/colorize/colorize-2.webp`,
    colorized: `${baseUrl}/examples/colorize/colorize-2.2.png`
  },
  {
    original: `${baseUrl}/examples/colorize/colorize-3.webp`,
    colorized: `${baseUrl}/examples/colorize/colorize-3.3.png`
  },
  {
    original: `${baseUrl}/examples/colorize/colorize-4.webp`,
    colorized: `${baseUrl}/examples/colorize/colorize-4.4.png`
  },
  {
    original: `${baseUrl}/examples/colorize/colorize-5.jpg`,
    colorized: `${baseUrl}/examples/colorize/colorize-5.5.png`
  }
]

const reviveExamples = [
  {
    original: `${baseUrl}/examples/revive/revive-1.png`,
    revived: `${baseUrl}/examples/revive/revive-1.1.png`
  },
  {
    original: `${baseUrl}/examples/revive/revive-2.jpg`,
    revived: `${baseUrl}/examples/revive/revive-2.2.png`
  },
  {
    original: `${baseUrl}/examples/revive/revive-3.png`,
    revived: `${baseUrl}/examples/revive/revive-3.3.png`
  },
  {
    original: `${baseUrl}/examples/revive/revive-4.png`,
    revived: `${baseUrl}/examples/revive/revive-4.4.png`
  }
]
</script>
<template>
  <v-tabs
    v-model="tab"
    align-tabs="center"
    color="deep-purple-accent-4"
    :class="isDark ? 'tw-bg-black' : 'tw-bg-white'"
  >
    <v-tab :value="1">Upscale</v-tab>
    <v-tab :value="2">Colorize</v-tab>
    <v-tab :value="3">Revive</v-tab>
  </v-tabs>

  <v-tabs-window
    v-model="tab"
    class="tw-h-[calc(100vh-60px)] tw-overflow-y-auto"
    :class="isDark ? 'tw-bg-black' : 'tw-bg-white'"
  >
    <v-tabs-window-item :value="1">
      <v-container fluid class="tw-max-w-5xl tw-mx-auto tw-py-12">
        <div class="tw-flex tw-flex-col tw-items-center tw-gap-16">
          <div
            v-for="(example, index) in upscaleExamples"
            :key="index"
            class="tw-w-full tw-max-w-4xl tw-rounded-lg tw-overflow-hidden"
          >
            <SideBySide :original-image="example.original" :enhanced-image="example.upscaled" />
          </div>
        </div>
      </v-container>
    </v-tabs-window-item>

    <v-tabs-window-item :value="2">
      <v-container fluid class="tw-max-w-5xl tw-mx-auto tw-py-12">
        <div class="tw-flex tw-flex-col tw-items-center tw-gap-16">
          <div
            v-for="(example, index) in colorizeExamples"
            :key="index"
            class="tw-w-full tw-max-w-4xl"
          >
            <SideBySide :original-image="example.original" :enhanced-image="example.colorized" />
          </div>
        </div>
      </v-container>
    </v-tabs-window-item>

    <v-tabs-window-item :value="3">
      <v-container class="tw-max-w-5xl tw-mx-auto tw-py-12">
        <div class="tw-flex tw-flex-col tw-items-center tw-gap-16">
          <div
            v-for="(example, index) in reviveExamples"
            :key="index"
            class="tw-w-full tw-max-w-4xl tw-flex tw-items-center tw-justify-center"
          >
            <SideBySide :original-image="example.original" :enhanced-image="example.revived" />
          </div>
        </div>
      </v-container>
    </v-tabs-window-item>
  </v-tabs-window>
</template>
<style scoped lang="scss"></style>
