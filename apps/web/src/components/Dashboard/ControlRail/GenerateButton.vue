<script setup lang="ts">
import { useDashboardMotion } from '@/composables/useDashboardMotion';

defineProps<{
  disabled: boolean;
  loading?: boolean;
  premium?: boolean;
}>();

const emit = defineEmits<{
  click: [];
}>();

const { pressable } = useDashboardMotion();
</script>

<template>
  <button
    type="button"
    data-testid="generate-button"
    @click="emit('click')"
    :class="[
      'tw-flex tw-min-h-[44px] tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-chip tw-px-4 tw-py-3 tw-text-body-base tw-font-semibold tw-transition-opacity tw-duration-fast hover:tw-opacity-95 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[3px] disabled:tw-cursor-not-allowed disabled:tw-opacity-40 disabled:tw-shadow-none motion-reduce:tw-transition-none',
      pressable,
      premium
        ? 'tw-bg-gradient-gold tw-text-canvas tw-shadow-gold-glow focus-visible:tw-outline-gold'
        : 'tw-bg-accent tw-text-canvas tw-shadow-accent focus-visible:tw-outline-accent hover:tw-bg-accent-hover',
    ]"
    :data-premium-cue="premium ? 'true' : undefined"
    :disabled="disabled"
    :aria-busy="loading"
  >
    <span
      v-if="loading"
      data-testid="generate-button-spinner"
      class="tw-inline-block tw-h-4 tw-w-4 tw-animate-spin tw-rounded-full tw-border-2 tw-border-canvas/30 tw-border-t-canvas motion-reduce:tw-animate-none"
      aria-hidden="true"
    />
    <span>{{ loading ? 'Generating…' : 'Generate' }}</span>
  </button>
</template>
