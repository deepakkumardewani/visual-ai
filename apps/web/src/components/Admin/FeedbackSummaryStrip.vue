<script setup lang="ts">
import { FEEDBACK_TYPES } from '@visual-ai/shared';

import type { AdminFeedbackSummary } from '@/types/feedback';

import { TYPE_LABELS } from '@/utils/feedbackUi';

defineProps<{ summary: AdminFeedbackSummary | null; loading: boolean }>();

const RATING_FRACTION_DIGITS = 1;
</script>

<template>
  <section
    aria-label="Feedback summary"
    class="tw-grid tw-grid-cols-2 tw-gap-px tw-overflow-hidden tw-rounded-card tw-border tw-border-border tw-bg-border sm:tw-grid-cols-[1.2fr_1fr_2fr]"
    :aria-busy="loading"
  >
    <div class="tw-flex tw-flex-col tw-gap-1 tw-bg-surface-1 tw-p-4">
      <span class="tw-text-eyebrow tw-uppercase tw-text-ink-muted">Average rating</span>
      <span
        class="tw-font-display tw-text-3xl tw-tabular-nums tw-text-ink-primary"
        data-testid="summary-avg"
      >
        {{ summary?.avgRating == null ? '–' : summary.avgRating.toFixed(RATING_FRACTION_DIGITS) }}
      </span>
    </div>
    <div class="tw-flex tw-flex-col tw-gap-1 tw-bg-surface-1 tw-p-4">
      <span class="tw-text-eyebrow tw-uppercase tw-text-ink-muted">Open items</span>
      <span
        class="tw-font-display tw-text-3xl tw-tabular-nums tw-text-accent"
        data-testid="summary-open"
      >
        {{ summary?.open ?? '–' }}
      </span>
    </div>
    <dl
      class="tw-col-span-2 tw-m-0 tw-grid tw-grid-cols-4 tw-gap-2 tw-bg-surface-1 tw-p-4 sm:tw-col-span-1"
    >
      <div v-for="type in FEEDBACK_TYPES" :key="type" class="tw-flex tw-flex-col tw-gap-1">
        <dt class="tw-text-eyebrow tw-uppercase tw-text-ink-muted">{{ TYPE_LABELS[type] }}</dt>
        <dd class="tw-m-0 tw-font-display tw-text-xl tw-tabular-nums tw-text-ink-primary">
          {{ summary?.countByType[type] ?? '–' }}
        </dd>
      </div>
    </dl>
  </section>
</template>
