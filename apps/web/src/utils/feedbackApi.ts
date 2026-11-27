import { FEEDBACK_ADMIN_DEFAULT_PAGE_SIZE } from '@visual-ai/shared';
import type {
  CreateFeedbackRequest,
  FeedbackTrigger,
  UpdateFeedbackAdminRequest,
} from '@visual-ai/shared';

import type {
  AdminFeedbackFilters,
  AdminFeedbackItem,
  AdminFeedbackPage,
  ApiResult,
} from '@/types/feedback';

import { useFetch } from '@/composables/useFetch';
import { createLogger } from '@/utils/logger';

const log = createLogger('feedback');

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const END_OF_DAY = 'T23:59:59.999';

/** `useFetch` never throws: errors land in refs, so every call funnels through this. */
async function toResult<T>(
  request: PromiseLike<{
    data: { value: T | null };
    error: { value: unknown };
    statusCode: { value: number | null };
  }>,
  label: string,
): Promise<ApiResult<T>> {
  const { data, error, statusCode } = await request;
  if (error.value || data.value === null) {
    const status = statusCode.value ?? 0;
    log.warn(`${label} failed`, { status });
    return { ok: false, status };
  }
  return { ok: true, data: data.value };
}

export async function requestEligibility(trigger: FeedbackTrigger): Promise<boolean> {
  const result = await toResult(
    useFetch('/feedback/eligibility', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ trigger }),
    }).json<{ eligible: boolean }>(),
    'eligibility',
  );
  return result.ok && result.data.eligible === true;
}

export function submitFeedback(body: CreateFeedbackRequest): Promise<ApiResult<{ id: string }>> {
  return toResult(
    useFetch('/feedback', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    }).json<{ id: string }>(),
    'submit',
  );
}

export async function fetchAdminAccess(): Promise<boolean> {
  const result = await toResult(
    useFetch('/feedback/admin/access').json<{ isAdmin: boolean }>(),
    'admin access',
  );
  return result.ok && result.data.isAdmin === true;
}

/** Chrome's date input accepts 6-digit years, which `toISOString()` rejects; drop those. */
function toIsoOrUndefined(local: string): string | undefined {
  if (!local) return undefined;
  const date = new Date(local);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** Defined values only; `to` is pushed to the end of its day so that day is included. */
export function buildAdminQuery(filters: AdminFeedbackFilters): string {
  const params = new URLSearchParams();
  const entries: [string, string | number | undefined][] = [
    ['type', filters.type || undefined],
    ['status', filters.status || undefined],
    ['rating', filters.rating || undefined],
    ['from', toIsoOrUndefined(`${filters.from}T00:00:00`)],
    ['to', toIsoOrUndefined(`${filters.to}${END_OF_DAY}`)],
    ['testimonial', filters.testimonial ? 'true' : undefined],
    ['page', filters.page],
    ['limit', FEEDBACK_ADMIN_DEFAULT_PAGE_SIZE],
  ];
  for (const [key, value] of entries) {
    if (value !== undefined) params.set(key, String(value));
  }
  return params.toString();
}

export async function fetchAdminFeedback(
  filters: AdminFeedbackFilters,
): Promise<ApiResult<AdminFeedbackPage>> {
  try {
    return await toResult(
      useFetch(`/feedback/admin?${buildAdminQuery(filters)}`).json<AdminFeedbackPage>(),
      'admin list',
    );
  } catch (error) {
    log.warn('admin list threw', { error });
    return { ok: false, status: 0 };
  }
}

export function updateAdminFeedback(
  id: string,
  patch: UpdateFeedbackAdminRequest,
): Promise<ApiResult<{ item: AdminFeedbackItem }>> {
  return toResult(
    useFetch(`/feedback/admin/${id}`, {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify(patch),
    }).json<{ item: AdminFeedbackItem }>(),
    'admin update',
  );
}
