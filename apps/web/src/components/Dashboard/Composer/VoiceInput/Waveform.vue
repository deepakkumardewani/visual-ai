<script setup lang="ts">
import { computed } from 'vue';

import { useReducedMotion } from '@/composables/useReducedMotion';

const props = defineProps<{
  level: number;
  reactiveWaveform: boolean;
}>();

const prefersReducedMotion = useReducedMotion();

const bars = computed(() => {
  const count = 6;
  return Array.from({ length: count }, (_, index) => {
    const offset = (index - (count - 1) / 2) * 0.07;
    return Math.min(1, Math.max(0.12, props.level + offset));
  });
});
</script>

<template>
  <div
    data-testid="voice-waveform-pill"
    class="tw-flex tw-h-8 tw-items-center tw-gap-2 tw-self-center tw-rounded-full tw-bg-accent/10 tw-px-3"
    aria-hidden="true"
  >
    <div data-testid="voice-waveform" class="tw-flex tw-h-5 tw-items-end tw-gap-px">
      <template v-if="!prefersReducedMotion && reactiveWaveform">
        <span
          v-for="(height, index) in bars"
          :key="index"
          class="tw-w-0.5 tw-rounded-full tw-bg-accent tw-transition-[height] tw-duration-75 motion-reduce:tw-transition-none"
          :style="{ height: `${Math.round(height * 100)}%` }"
        />
      </template>
      <span
        v-else
        class="tw-h-2 tw-w-8 tw-rounded-full tw-bg-accent/70 motion-reduce:tw-transition-none"
        :style="{ opacity: 0.35 + level * 0.65 }"
      />
    </div>
    <slot />
  </div>
</template>
