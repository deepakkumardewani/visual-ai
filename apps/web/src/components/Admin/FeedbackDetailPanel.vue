<script setup lang="ts">
import { faCheck, faChevronLeft, faCopy } from '@/plugins/icons';
import {
  FEEDBACK_ADMIN_NOTE_MAX_LENGTH,
  FEEDBACK_RATING_MAX,
  FEEDBACK_STATUSES,
} from '@visual-ai/shared';
import type { FeedbackStatus } from '@visual-ai/shared';
import { computed, onBeforeUnmount, ref, watch } from 'vue';

import FeedbackSelect from '@/components/Admin/FeedbackSelect.vue';
import FeedbackSubmitButton from '@/components/Feedback/FeedbackSubmitButton.vue';
import FeedbackTextField from '@/components/Feedback/FeedbackTextField.vue';

import type { AdminFeedbackItem } from '@/types/feedback';
import { createLogger } from '@/utils/logger';
import {
  FEEDBACK_ERROR_TEXT_CLASS,
  STATUS_LABELS,
  TYPE_LABELS,
  formatFeedbackDate,
  formatTestimonial,
} from '@/utils/feedbackUi';

const COPIED_RESET_MS = 2000;
const STATUS_OPTIONS = FEEDBACK_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }));

const log = createLogger('feedback-admin');

const props = defineProps<{
  item: AdminFeedbackItem;
  /** Which write is in flight, so only that control shows busy. */
  saving: 'status' | 'note' | null;
  saveError: string;
  /** Count of failed saves; each one resets the status select to the stored value. */
  failedSaves: number;
  /** Which write just succeeded, for the "Saved" confirmation. */
  saved: 'status' | 'note' | null;
}>();

const emit = defineEmits<{
  back: [];
  'update-status': [status: FeedbackStatus];
  'save-note': [note: string];
}>();

const note = ref(props.item.adminNote);
const copied = ref(false);
const copyFailed = ref(false);
const statusDraft = ref<FeedbackStatus>(props.item.status);
let copiedTimer: ReturnType<typeof setTimeout> | undefined;

watch(
  () => props.item.id,
  () => {
    note.value = props.item.adminNote;
    copied.value = false;
    copyFailed.value = false;
  },
);

watch(
  () => props.item.status,
  (status) => (statusDraft.value = status),
);

// A rejected save leaves `item.status` unchanged, so the native select must be pulled back by hand.
watch(
  () => props.failedSaves,
  () => (statusDraft.value = props.item.status),
);

onBeforeUnmount(() => clearTimeout(copiedTimer));

function onStatusChange(status: FeedbackStatus) {
  statusDraft.value = status;
  emit('update-status', status);
}

const canCopyTestimonial = computed(
  () => props.item.testimonialConsent && props.item.message.trim().length > 0,
);
const noteChanged = computed(() => note.value.trim() !== props.item.adminNote);

const contextRows = computed(() => {
  const { context } = props.item;
  return [
    ['Page', context.route],
    ['Model', context.lastModelId],
    ['Plan', context.plan],
    ['Credits', context.creditsTier],
    ['Version', context.appVersion],
    ['Viewport', context.viewport ? `${context.viewport.w} × ${context.viewport.h}` : undefined],
    ['Browser', context.userAgent],
  ].filter((row): row is [string, string] => Boolean(row[1]));
});

function flashCopyResult(ok: boolean) {
  copied.value = ok;
  copyFailed.value = !ok;
  clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => {
    copied.value = false;
    copyFailed.value = false;
  }, COPIED_RESET_MS);
}

async function copyTestimonial() {
  try {
    await navigator.clipboard.writeText(
      formatTestimonial(props.item.message, props.item.displayName),
    );
  } catch (error) {
    log.warn('copy testimonial failed', { error });
    flashCopyResult(false);
    return;
  }
  flashCopyResult(true);
}
</script>

<template>
  <article
    class="tw-flex tw-flex-col tw-gap-5 tw-rounded-card tw-border tw-border-border tw-bg-surface-1 tw-p-5"
    aria-label="Feedback detail"
    tabindex="-1"
    data-testid="feedback-detail"
  >
    <button
      type="button"
      class="tw-inline-flex tw-min-h-[44px] tw-w-fit tw-items-center tw-gap-2 tw-border-0 tw-bg-transparent tw-p-0 tw-text-sm tw-text-ink-muted hover:tw-text-ink-primary focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent lg:tw-hidden"
      @click="emit('back')"
    >
      <font-awesome-icon :icon="faChevronLeft" aria-hidden="true" />
      All feedback
    </button>

    <header class="tw-flex tw-flex-col tw-gap-1">
      <p class="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-ink-muted">
        {{ TYPE_LABELS[item.type] }}
        <template v-if="item.rating">
          · Rated {{ item.rating }} of {{ FEEDBACK_RATING_MAX }}</template
        >
        · {{ formatFeedbackDate(item.createdAt) }}
      </p>
      <p class="tw-m-0 tw-break-all tw-text-sm tw-text-ink-primary">{{ item.email }}</p>
    </header>

    <p class="tw-m-0 tw-whitespace-pre-wrap tw-break-words tw-text-base tw-text-ink-primary">
      {{ item.message || 'No written message' }}
    </p>

    <div
      v-if="item.testimonialConsent"
      class="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-rounded-md tw-bg-gold/10 tw-p-3"
    >
      <p class="tw-m-0 tw-text-sm tw-text-ink-primary">
        Can be quoted<template v-if="item.displayName">
          as <strong>{{ item.displayName }}</strong></template
        >
      </p>
      <button
        type="button"
        :disabled="!canCopyTestimonial"
        class="tw-inline-flex tw-min-h-[44px] tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-gold/50 tw-bg-transparent tw-px-4 tw-text-sm tw-font-semibold tw-text-gold tw-transition-colors tw-duration-fast hover:tw-bg-gold/10 disabled:tw-opacity-45 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-gold motion-reduce:tw-transition-none"
        @click="copyTestimonial"
      >
        <font-awesome-icon :icon="copied ? faCheck : faCopy" aria-hidden="true" />
        {{ copied ? 'Copied' : 'Copy testimonial' }}
      </button>
      <p
        role="status"
        class="tw-m-0 tw-basis-full tw-text-sm"
        :class="copyFailed ? FEEDBACK_ERROR_TEXT_CLASS : 'tw-sr-only'"
        data-testid="copy-status"
      >
        <template v-if="copyFailed"
          >Couldn't copy. Select the message and copy it by hand.</template
        >
      </p>
    </div>

    <div class="tw-flex tw-flex-col tw-gap-1.5">
      <FeedbackSelect
        :model-value="statusDraft"
        label="Status"
        :options="STATUS_OPTIONS"
        :disabled="saving !== null"
        @update:model-value="onStatusChange($event as FeedbackStatus)"
      />
    </div>

    <form
      class="tw-flex tw-flex-col tw-gap-3"
      novalidate
      @submit.prevent="emit('save-note', note.trim())"
    >
      <FeedbackTextField
        v-model="note"
        label="Admin note"
        placeholder="Internal only, never shown to the user"
        :max-length="FEEDBACK_ADMIN_NOTE_MAX_LENGTH"
        :rows="3"
        :disabled="saving === 'note'"
      />
      <FeedbackSubmitButton
        :disabled="!noteChanged"
        :loading="saving === 'note'"
        loading-label="Saving…"
      >
        Save note
      </FeedbackSubmitButton>
    </form>

    <p v-if="saveError" role="alert" class="tw-m-0 tw-text-sm" :class="FEEDBACK_ERROR_TEXT_CLASS">
      {{ saveError }}
    </p>
    <p role="status" class="tw-m-0 tw-text-sm tw-text-accent" :class="{ 'tw-sr-only': !saved }">
      {{ saved ? 'Saved' : '' }}
    </p>

    <dl
      v-if="contextRows.length"
      class="tw-m-0 tw-grid tw-grid-cols-[auto_1fr] tw-gap-x-4 tw-gap-y-1.5 tw-text-xs"
    >
      <template v-for="[label, value] in contextRows" :key="label">
        <dt class="tw-text-ink-muted">{{ label }}</dt>
        <dd class="tw-m-0 tw-break-words tw-text-ink-primary">{{ value }}</dd>
      </template>
    </dl>
  </article>
</template>
