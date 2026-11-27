const MS_PER_MINUTE = 60 * 1000;

export const FEEDBACK_GENERATION_THRESHOLD = 3;
export const FEEDBACK_PROMPT_COOLDOWN_DAYS = 30;
export const FEEDBACK_FIRST_SESSION_HOURS = 12;

export const FEEDBACK_LOW_RATING_MAX = 2;
export const FEEDBACK_HIGH_RATING_MIN = 4;
export const FEEDBACK_RATING_MIN = 1;
export const FEEDBACK_RATING_MAX = 5;

export const FEEDBACK_MESSAGE_MAX_LENGTH = 2000;
export const FEEDBACK_DISPLAY_NAME_MAX_LENGTH = 60;
export const FEEDBACK_ADMIN_NOTE_MAX_LENGTH = 2000;

export const FEEDBACK_CONTEXT_STRING_MAX_LENGTH = 300;
export const FEEDBACK_VIEWPORT_MAX = 20000;

export const FEEDBACK_ADMIN_DEFAULT_PAGE_SIZE = 25;
export const FEEDBACK_ADMIN_MAX_PAGE_SIZE = 100;
/** Caps `page` so skip stays far below int64 and a huge value cannot reach the driver. */
export const FEEDBACK_ADMIN_MAX_PAGE = 10000;

/** Per-user feedback rate limit (requests per window). */
export const FEEDBACK_RATE_LIMIT = { windowMs: 10 * MS_PER_MINUTE, max: 10 } as const;

/** Per-admin limit for the admin routes, kept apart from the user bucket so triage is not throttled. */
export const FEEDBACK_ADMIN_RATE_LIMIT = { windowMs: MS_PER_MINUTE, max: 120 } as const;

/** Days covered by the weekly digest (and the previous period it is compared against). */
export const FEEDBACK_DIGEST_WINDOW_DAYS = 7;

/** Mondays 09:00 UTC. */
export const FEEDBACK_DIGEST_CRON = '0 9 * * 1';

export const FEEDBACK_SOURCES = ['popup', 'menu'] as const;
export const FEEDBACK_TYPES = ['rating', 'bug', 'idea', 'other'] as const;
export const FEEDBACK_STATUSES = ['new', 'triaged', 'planned', 'done', 'wont_fix'] as const;
export const FEEDBACK_TRIGGERS = ['generation', 'download'] as const;

/** Types a user can pick in the menu dialog (rating comes only from the popup). */
export const FEEDBACK_MENU_TYPES = ['bug', 'idea', 'other'] as const;

/** Statuses that count as "open" in the admin summary. */
export const FEEDBACK_OPEN_STATUSES = ['new', 'triaged'] as const;

export type FeedbackSource = (typeof FEEDBACK_SOURCES)[number];
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];
export type FeedbackTrigger = (typeof FEEDBACK_TRIGGERS)[number];
export type FeedbackMenuType = (typeof FEEDBACK_MENU_TYPES)[number];
