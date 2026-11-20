<script setup lang="ts">
import { faCheck, faChevronLeft, faChevronRight, faXmark } from '@/plugins/icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { computed } from 'vue';

const props = defineProps<{
  /** 1-based position of the current step. */
  step: number;
  total: number;
  title: string;
  description: string;
}>();

defineEmits<{ prev: []; next: []; skip: []; close: [] }>();

const isFirst = computed(() => props.step === 1);
const isLast = computed(() => props.step === props.total);
const progressPercent = computed(() => (props.step / props.total) * 100);

const ICON_BUTTON_CLASS =
  'tour-popover__icon-button tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-border tw-bg-surface-2 tw-text-ink-primary hover:enabled:tw-bg-surface-3 disabled:tw-cursor-not-allowed disabled:tw-opacity-40';
</script>

<template>
  <div class="tw-flex tw-w-[18rem] tw-max-w-full tw-flex-col tw-gap-3" data-testid="tour-popover">
    <div class="tw-flex tw-items-center tw-justify-between tw-gap-2">
      <span
        class="tw-text-caption tw-font-semibold tw-tabular-nums tw-text-ink-muted"
        data-testid="tour-step-counter"
        >{{ step }} / {{ total }}</span
      >
      <button
        type="button"
        aria-label="Close tour"
        data-testid="tour-close"
        :class="ICON_BUTTON_CLASS"
        @click="$emit('close')"
      >
        <FontAwesomeIcon :icon="faXmark" aria-hidden="true" />
      </button>
    </div>

    <div
      role="progressbar"
      aria-label="Tour progress"
      :aria-valuenow="step"
      aria-valuemin="1"
      :aria-valuemax="total"
      class="tw-h-1 tw-w-full tw-overflow-hidden tw-rounded-full tw-bg-surface-3"
      data-testid="tour-progress"
    >
      <div
        class="tw-h-full tw-rounded-full tw-bg-accent"
        :style="{ width: `${progressPercent}%` }"
      />
    </div>

    <div class="tw-flex tw-flex-col tw-gap-1">
      <p class="tw-m-0 tw-text-base tw-font-semibold tw-text-ink-primary">{{ title }}</p>
      <p class="tw-m-0 tw-text-body-sm tw-text-ink-muted">{{ description }}</p>
    </div>

    <div class="tw-flex tw-items-center tw-justify-between">
      <button
        type="button"
        data-testid="tour-skip"
        class="tw-min-h-9 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2 tw-text-body-sm tw-text-ink-muted hover:tw-text-ink"
        @click="$emit('skip')"
      >
        Skip
      </button>
      <div class="tw-flex tw-gap-2">
        <button
          type="button"
          aria-label="Previous step"
          data-testid="tour-prev"
          :disabled="isFirst"
          :class="ICON_BUTTON_CLASS"
          @click="$emit('prev')"
        >
          <FontAwesomeIcon :icon="faChevronLeft" aria-hidden="true" />
        </button>
        <button
          type="button"
          :aria-label="isLast ? 'Finish tour' : 'Next step'"
          data-testid="tour-next"
          :class="ICON_BUTTON_CLASS"
          @click="$emit('next')"
        >
          <FontAwesomeIcon :icon="isLast ? faCheck : faChevronRight" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>

<style>
/* Unscoped: driver.js renders the popover shell outside the Vue tree. */
.driver-popover.tour-popover {
  padding: 1rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 12px;
  background: rgb(var(--tw-surface-1));
  color: rgb(var(--tw-ink-primary));
  font-family: inherit;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
}

.driver-popover.tour-popover .driver-popover-arrow {
  display: none;
}

.tour-popover__icon-button:focus-visible,
.driver-popover.tour-popover button:focus-visible {
  outline: 2px solid #c98a5a;
  outline-offset: 2px;
}
</style>
