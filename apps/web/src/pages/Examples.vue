<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

import { useAppStore } from '@/stores/app';

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
</template>
