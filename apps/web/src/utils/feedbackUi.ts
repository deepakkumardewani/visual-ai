import {
  FEEDBACK_HIGH_RATING_MIN,
  FEEDBACK_LOW_RATING_MAX,
  FEEDBACK_RATING_MAX,
  FEEDBACK_RATING_MIN,
} from '@visual-ai/shared';
import type { FeedbackMenuType, FeedbackStatus, FeedbackType } from '@visual-ai/shared';

import type { SegmentedOption } from '@/types/primitives';

/** How long the popup's thank-you shows before the card closes itself. */
export const FEEDBACK_SUCCESS_AUTOCLOSE_MS = 3200;
/** Admin filter inputs wait this long after the last change before refetching. */
export const FEEDBACK_FILTER_DEBOUNCE_MS = 300;
/** Max wait for Clerk to finish loading before the admin guard gives up. */
export const ADMIN_GUARD_CLERK_TIMEOUT_MS = 4000;
/** How long the admin's "Saved" confirmation stays visible. */
export const FEEDBACK_SAVED_RESET_MS = 2000;
/** Characters left at which the dialog counter turns into a warning. */
export const FEEDBACK_COUNTER_WARN_REMAINING = 100;

export const RATING_VALUES: readonly number[] = Array.from(
  { length: FEEDBACK_RATING_MAX - FEEDBACK_RATING_MIN + 1 },
  (_, index) => FEEDBACK_RATING_MIN + index,
);

export const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
};

export type FeedbackBranch = 'low' | 'mid' | 'high';

export function branchForRating(rating: number): FeedbackBranch {
  if (rating <= FEEDBACK_LOW_RATING_MAX) return 'low';
  return rating >= FEEDBACK_HIGH_RATING_MIN ? 'high' : 'mid';
}

export const BRANCH_PROMPTS: Record<FeedbackBranch, { question: string; placeholder: string }> = {
  low: {
    question: "What went wrong or what's missing?",
    placeholder: 'Tell us what got in the way',
  },
  mid: {
    question: 'What would make it better?',
    placeholder: 'One thing we could improve',
  },
  high: {
    question: 'What do you love?',
    placeholder: 'What works well for you',
  },
};

export const MENU_TYPE_OPTIONS: SegmentedOption<FeedbackMenuType>[] = [
  { label: 'Bug', value: 'bug' },
  { label: 'Idea', value: 'idea' },
  { label: 'Other', value: 'other' },
];

export const MENU_MESSAGE_PLACEHOLDERS: Record<FeedbackMenuType, string> = {
  bug: 'What happened, and what did you expect instead?',
  idea: 'What would you like to be able to do?',
  other: 'What is on your mind?',
};

export const STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: 'New',
  triaged: 'Triaged',
  planned: 'Planned',
  done: 'Done',
  wont_fix: "Won't fix",
};

export const TYPE_LABELS: Record<FeedbackType, string> = {
  rating: 'Rating',
  bug: 'Bug',
  idea: 'Idea',
  other: 'Other',
};

/** Quote plus attribution, as pasted into the website's testimonials. */
export function formatTestimonial(message: string, displayName?: string): string {
  const quote = `“${message.trim()}”`;
  return displayName?.trim() ? `${quote} — ${displayName.trim()}` : quote;
}

const DATE_FORMAT = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function formatFeedbackDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : DATE_FORMAT.format(date);
}

export const STATUS_TONES: Record<FeedbackStatus, string> = {
  new: 'tw-bg-accent-subtle tw-text-accent',
  triaged: 'tw-bg-surface-3 tw-text-ink-primary',
  planned: 'tw-bg-gold/15 tw-text-gold',
  done: 'tw-bg-surface-2 tw-text-ink-muted',
  wont_fix: 'tw-bg-surface-2 tw-text-ink-faint',
};

export const RATE_LIMITED_STATUS = 429;

/** One place for the error colour (the app-wide red); a themed danger token needs a design call. */
export const FEEDBACK_ERROR_TEXT_CLASS = 'tw-text-red-400';

export const FEEDBACK_SUBMIT_ERROR = "Couldn't send that. Your message is still here, try again.";
export const FEEDBACK_RATE_LIMITED_ERROR =
  "You've sent a lot of feedback. Please wait a few minutes, then try again. Your message is still here.";

/** Rate-limited sends get distinct copy: retrying straight away cannot work. */
export function submitErrorMessage(status: number): string {
  return status === RATE_LIMITED_STATUS ? FEEDBACK_RATE_LIMITED_ERROR : FEEDBACK_SUBMIT_ERROR;
}
