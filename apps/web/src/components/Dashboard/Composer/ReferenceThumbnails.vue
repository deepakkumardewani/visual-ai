<script setup lang="ts">
import { useDashboardMotion } from '@/composables/useDashboardMotion';
import type { ReferenceImage } from '@/stores/aside';

defineProps<{
  images: ReferenceImage[];
}>();

const emit = defineEmits<{
  remove: [index: number];
}>();

const { interactiveTransition } = useDashboardMotion();
</script>

<template>
  <div
    v-if="images.length"
    data-testid="reference-image-thumbnails"
    class="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-1.5"
  >
    <div
      v-for="(item, index) in images"
      :key="item.localId"
      :data-testid="index === 0 ? 'reference-image-preview' : 'reference-image-thumbnail'"
      class="tw-group tw-relative tw-h-10 tw-w-10 tw-shrink-0 tw-overflow-hidden tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2"
    >
      <img
        :src="item.previewUrl"
        :alt="`Reference: ${item.name}`"
        class="tw-h-full tw-w-full tw-object-cover"
      />
      <button
        type="button"
        data-testid="reference-image-remove"
        :class="[
          'tw-absolute tw-right-0.5 tw-top-0.5 tw-inline-flex tw-h-4 tw-w-4 tw-items-center tw-justify-center tw-rounded-full tw-bg-canvas/90 tw-text-ink tw-opacity-0 group-hover:tw-opacity-100 focus-visible:tw-opacity-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent',
          interactiveTransition,
        ]"
        :aria-label="`Remove reference image ${item.name}`"
        @click="emit('remove', index)"
      >
        <font-awesome-icon icon="xmark" class="tw-h-2.5 tw-w-2.5" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
