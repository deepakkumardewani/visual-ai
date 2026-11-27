import type { FeedbackStatus } from '@visual-ai/shared';
import { computed, ref, watch } from 'vue';

import type {
  AdminFeedbackFilters,
  AdminFeedbackItem,
  AdminFeedbackPage,
  AdminFeedbackSummary,
  ApiResult,
} from '@/types/feedback';
import { fetchAdminFeedback, updateAdminFeedback } from '@/utils/feedbackApi';
import {
  FEEDBACK_FILTER_DEBOUNCE_MS,
  FEEDBACK_SAVED_RESET_MS,
  RATE_LIMITED_STATUS,
} from '@/utils/feedbackUi';

export type AdminLoadState = 'loading' | 'ready' | 'error' | 'rate-limited';

const EMPTY_FILTERS: AdminFeedbackFilters = {
  type: '',
  status: '',
  rating: '',
  from: '',
  to: '',
  testimonial: false,
  page: 1,
};

/** Statuses that count towards the summary's "open" total (spec decision 8). */
const OPEN_STATUSES: readonly FeedbackStatus[] = ['new', 'triaged'];

/**
 * Edits patch the list from the PATCH response rather than refetching; admin routes have their own
 * limiter (120/min), separate from the user routes.
 */
export function useAdminFeedback() {
  const filters = ref<AdminFeedbackFilters>({ ...EMPTY_FILTERS });
  const items = ref<AdminFeedbackItem[]>([]);
  const summary = ref<AdminFeedbackSummary | null>(null);
  const total = ref(0);
  const limit = ref(1);
  const state = ref<AdminLoadState>('loading');
  const selectedId = ref<string | null>(null);
  const saving = ref<'status' | 'note' | null>(null);
  const saveError = ref('');
  /** Bumped on every failed save so the UI can reset controls that show an unsaved value. */
  const failedSaves = ref(0);
  const saved = ref<'status' | 'note' | null>(null);
  let savedTimer: ReturnType<typeof setTimeout> | undefined;
  let saveQueue: Promise<void> = Promise.resolve();
  let queuedSaves = 0;
  let debounce: ReturnType<typeof setTimeout> | undefined;
  let requestSeq = 0;

  const selected = computed(() => items.value.find((item) => item.id === selectedId.value) ?? null);
  const hasFilters = computed(
    () => JSON.stringify({ ...filters.value, page: 1 }) !== JSON.stringify(EMPTY_FILTERS),
  );
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / limit.value)));

  async function load() {
    const seq = ++requestSeq;
    state.value = 'loading';
    const result = await fetchAdminFeedback(filters.value).catch(
      (): ApiResult<AdminFeedbackPage> => ({ ok: false, status: 0 }),
    );
    if (seq !== requestSeq) return; // a newer filter change superseded this response
    if (!result.ok) {
      state.value = result.status === RATE_LIMITED_STATUS ? 'rate-limited' : 'error';
      return;
    }
    items.value = result.data.items;
    summary.value = result.data.summary;
    total.value = result.data.total;
    limit.value = result.data.limit;
    if (!items.value.some((item) => item.id === selectedId.value)) selectedId.value = null;
    state.value = 'ready';
  }

  watch(
    filters,
    () => {
      clearTimeout(debounce);
      debounce = setTimeout(load, FEEDBACK_FILTER_DEBOUNCE_MS);
    },
    { deep: true },
  );

  function applySaved(id: string, updated: AdminFeedbackItem) {
    const previous = items.value.find((item) => item.id === id);
    items.value = items.value.map((item) => (item.id === id ? updated : item));
    if (!previous || !summary.value) return;
    const delta =
      Number(OPEN_STATUSES.includes(updated.status)) -
      Number(OPEN_STATUSES.includes(previous.status));
    if (delta) summary.value = { ...summary.value, open: Math.max(0, summary.value.open + delta) };
  }

  function flashSaved(kind: 'status' | 'note') {
    saved.value = kind;
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => (saved.value = null), FEEDBACK_SAVED_RESET_MS);
  }

  async function runPatch(
    id: string,
    kind: 'status' | 'note',
    body: { status: FeedbackStatus } | { adminNote: string },
  ) {
    saving.value = kind;
    saveError.value = '';
    saved.value = null;
    const result = await updateAdminFeedback(id, body).catch(
      (): ApiResult<{ item: AdminFeedbackItem }> => ({ ok: false, status: 0 }),
    );
    if (!result.ok) {
      failedSaves.value += 1;
      saveError.value =
        result.status === RATE_LIMITED_STATUS
          ? 'Too many requests. Wait a few minutes, then try again.'
          : 'Could not save. Try again.';
      return;
    }
    applySaved(id, result.data.item);
    flashSaved(kind);
  }

  /** Writes run one after another so a status change made during a note save is never dropped. */
  function patch(
    kind: 'status' | 'note',
    body: { status: FeedbackStatus } | { adminNote: string },
  ) {
    const id = selectedId.value;
    if (!id) return Promise.resolve();
    queuedSaves += 1;
    saveQueue = saveQueue.then(async () => {
      await runPatch(id, kind, body);
      queuedSaves -= 1;
      if (queuedSaves === 0) saving.value = null;
    });
    return saveQueue;
  }

  function select(id: string | null) {
    selectedId.value = id;
    saveError.value = '';
  }

  function resetFilters() {
    filters.value = { ...EMPTY_FILTERS };
  }

  function goToPage(page: number) {
    filters.value = { ...filters.value, page: Math.min(Math.max(1, page), pageCount.value) };
  }

  return {
    filters,
    items,
    summary,
    total,
    state,
    selected,
    selectedId,
    saving,
    saveError,
    failedSaves,
    saved,
    hasFilters,
    pageCount,
    load,
    select,
    resetFilters,
    goToPage,
    setStatus: (status: FeedbackStatus) => patch('status', { status }),
    saveNote: (adminNote: string) => patch('note', { adminNote }),
    dispose: () => {
      clearTimeout(debounce);
      clearTimeout(savedTimer);
    },
  };
}
