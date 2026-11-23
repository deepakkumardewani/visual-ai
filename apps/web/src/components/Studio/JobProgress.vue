<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

import type { MediaJobStage } from '@visual-ai/shared';

import TimeCode from '@/components/Audio/TimeCode.vue';

import { STAGE_COPY } from '@/composables/useMediaJob';

const TICK_MS = 1000;
const MS_PER_SECOND = 1000;

const props = defineProps<{
  stage: MediaJobStage;
  /** Server-reported elapsed time; the display keeps counting between reports. */
  elapsedMs: number;
}>();

const reportedAt = ref(Date.now());
const now = ref(reportedAt.value);

watch(
  () => props.elapsedMs,
  () => {
    reportedAt.value = Date.now();
    now.value = reportedAt.value;
  },
);
useIntervalFn(() => {
  now.value = Date.now();
}, TICK_MS);

const elapsedSec = computed(() => (props.elapsedMs + now.value - reportedAt.value) / MS_PER_SECOND);
</script>

<template>
  <section
    data-testid="job-progress"
    class="tw-flex tw-flex-col tw-gap-3 tw-rounded-card tw-border tw-border-border tw-bg-surface-1 tw-p-4"
  >
    <div class="tw-flex tw-items-baseline tw-justify-between tw-gap-3">
      <!-- Only the stage is announced; the clock would read out every second. -->
      <p
        role="status"
        data-testid="job-progress-stage"
        class="tw-m-0 tw-text-sm tw-font-semibold tw-text-ink-primary"
      >
        {{ STAGE_COPY[stage] }}
      </p>
      <span class="tw-text-sm tw-text-ink-muted" aria-hidden="true">
        <TimeCode :seconds="elapsedSec" />
      </span>
    </div>
    <div class="job-progress__track" aria-hidden="true">
      <div class="job-progress__shimmer" />
    </div>
    <p class="tw-m-0 tw-text-xs tw-text-ink-muted">
      You can leave this page; it will appear in History.
    </p>
  </section>
</template>

<style scoped lang="scss">
.job-progress__track {
  height: 4px;
  overflow: hidden;
  border-radius: 9999px;
  background: rgb(var(--tw-surface-3));
}

.job-progress__shimmer {
  height: 100%;
  width: 40%;
  border-radius: inherit;
  background: rgb(var(--studio-accent, var(--tw-ink-muted)));
  animation: job-progress-slide 1.6s ease-in-out infinite;
}

@keyframes job-progress-slide {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(250%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .job-progress__shimmer {
    width: 100%;
    animation: none;
    opacity: 0.5;
  }
}
</style>
