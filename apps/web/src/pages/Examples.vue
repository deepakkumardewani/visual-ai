<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

import { usePageSeo } from '@/composables/usePageSeo';
import { useAppStore } from '@/stores/app';

import LandingFooter from '@/components/Landing/LandingFooter.vue';
import SideBySide from '@/components/SideBySide.vue';

const appStore = useAppStore();
const { isDark } = storeToRefs(appStore);
const baseUrl = import.meta.env.VITE_CLOUDINARY_BASE_URL;
const tab = ref(1);

const tabOptions = [
  { label: 'Upscale', value: 1 },
  { label: 'Colorize', value: 2 },
  { label: 'Revive', value: 3 },
] as const;

usePageSeo({
  title: 'Before and after examples – Visual AI',
  description:
    'See Visual AI upscale, colorize, and restore results side by side. Compare originals with enhanced photos, then try the same tools with credits.',
  path: '/examples',
});

const upscaleExamples = [
  {
    original: `${baseUrl}/examples/upscale/upscale-1.jpg`,
    upscaled: `${baseUrl}/examples/upscale/upscale-1.1.png`,
  },
  {
    original: `${baseUrl}/examples/upscale/upscale-2.webp`,
    upscaled: `${baseUrl}/examples/upscale/upscale-2.2.png`,
  },
  {
    original: `${baseUrl}/examples/upscale/upscale-3.jpg`,
    upscaled: `${baseUrl}/examples/upscale/upscale-3.3.png`,
  },
  {
    original: `${baseUrl}/examples/upscale/upscale-4.jpg`,
    upscaled: `${baseUrl}/examples/upscale/upscale-4.4.png`,
  },
  {
    original: `${baseUrl}/examples/upscale/upscale-5.jpg`,
    upscaled: `${baseUrl}/examples/upscale/upscale-5.5.png`,
  },
];
const colorizeExamples = [
  {
    original: `${baseUrl}/examples/colorize/colorize-1.webp`,
    colorized: `${baseUrl}/examples/colorize/colorize-1.1.png`,
  },
  {
    original: `${baseUrl}/examples/colorize/colorize-2.webp`,
    colorized: `${baseUrl}/examples/colorize/colorize-2.2.png`,
  },
  {
    original: `${baseUrl}/examples/colorize/colorize-3.webp`,
    colorized: `${baseUrl}/examples/colorize/colorize-3.3.png`,
  },
  {
    original: `${baseUrl}/examples/colorize/colorize-4.webp`,
    colorized: `${baseUrl}/examples/colorize/colorize-4.4.png`,
  },
  {
    original: `${baseUrl}/examples/colorize/colorize-5.jpg`,
    colorized: `${baseUrl}/examples/colorize/colorize-5.5.png`,
  },
];

const reviveExamples = [
  {
    original: `${baseUrl}/examples/revive/revive-1.png`,
    revived: `${baseUrl}/examples/revive/revive-1.1.png`,
  },
  {
    original: `${baseUrl}/examples/revive/revive-2.jpg`,
    revived: `${baseUrl}/examples/revive/revive-2.2.png`,
  },
  {
    original: `${baseUrl}/examples/revive/revive-3.png`,
    revived: `${baseUrl}/examples/revive/revive-3.3.png`,
  },
  {
    original: `${baseUrl}/examples/revive/revive-4.png`,
    revived: `${baseUrl}/examples/revive/revive-4.4.png`,
  },
];
</script>

<template>
  <div :class="isDark ? 'tw-bg-black' : 'tw-bg-white'">
    <h1 class="tw-px-4 tw-pt-6 tw-text-center tw-font-display tw-text-3xl tw-font-bold tw-text-ink">
      Before and after examples
    </h1>
    <nav
      class="tw-flex tw-flex-wrap tw-justify-center tw-gap-x-4 tw-gap-y-2 tw-px-4 tw-pb-2 tw-text-sm"
      aria-label="Feature landings"
    >
      <router-link class="tw-text-[#C9A84C] tw-underline" to="/image-upscaler"
        >Image upscaler</router-link
      >
      <router-link class="tw-text-[#C9A84C] tw-underline" to="/colorize-photo"
        >Colorize photo</router-link
      >
      <router-link class="tw-text-[#C9A84C] tw-underline" to="/photo-restorer"
        >Photo restorer</router-link
      >
      <router-link class="tw-text-[#C9A84C] tw-underline" to="/text-to-image"
        >Text to image</router-link
      >
    </nav>
    <div class="tw-flex tw-w-full tw-justify-center" role="tablist" aria-label="Example categories">
      <button
        v-for="option in tabOptions"
        :key="option.value"
        type="button"
        role="tab"
        class="tw-border-x-0 tw-border-t-0 tw-border-b-2 tw-bg-transparent tw-px-6 tw-py-3 tw-font-body tw-text-sm"
        :class="
          tab === option.value
            ? 'tw-border-[#C9A84C] tw-text-[#C9A84C]'
            : 'tw-border-transparent tw-text-ink-muted'
        "
        :aria-selected="tab === option.value"
        @click="tab = option.value"
      >
        {{ option.label }}
      </button>
    </div>

    <div class="tw-h-[calc(100vh-60px)] tw-overflow-y-auto">
      <div v-if="tab === 1" class="tw-mx-auto tw-max-w-5xl tw-px-4 tw-py-12">
        <div class="tw-flex tw-flex-col tw-items-center tw-gap-16">
          <div
            v-for="(example, index) in upscaleExamples"
            :key="index"
            class="tw-w-full tw-max-w-4xl tw-overflow-hidden tw-rounded-lg"
          >
            <SideBySide :original-image="example.original" :enhanced-image="example.upscaled" />
          </div>
        </div>
      </div>

      <div v-else-if="tab === 2" class="tw-mx-auto tw-max-w-5xl tw-px-4 tw-py-12">
        <div class="tw-flex tw-flex-col tw-items-center tw-gap-16">
          <div
            v-for="(example, index) in colorizeExamples"
            :key="index"
            class="tw-w-full tw-max-w-4xl"
          >
            <SideBySide :original-image="example.original" :enhanced-image="example.colorized" />
          </div>
        </div>
      </div>

      <div v-else class="tw-mx-auto tw-max-w-5xl tw-px-4 tw-py-12">
        <div class="tw-flex tw-flex-col tw-items-center tw-gap-16">
          <div
            v-for="(example, index) in reviveExamples"
            :key="index"
            class="tw-flex tw-w-full tw-max-w-4xl tw-items-center tw-justify-center"
          >
            <SideBySide :original-image="example.original" :enhanced-image="example.revived" />
          </div>
        </div>
      </div>
    </div>
  </div>
  <LandingFooter />
</template>
