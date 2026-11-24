<script setup lang="ts">
import {
  getModelDefinition,
  getVideoModelOptions,
  VIDEO_STUDIO_MODEL_KEYS,
  type VideoStudioModelKey,
} from '@visual-ai/shared';
import { computed } from 'vue';

import SegmentedControl from '@/components/primitives/SegmentedControl.vue';
import Stepper from '@/components/primitives/Stepper.vue';

import type { SegmentedOption } from '@/types/primitives';

const props = defineProps<{
  /** True while an attached audio file sets the length, so the slider has nothing to change. */
  audioDriven: boolean;
}>();

const modelKey = defineModel<VideoStudioModelKey>('modelKey', { required: true });
const durationSec = defineModel<number>('durationSec', { required: true });
const resolution = defineModel<string>('resolution', { required: true });

const SLIDER_ID = 'video-duration';

const MODEL_OPTIONS: SegmentedOption<VideoStudioModelKey>[] = VIDEO_STUDIO_MODEL_KEYS.map(
  (key) => ({
    label: getModelDefinition(key).label,
    value: key,
  }),
);

const options = computed(() => getVideoModelOptions(modelKey.value));
const resolutionOptions = computed<SegmentedOption<string>[]>(() =>
  (options.value?.resolutions ?? []).map((value) => ({ label: value, value })),
);
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-5" data-testid="video-settings">
    <SegmentedControl v-model="modelKey" :options="MODEL_OPTIONS" label="Model" />

    <div v-if="options" class="tw-flex tw-flex-col tw-gap-2" data-testid="video-duration">
      <div class="tw-flex tw-items-baseline tw-justify-between tw-gap-3">
        <label :for="SLIDER_ID" class="tw-text-sm tw-font-semibold tw-text-ink-primary">
          Duration
        </label>
        <span class="tw-text-xs tw-text-ink-muted">
          {{
            props.audioDriven
              ? 'Set by your audio'
              : `${options.durationSec.min} to ${options.durationSec.max} seconds`
          }}
        </span>
      </div>
      <div class="tw-flex tw-flex-wrap tw-items-center tw-gap-4">
        <input
          :id="SLIDER_ID"
          v-model.number="durationSec"
          type="range"
          class="slider"
          :min="options.durationSec.min"
          :max="options.durationSec.max"
          :disabled="props.audioDriven"
          :aria-valuetext="`${durationSec} seconds`"
          data-testid="video-duration-slider"
        />
        <Stepper
          v-model="durationSec"
          :min="options.durationSec.min"
          :max="options.durationSec.max"
          label="Seconds"
        />
      </div>
    </div>

    <SegmentedControl v-model="resolution" :options="resolutionOptions" label="Resolution" />
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
