<script setup lang="ts">
/**
 * Shared dropdown caret — always use this for expand/collapse triggers
 * (model picker, more sizes, future disclosure controls).
 */
import { useDashboardMotion } from '@/composables/useDashboardMotion';

withDefaults(
  defineProps<{
    /** When true, caret rotates 180° (open state). */
    open?: boolean;
    /**
     * Padded surface chip behind the icon (model picker style).
     * Set false for inline/text-row triggers that already have chrome.
     */
    boxed?: boolean;
  }>(),
  {
    open: false,
    boxed: true,
  },
);

const { chevronTransition } = useDashboardMotion();
</script>

<template>
  <span
    data-testid="chevron-caret"
    :class="[
      'tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-text-ink-muted',
      boxed ? 'tw-h-6 tw-w-6 tw-rounded-sm tw-bg-surface-3/70' : 'tw-h-4 tw-w-4',
      chevronTransition,
      open ? 'tw-rotate-180' : '',
    ]"
    aria-hidden="true"
  >
    <font-awesome-icon icon="chevron-down" class="tw-h-2.5 tw-w-2.5" />
  </span>
</template>
