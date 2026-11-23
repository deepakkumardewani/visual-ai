<script setup lang="ts">
import { computed } from 'vue';

import Stepper from '@/components/primitives/Stepper.vue';

const props = defineProps<{ min: number; max: number }>();
const durationSec = defineModel<number>({ required: true });

const SLIDER_ID = 'music-duration';
const valueText = computed(() => `${durationSec.value} seconds`);
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-2" data-testid="duration-control">
    <div class="tw-flex tw-items-baseline tw-justify-between tw-gap-3">
      <label :for="SLIDER_ID" class="tw-text-sm tw-font-semibold tw-text-ink-primary">
        Duration
      </label>
      <span class="tw-text-xs tw-text-ink-muted">Longer is the same price</span>
    </div>
    <div class="tw-flex tw-flex-wrap tw-items-center tw-gap-4">
      <input
        :id="SLIDER_ID"
        v-model.number="durationSec"
        type="range"
        class="slider"
        :min="props.min"
        :max="props.max"
        :aria-valuetext="valueText"
        data-testid="duration-slider"
      />
      <Stepper v-model="durationSec" :min="props.min" :max="props.max" label="Seconds" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.slider {
  flex: 1 1 10rem;
  min-height: 44px;
  accent-color: rgb(var(--studio-accent));

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }
}
</style>
