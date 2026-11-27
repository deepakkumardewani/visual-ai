import type {
  FeedbackContext,
  FeedbackSource,
  FeedbackStatus,
  FeedbackType,
} from '@visual-ai/shared';

/** One feedback row as returned by the admin endpoints. */
export interface AdminFeedbackItem {
  id: string;
  userId: string;
  email: string;
  source: FeedbackSource;
  type: FeedbackType;
  rating?: number;
  message: string;
  testimonialConsent: boolean;
  displayName?: string;
  context: FeedbackContext;
  status: FeedbackStatus;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFeedbackSummary {
  avgRating: number | null;
  countByType: Record<FeedbackType, number>;
  open: number;
}

export interface AdminFeedbackPage {
  items: AdminFeedbackItem[];
  total: number;
  page: number;
  limit: number;
  summary: AdminFeedbackSummary;
}

/** Filters as held by the admin UI; empty string means "any". */
export interface AdminFeedbackFilters {
  type: FeedbackType | '';
  status: FeedbackStatus | '';
  rating: number | '';
  /** yyyy-mm-dd from a date input. */
  from: string;
  to: string;
  testimonial: boolean;
  page: number;
}

/** Result of an API call; `status` is the HTTP status, 0 for a network failure. */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number };
