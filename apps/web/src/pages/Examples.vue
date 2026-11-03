<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

import { usePageSeo } from '@/composables/usePageSeo';
import { useAppStore } from '@/stores/app';

import LandingFooter from '@/components/Landing/LandingFooter.vue';
import SideBySide from '@/components/SideBySide.vue';

const appStore = useAppStore();
const { isDark } = storeToRefs(appStore);
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
    original: '/landing/upscale-1.769d2c02.webp',
    upscaled: '/landing/upscale-1.1.d76f06d3.webp',
  },
  {
    original: '/landing/upscale-2.a6eedddb.webp',
    upscaled: '/landing/upscale-2.2.e31a8791.webp',
  },
  {
    original: '/landing/upscale-3.e4b5dc76.webp',
    upscaled: '/landing/upscale-3.3.93ea4137.webp',
  },
  {
    original: '/landing/upscale-4.20a58e01.webp',
    upscaled: '/landing/upscale-4.4.c8dcd976.webp',
  },
  {
    original: '/landing/upscale-5.2e238568.webp',
    upscaled: '/landing/upscale-5.5.47525fe6.webp',
  },
];
const colorizeExamples = [
  {
    original: '/landing/colorize-1.144e6229.webp',
    colorized: '/landing/colorize-1.1.382dd645.webp',
  },
  {
    original: '/landing/colorize-2.bc3a2bd1.webp',
    colorized: '/landing/colorize-2.2.17d411f3.webp',
  },
  {
    original: '/landing/colorize-3.c7fc4ac1.webp',
    colorized: '/landing/colorize-3.3.fae5eb85.webp',
  },
  {
    original: '/landing/colorize-4.9a458295.webp',
    colorized: '/landing/colorize-4.4.496da185.webp',
  },
  {
    original: '/landing/colorize-5.703a3231.webp',
    colorized: '/landing/colorize-5.5.6ab9b64d.webp',
  },
];

const reviveExamples = [
  {
    original: '/landing/revive-1.001ae842.webp',
    revived: '/landing/revive-1.1.fe6b12b1.webp',
  },
  {
    original: '/landing/revive-2.6db90260.webp',
    revived: '/landing/revive-2.2.f2d26347.webp',
  },
  {
    original: '/landing/revive-3.008eb7fc.webp',
    revived: '/landing/revive-3.3.5bec0e6b.webp',
  },
  {
    original: '/landing/revive-4.5d76e8db.webp',
    revived: '/landing/revive-4.4.86f5e93c.webp',
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
