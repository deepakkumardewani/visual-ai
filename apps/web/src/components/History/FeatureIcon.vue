<script setup lang="ts">
import {
  faExpand,
  faImages,
  faObjectUngroup,
  faPalette,
  faWandMagicSparkles,
} from '@/plugins/icons';

import { IImageObject } from '@/types';

const props = defineProps<{
  /** Image history item; media tiles pass `feature` instead. */
  item?: IImageObject;
  feature?: string;
}>();

const FEATURE_ICONS = {
  image: faImages,
  upscale: faExpand,
  colorize: faPalette,
  revive: faWandMagicSparkles,
  remove_bg: faObjectUngroup,
} as const;

/** Media features whose raw id reads badly as a label. */
const FEATURE_LABELS: Record<string, string> = {
  watermark_image: 'image watermark',
  watermark_video: 'video watermark',
};

const featureType = computed(() => props.feature ?? props.item?.featureType ?? '');
const icon = computed(() => FEATURE_ICONS[featureType.value as keyof typeof FEATURE_ICONS]);
const label = computed(() => FEATURE_LABELS[featureType.value] ?? featureType.value);
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
    {{ label }}
  </span>
</template>
<style scoped lang="scss"></style>
