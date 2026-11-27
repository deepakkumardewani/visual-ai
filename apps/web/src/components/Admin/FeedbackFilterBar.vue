<script setup lang="ts">
import { FEEDBACK_STATUSES, FEEDBACK_TYPES } from '@visual-ai/shared';

import FeedbackSelect from '@/components/Admin/FeedbackSelect.vue';

import type { AdminFeedbackFilters } from '@/types/feedback';
import { RATING_VALUES, STATUS_LABELS, TYPE_LABELS } from '@/utils/feedbackUi';

const filters = defineModel<AdminFeedbackFilters>({ required: true });

const TYPE_OPTIONS = FEEDBACK_TYPES.map((value) => ({ value, label: TYPE_LABELS[value] }));
const STATUS_OPTIONS = FEEDBACK_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }));
const RATING_OPTIONS = RATING_VALUES.map((value) => ({ value, label: `${value}` }));

const DATE_INPUT_CLASS =
  'tw-min-h-[44px] tw-w-full tw-rounded-md tw-border tw-border-border tw-bg-surface-2/60 tw-px-3 tw-text-sm tw-text-ink-primary focus:tw-border-gold/55 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-gold/15';

/** Any filter change goes back to page 1 so the user never lands on an empty page. */
function update<K extends keyof AdminFeedbackFilters>(key: K, value: AdminFeedbackFilters[K]) {
  filters.value = { ...filters.value, [key]: value, page: 1 };
}
</script>

<template>
  <form
    class="tw-grid tw-grid-cols-2 tw-items-end tw-gap-3 md:tw-grid-cols-3 lg:tw-grid-cols-[repeat(3,minmax(0,1fr))_repeat(2,minmax(0,1.1fr))_auto]"
    aria-label="Filter feedback"
    @submit.prevent
  >
    <FeedbackSelect
      :model-value="filters.type"
      label="Type"
      any-label="Any type"
      :options="TYPE_OPTIONS"
      @update:model-value="update('type', $event as AdminFeedbackFilters['type'])"
    />
    <FeedbackSelect
      :model-value="filters.status"
      label="Status"
      any-label="Any status"
      :options="STATUS_OPTIONS"
      @update:model-value="update('status', $event as AdminFeedbackFilters['status'])"
    />
    <FeedbackSelect
      :model-value="filters.rating"
      label="Rating"
      any-label="Any rating"
      :options="RATING_OPTIONS"
      @update:model-value="update('rating', $event === '' ? '' : Number($event))"
    />
    <label
      class="tw-flex tw-min-w-0 tw-flex-col tw-gap-1 tw-text-xs tw-font-medium tw-text-ink-muted"
    >
      From
      <input
        type="date"
        :value="filters.from"
        :max="filters.to || undefined"
        :class="DATE_INPUT_CLASS"
        @input="update('from', ($event.target as HTMLInputElement).value)"
      />
    </label>
    <label
      class="tw-flex tw-min-w-0 tw-flex-col tw-gap-1 tw-text-xs tw-font-medium tw-text-ink-muted"
    >
      To
      <input
        type="date"
        :value="filters.to"
        :min="filters.from || undefined"
        :class="DATE_INPUT_CLASS"
        @input="update('to', ($event.target as HTMLInputElement).value)"
      />
    </label>
    <label
      class="tw-col-span-2 tw-flex tw-min-h-[44px] tw-cursor-pointer tw-items-center tw-gap-2 tw-text-sm tw-text-ink-primary md:tw-col-span-1"
    >
      <input
        type="checkbox"
        class="tw-h-4 tw-w-4 tw-accent-gold"
        :checked="filters.testimonial"
        @change="update('testimonial', ($event.target as HTMLInputElement).checked)"
      />
      Quotable only
    </label>
  </form>
</template>
