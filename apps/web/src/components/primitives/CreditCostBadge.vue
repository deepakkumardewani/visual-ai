<script setup lang="ts">
defineProps<{
  cost: number;
}>();
</script>

<template>
  <span
    class="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-sm tw-bg-canvas/20 tw-px-2 tw-py-0.5 tw-text-eyebrow tw-font-bold tw-normal-case tw-tracking-normal"
    :aria-label="`${cost} credits`"
  >
    <font-awesome-icon icon="coins" class="tw-h-3 tw-w-3" aria-hidden="true" />
    {{ cost }}
  </span>
</template>
