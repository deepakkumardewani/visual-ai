<script setup lang="ts">
import { faExpand, faImages, faPalette, faWandMagicSparkles } from '@/plugins/icons';

import { IImageObject } from '@/types';

const props = defineProps<{
  item: IImageObject;
}>();

const FEATURE_ICONS = {
  image: faImages,
  upscale: faExpand,
  colorize: faPalette,
  revive: faWandMagicSparkles,
} as const;

const icon = computed(() => FEATURE_ICONS[props.item.featureType as keyof typeof FEATURE_ICONS]);
</script>
<template>
  <span
    class="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-bg-black/55 tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-capitalize tw-text-white/90 tw-backdrop-blur-sm"
  >
    <font-awesome-icon
      v-if="icon"
      :icon="icon"
      class="tw-h-3 tw-w-3 tw-opacity-80"
      aria-hidden="true"
    />
    {{ props.item.featureType }}
  </span>
</template>
<style scoped lang="scss"></style>
