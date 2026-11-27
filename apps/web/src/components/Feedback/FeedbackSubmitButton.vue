<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'button' | 'submit';
    disabled?: boolean;
    loading?: boolean;
    loadingLabel?: string;
  }>(),
  { type: 'submit', disabled: false, loading: false, loadingLabel: 'Sending…' },
);
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading"
    class="tw-inline-flex tw-min-h-[44px] tw-w-full tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-gradient-gold tw-px-5 tw-text-sm tw-font-semibold tw-text-neutral-900 tw-transition-[transform,opacity,filter] tw-duration-fast hover:tw-brightness-110 active:tw-scale-[0.98] disabled:tw-cursor-not-allowed disabled:tw-opacity-45 disabled:hover:tw-brightness-100 disabled:active:tw-scale-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-gold motion-reduce:tw-transition-none motion-reduce:active:tw-scale-100"
  >
    <slot v-if="!loading" />
    <template v-else>{{ loadingLabel }}</template>
  </button>
</template>
