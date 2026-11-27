<script setup lang="ts">
import { FEEDBACK_DISPLAY_NAME_MAX_LENGTH, FEEDBACK_MESSAGE_MAX_LENGTH } from '@visual-ai/shared';
import { computed, useId } from 'vue';

import FeedbackSubmitButton from '@/components/Feedback/FeedbackSubmitButton.vue';
import FeedbackTextField from '@/components/Feedback/FeedbackTextField.vue';

import {
  BRANCH_PROMPTS,
  FEEDBACK_ERROR_TEXT_CLASS,
  RATING_LABELS,
  branchForRating,
} from '@/utils/feedbackUi';

const message = defineModel<string>('message', { required: true });
const consent = defineModel<boolean>('consent', { required: true });
const displayName = defineModel<string>('displayName', { required: true });

const props = defineProps<{
  rating: number;
  submitting: boolean;
  errorMessage: string;
}>();

const emit = defineEmits<{ submit: []; back: [] }>();

const branch = computed(() => branchForRating(props.rating));
const prompt = computed(() => BRANCH_PROMPTS[branch.value]);
const isHighRating = computed(() => branch.value === 'high');
const consentId = useId();
const nameId = useId();
</script>

<template>
  <form class="tw-flex tw-flex-col tw-gap-3" novalidate @submit.prevent="emit('submit')">
    <button
      type="button"
      class="tw-inline-flex tw-min-h-[44px] tw-w-fit tw-items-center tw-gap-1.5 tw-rounded-full tw-border-0 tw-bg-transparent tw-px-0 tw-py-1 tw-text-xs sm:tw-min-h-0 tw-font-medium tw-text-ink-muted tw-transition-colors tw-duration-fast hover:tw-text-ink-primary focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent motion-reduce:tw-transition-none"
      :disabled="submitting"
      @click="emit('back')"
    >
      <span aria-hidden="true">&lsaquo;</span>
      You rated it {{ rating }}, {{ RATING_LABELS[rating] }}. Change
    </button>

    <FeedbackTextField
      v-model="message"
      :label="prompt.question"
      :placeholder="prompt.placeholder"
      :max-length="FEEDBACK_MESSAGE_MAX_LENGTH"
      :rows="3"
      :disabled="submitting"
      optional
    />

    <div v-if="isHighRating" class="tw-flex tw-flex-col tw-gap-2.5">
      <label
        :for="consentId"
        class="tw-flex tw-min-h-[44px] tw-cursor-pointer tw-items-center tw-gap-2.5 tw-text-sm tw-text-ink-primary"
      >
        <input
          :id="consentId"
          v-model="consent"
          type="checkbox"
          class="tw-h-4 tw-w-4 tw-shrink-0 tw-accent-gold"
          :disabled="submitting"
        />
        You can quote me on the website
      </label>
      <div v-if="consent" class="tw-flex tw-flex-col tw-gap-1.5">
        <label :for="nameId" class="tw-text-sm tw-font-medium tw-text-ink-primary">
          Name to show
          <span class="tw-font-normal tw-text-ink-muted">(optional)</span>
        </label>
        <input
          :id="nameId"
          v-model="displayName"
          type="text"
          autocomplete="off"
          :maxlength="FEEDBACK_DISPLAY_NAME_MAX_LENGTH"
          placeholder="First name or handle"
          :disabled="submitting"
          class="tw-min-h-[44px] tw-w-full tw-rounded-md tw-border tw-border-border tw-bg-surface-2/60 tw-px-3 tw-text-sm tw-text-ink-primary tw-transition-colors tw-duration-fast placeholder:tw-text-ink-faint focus:tw-border-gold/55 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-gold/15 motion-reduce:tw-transition-none"
        />
      </div>
    </div>

    <p
      v-if="errorMessage"
      role="alert"
      class="tw-m-0 tw-text-sm"
      :class="FEEDBACK_ERROR_TEXT_CLASS"
    >
      {{ errorMessage }}
    </p>

    <FeedbackSubmitButton :loading="submitting">Send</FeedbackSubmitButton>
  </form>
</template>
