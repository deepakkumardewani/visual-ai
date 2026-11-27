<script setup lang="ts">
import { faTimes } from '@/plugins/icons';
import { useTimeoutFn } from '@vueuse/core';
import type { CreateFeedbackRequest } from '@visual-ai/shared';
import { storeToRefs } from 'pinia';
import { computed, nextTick, ref, useId, watch } from 'vue';

import { useAppStore } from '@/stores/app';
import { useFeedbackStore } from '@/stores/feedback';

import { useFeedbackContext } from '@/composables/useFeedbackContext';

import FeedbackPopupForm from '@/components/Feedback/FeedbackPopupForm.vue';
import FeedbackRatingScale from '@/components/Feedback/FeedbackRatingScale.vue';

import { submitFeedback } from '@/utils/feedbackApi';
import {
  FEEDBACK_SUCCESS_AUTOCLOSE_MS,
  branchForRating,
  submitErrorMessage,
} from '@/utils/feedbackUi';

type Step = 'rating' | 'detail' | 'success';

const TEXT_ENTRY_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

const feedbackStore = useFeedbackStore();
const appStore = useAppStore();
const { popupOpen } = storeToRefs(feedbackStore);
const { snackbar } = storeToRefs(appStore);
const captureContext = useFeedbackContext();

const titleId = useId();
const cardRef = ref<HTMLElement | null>(null);
const step = ref<Step>('rating');
const rating = ref(0);
const message = ref('');
const consent = ref(false);
const displayName = ref('');
const submitting = ref(false);
const errorMessage = ref('');
let previouslyFocused: HTMLElement | null = null;
/** Element to focus once the step cross-fade has mounted it; the card holds focus meanwhile. */
let pendingStepFocus: string | null = null;
const DETAIL_FOCUS_SELECTOR = 'textarea';
const RATING_FOCUS_SELECTOR = '[role="radio"][tabindex="0"]';

const autoClose = useTimeoutFn(() => feedbackStore.closePopup(), FEEDBACK_SUCCESS_AUTOCLOSE_MS, {
  immediate: false,
});

const isHighRating = computed(() => branchForRating(rating.value) === 'high');

function reset() {
  step.value = 'rating';
  rating.value = 0;
  message.value = '';
  consent.value = false;
  displayName.value = '';
  submitting.value = false;
  errorMessage.value = '';
  pendingStepFocus = null;
}

function isTypingElsewhere(): boolean {
  const active = document.activeElement;
  return active instanceof HTMLElement && active.matches(TEXT_ENTRY_SELECTOR);
}

async function onOpen() {
  reset();
  previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  await nextTick();
  // Never pull focus out of a field the user is typing in; non-blocking means non-intrusive.
  if (!isTypingElsewhere()) cardRef.value?.focus();
}

/** Runs while the card is still mounted, so focus inside it (or already lost) goes back to the opener. */
function onClose() {
  autoClose.stop();
  const restore = previouslyFocused;
  previouslyFocused = null;
  const active = document.activeElement;
  const focusWasOurs = !active || active === document.body || !!cardRef.value?.contains(active);
  if (restore?.isConnected && focusWasOurs) restore.focus();
}

watch(popupOpen, (open) => (open ? void onOpen() : onClose()));

function chooseRating(value: number) {
  rating.value = value;
  errorMessage.value = '';
  step.value = 'detail';
  // The textarea only exists after the out-in transition, so park focus on the card (keeps Esc working).
  pendingStepFocus = DETAIL_FOCUS_SELECTOR;
  cardRef.value?.focus();
}

function buildRequest(): CreateFeedbackRequest {
  const text = message.value.trim();
  const name = displayName.value.trim();
  const quoteable = isHighRating.value && consent.value;
  return {
    source: 'popup',
    rating: rating.value,
    ...(text ? { message: text } : {}),
    ...(quoteable ? { testimonialConsent: true, ...(name ? { displayName: name } : {}) } : {}),
    context: captureContext(),
  };
}

async function onSubmit() {
  if (submitting.value) return;
  submitting.value = true;
  errorMessage.value = '';
  const result = await submitFeedback(buildRequest());
  submitting.value = false;
  if (!result.ok) {
    errorMessage.value = submitErrorMessage(result.status);
    return;
  }
  step.value = 'success';
  autoClose.start();
  // The focused Send button is about to leave the DOM; keep focus (and Esc) on the card.
  void nextTick(() => cardRef.value?.focus());
}

/** Back to the rating step: the card holds focus during the cross-fade, then the radio group takes it. */
function onChangeRating() {
  step.value = 'rating';
  pendingStepFocus = RATING_FOCUS_SELECTOR;
  cardRef.value?.focus();
}

function onStepEntered() {
  if (!pendingStepFocus) return;
  const selector = pendingStepFocus;
  pendingStepFocus = null;
  cardRef.value?.querySelector<HTMLElement>(selector)?.focus();
}

/** Esc is handled on the card (and stopped) so a modal's global Escape listener does not also fire. */
function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return;
  event.stopPropagation();
  feedbackStore.closePopup();
}
</script>

<template>
  <Teleport to="body">
    <Transition name="feedback-popup" appear>
      <section
        v-if="popupOpen"
        ref="cardRef"
        class="feedback-popup"
        :class="{ 'feedback-popup--lifted': snackbar }"
        role="dialog"
        aria-modal="false"
        aria-label="Share feedback"
        tabindex="-1"
        data-testid="feedback-popup"
        @keydown="onKeydown"
      >
        <button
          v-if="step !== 'success'"
          type="button"
          class="tw-absolute tw-right-2 tw-top-2 tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-ink-muted tw-transition-colors tw-duration-fast hover:tw-bg-surface-2 hover:tw-text-ink-primary focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent motion-reduce:tw-transition-none"
          aria-label="Dismiss feedback"
          data-testid="feedback-popup-close"
          @click="feedbackStore.closePopup()"
        >
          <font-awesome-icon :icon="faTimes" aria-hidden="true" />
        </button>

        <Transition name="feedback-step" mode="out-in" @after-enter="onStepEntered">
          <div v-if="step === 'rating'" key="rating" class="tw-flex tw-flex-col tw-gap-4">
            <h2
              :id="titleId"
              class="tw-m-0 tw-pr-8 tw-font-display tw-text-lg tw-font-normal tw-leading-snug tw-text-ink-primary"
            >
              How is Visual AI working for you?
            </h2>
            <FeedbackRatingScale :labelled-by="titleId" :selected="rating" @select="chooseRating" />
          </div>

          <FeedbackPopupForm
            v-else-if="step === 'detail'"
            key="detail"
            v-model:message="message"
            v-model:consent="consent"
            v-model:display-name="displayName"
            :rating="rating"
            :submitting="submitting"
            :error-message="errorMessage"
            class="tw-pr-8"
            @submit="onSubmit"
            @back="onChangeRating"
          />

          <div
            v-else
            key="success"
            class="feedback-popup__success"
            role="status"
            aria-live="polite"
          >
            <span class="feedback-popup__check" aria-hidden="true">&#10003;</span>
            <p class="tw-m-0 tw-font-display tw-text-lg tw-text-ink-primary">
              Thanks, that genuinely helps.
            </p>
          </div>
        </Transition>
      </section>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
/* Above AppModal (1200+) so a download from an open dialog still shows it; below Toast (10000). */
$popup-z: 1300;
$toast-clearance: -3.75rem;

.feedback-popup {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: $popup-z;
  width: min(22rem, calc(100vw - 2rem));
  padding: 1.25rem;
  border: 1px solid rgb(var(--tw-border) / 0.75);
  border-radius: 16px;
  background: rgb(var(--tw-surface-1));
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(201, 168, 76, 0.08);
  color: rgb(var(--tw-ink-primary));
  outline: none;
  transition: transform 200ms ease;
}

.feedback-popup--lifted {
  transform: translateY($toast-clearance);
}

.feedback-popup__success {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.25rem 0;
}

.feedback-popup__check {
  display: inline-flex;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgb(var(--tw-accent) / 0.15);
  color: rgb(var(--tw-accent));
  font-size: 0.95rem;
  font-weight: 700;
}

@media (max-width: 639px) {
  .feedback-popup {
    right: 0;
    bottom: 0;
    left: 0;
    width: auto;
    padding-bottom: calc(1.25rem + env(safe-area-inset-bottom));
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-radius: 20px 20px 0 0;
    max-height: calc(100dvh - 1rem);
    overflow-y: auto;
  }

  .feedback-popup--lifted {
    transform: none;
  }
}

.feedback-popup-enter-active,
.feedback-popup-leave-active {
  transition:
    opacity 250ms ease,
    translate 250ms cubic-bezier(0.16, 1, 0.3, 1);
}

.feedback-popup-enter-from,
.feedback-popup-leave-to {
  opacity: 0;
  translate: 0 1rem;
}

.feedback-step-enter-active,
.feedback-step-leave-active {
  transition: opacity 150ms ease;
}

.feedback-step-enter-from,
.feedback-step-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .feedback-popup,
  .feedback-popup-enter-active,
  .feedback-popup-leave-active,
  .feedback-step-enter-active,
  .feedback-step-leave-active {
    transition: none;
  }
}
</style>
