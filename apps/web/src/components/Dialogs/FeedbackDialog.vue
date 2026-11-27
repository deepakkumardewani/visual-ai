<script setup lang="ts">
import { faCommentDots } from '@/plugins/icons';
import { FEEDBACK_MESSAGE_MAX_LENGTH } from '@visual-ai/shared';
import type { FeedbackMenuType } from '@visual-ai/shared';
import { storeToRefs } from 'pinia';
import { computed, nextTick, ref, watch } from 'vue';

import { useDialogStore } from '@/stores/dialog';

import { useFeedbackContext } from '@/composables/useFeedbackContext';

import AppModal from '@/components/AppModal.vue';
import FeedbackSubmitButton from '@/components/Feedback/FeedbackSubmitButton.vue';
import FeedbackTextField from '@/components/Feedback/FeedbackTextField.vue';
import SegmentedControl from '@/components/primitives/SegmentedControl.vue';

import { submitFeedback } from '@/utils/feedbackApi';
import {
  FEEDBACK_ERROR_TEXT_CLASS,
  MENU_MESSAGE_PLACEHOLDERS,
  MENU_TYPE_OPTIONS,
  submitErrorMessage,
} from '@/utils/feedbackUi';

const TITLE_ID = 'feedback-dialog-title';

const dialogStore = useDialogStore();
const { showFeedbackDialog } = storeToRefs(dialogStore);
const captureContext = useFeedbackContext();

const type = ref<FeedbackMenuType>('bug');
const message = ref('');
const submitting = ref(false);
const errorMessage = ref('');
const sent = ref(false);
let submitSeq = 0;
const doneRef = ref<HTMLButtonElement | null>(null);

const trimmedMessage = computed(() => message.value.trim());
const canSubmit = computed(() => trimmedMessage.value.length > 0 && !submitting.value);

function reset() {
  submitSeq += 1; // orphans any submit still in flight from a previous session
  type.value = 'bug';
  message.value = '';
  submitting.value = false;
  errorMessage.value = '';
  sent.value = false;
}

// Reset on open (not on close) so the leave transition never flashes the empty form.
watch(showFeedbackDialog, (open) => {
  if (open) reset();
});

async function onSubmit() {
  if (!canSubmit.value) return;
  submitting.value = true;
  errorMessage.value = '';
  const seq = ++submitSeq;
  const result = await submitFeedback({
    source: 'menu',
    type: type.value,
    message: trimmedMessage.value,
    context: captureContext(),
  });
  if (seq !== submitSeq) return;
  submitting.value = false;
  if (!result.ok) {
    errorMessage.value = submitErrorMessage(result.status);
    return;
  }
  sent.value = true;
  await nextTick();
  doneRef.value?.focus();
}
</script>

<template>
  <AppModal
    :open="showFeedbackDialog"
    max-width="28rem"
    :labelled-by="TITLE_ID"
    @close="dialogStore.hideFeedback()"
  >
    <template #title>
      <span :id="TITLE_ID" class="tw-inline-flex tw-items-center tw-gap-2">
        <font-awesome-icon :icon="faCommentDots" class="tw-text-gold" aria-hidden="true" />
        Send feedback
      </span>
    </template>

    <div v-if="sent" class="tw-flex tw-flex-col tw-gap-5" role="status" aria-live="polite">
      <p class="tw-m-0 tw-text-sm tw-text-ink-muted" data-testid="feedback-sent">
        Thanks, that genuinely helps. We read every message.
      </p>
      <button
        ref="doneRef"
        type="button"
        class="tw-min-h-[44px] tw-w-full tw-rounded-full tw-border tw-border-border tw-bg-transparent tw-text-sm tw-font-semibold tw-text-ink-primary tw-transition-colors tw-duration-fast hover:tw-bg-surface-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-gold motion-reduce:tw-transition-none"
        @click="dialogStore.hideFeedback()"
      >
        Done
      </button>
    </div>

    <form
      v-else
      class="tw-flex tw-flex-col tw-gap-4"
      novalidate
      @submit.prevent="onSubmit"
      @keydown.meta.enter.prevent="onSubmit"
      @keydown.ctrl.enter.prevent="onSubmit"
    >
      <SegmentedControl
        v-model="type"
        :options="MENU_TYPE_OPTIONS"
        label="What kind of feedback?"
      />

      <FeedbackTextField
        v-model="message"
        label="Your message"
        :placeholder="MENU_MESSAGE_PLACEHOLDERS[type]"
        :max-length="FEEDBACK_MESSAGE_MAX_LENGTH"
        :rows="6"
        :disabled="submitting"
      />

      <p class="tw-m-0 tw-text-xs tw-text-ink-muted">
        We'll include your current page, browser and plan.
      </p>

      <p
        v-if="errorMessage"
        role="alert"
        class="tw-m-0 tw-text-sm"
        :class="FEEDBACK_ERROR_TEXT_CLASS"
      >
        {{ errorMessage }}
      </p>

      <FeedbackSubmitButton :disabled="!canSubmit" :loading="submitting">
        Send feedback
      </FeedbackSubmitButton>
    </form>
  </AppModal>
</template>
