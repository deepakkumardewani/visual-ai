<script setup lang="ts">
import type { AdminFeedbackItem } from '@/types/feedback';

import { FEEDBACK_RATING_MAX } from '@visual-ai/shared';

import { STATUS_LABELS, STATUS_TONES, TYPE_LABELS, formatFeedbackDate } from '@/utils/feedbackUi';

defineProps<{
  items: AdminFeedbackItem[];
  selectedId: string | null;
}>();

const emit = defineEmits<{ select: [id: string] }>();
</script>

<template>
  <ul class="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0" aria-label="Feedback">
    <li v-for="item in items" :key="item.id">
      <button
        type="button"
        :aria-current="selectedId === item.id ? 'true' : undefined"
        :data-testid="`feedback-row-${item.id}`"
        class="tw-flex tw-w-full tw-flex-col tw-gap-1.5 tw-rounded-card tw-border tw-bg-surface-1 tw-p-3.5 tw-text-left tw-transition-colors tw-duration-fast hover:tw-bg-surface-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent motion-reduce:tw-transition-none"
        :class="selectedId === item.id ? 'tw-border-accent/70' : 'tw-border-border'"
        @click="emit('select', item.id)"
      >
        <span class="tw-flex tw-items-center tw-gap-2 tw-text-xs">
          <span
            v-if="item.rating"
            class="tw-inline-flex tw-h-6 tw-min-w-[1.5rem] tw-items-center tw-justify-center tw-rounded-full tw-bg-surface-3 tw-px-1.5 tw-font-semibold tw-tabular-nums tw-text-ink-primary"
            :aria-label="`Rated ${item.rating} out of ${FEEDBACK_RATING_MAX}`"
          >
            {{ item.rating }}
          </span>
          <span class="tw-font-semibold tw-uppercase tw-tracking-wide tw-text-ink-muted">
            {{ TYPE_LABELS[item.type] }}
          </span>
          <span
            class="tw-rounded-full tw-px-2 tw-py-0.5 tw-font-medium"
            :class="STATUS_TONES[item.status]"
          >
            {{ STATUS_LABELS[item.status] }}
          </span>
          <span class="tw-ml-auto tw-shrink-0 tw-text-ink-muted">
            {{ formatFeedbackDate(item.createdAt) }}
          </span>
        </span>
        <span class="tw-line-clamp-2 tw-text-sm tw-text-ink-primary">
          {{ item.message || 'No written message' }}
        </span>
        <span class="tw-truncate tw-text-xs tw-text-ink-muted">{{ item.email }}</span>
      </button>
    </li>
  </ul>
</template>
