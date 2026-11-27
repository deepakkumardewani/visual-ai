import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

const fetchAdminFeedback = vi.fn();
const updateAdminFeedback = vi.fn();
vi.mock('@/utils/feedbackApi', () => ({
  fetchAdminFeedback: (...args: unknown[]) => fetchAdminFeedback(...args),
  updateAdminFeedback: (...args: unknown[]) => updateAdminFeedback(...args),
}));

import { useAdminFeedback } from '@/composables/useAdminFeedback';
import type { AdminFeedbackItem } from '@/types/feedback';
import { FEEDBACK_FILTER_DEBOUNCE_MS, FEEDBACK_SAVED_RESET_MS } from '@/utils/feedbackUi';

const item = { id: 'a', status: 'new', adminNote: '' } as AdminFeedbackItem;
const page = (items = [item]) => ({
  ok: true,
  data: {
    items,
    total: items.length,
    page: 1,
    limit: 25,
    summary: { avgRating: 4, countByType: { rating: 1, bug: 0, idea: 0, other: 0 }, open: 1 },
  },
});

describe('useAdminFeedback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchAdminFeedback.mockReset().mockResolvedValue(page());
    updateAdminFeedback.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it('loads, then debounces filter changes into one request', async () => {
    const admin = useAdminFeedback();
    await admin.load();
    expect(admin.state.value).toBe('ready');
    admin.filters.value = { ...admin.filters.value, type: 'bug' };
    admin.filters.value = { ...admin.filters.value, status: 'new' };
    await nextTick();
    await vi.advanceTimersByTimeAsync(FEEDBACK_FILTER_DEBOUNCE_MS);
    expect(fetchAdminFeedback).toHaveBeenCalledTimes(2);
    admin.dispose();
  });

  it('shows a rate-limited state on 429', async () => {
    fetchAdminFeedback.mockResolvedValue({ ok: false, status: 429 });
    const admin = useAdminFeedback();
    await admin.load();
    expect(admin.state.value).toBe('rate-limited');
  });

  it('patches the list from the PATCH response without refetching', async () => {
    const admin = useAdminFeedback();
    await admin.load();
    admin.select('a');
    updateAdminFeedback.mockResolvedValue({
      ok: true,
      data: { item: { ...item, status: 'done' } },
    });
    await admin.setStatus('done');
    expect(admin.selected.value?.status).toBe('done');
    expect(fetchAdminFeedback).toHaveBeenCalledTimes(1);
  });

  it('reports a save failure', async () => {
    const admin = useAdminFeedback();
    await admin.load();
    admin.select('a');
    updateAdminFeedback.mockResolvedValue({ ok: false, status: 500 });
    await admin.saveNote('x');
    expect(admin.saveError.value).toContain('Could not save');
  });

  it('applies a status change made while a note save is in flight', async () => {
    const admin = useAdminFeedback();
    await admin.load();
    admin.select('a');
    let finishNote!: (value: unknown) => void;
    updateAdminFeedback
      .mockReturnValueOnce(new Promise((r) => (finishNote = r)))
      .mockResolvedValueOnce({ ok: true, data: { item: { ...item, status: 'done' } } });
    const note = admin.saveNote('x');
    const status = admin.setStatus('done');
    await Promise.resolve();
    expect(updateAdminFeedback).toHaveBeenCalledTimes(1);
    finishNote({ ok: true, data: { item: { ...item, adminNote: 'x' } } });
    await Promise.all([note, status]);
    expect(updateAdminFeedback).toHaveBeenNthCalledWith(2, 'a', { status: 'done' });
    expect(admin.selected.value?.status).toBe('done');
    expect(admin.saving.value).toBeNull();
  });

  it('counts failed saves so the UI can revert the select', async () => {
    const admin = useAdminFeedback();
    await admin.load();
    admin.select('a');
    updateAdminFeedback.mockResolvedValue({ ok: false, status: 500 });
    await admin.setStatus('done');
    expect(admin.failedSaves.value).toBe(1);
    expect(admin.selected.value?.status).toBe('new');
  });

  it('keeps the open count in step with triage', async () => {
    const admin = useAdminFeedback();
    await admin.load();
    admin.select('a');
    updateAdminFeedback.mockResolvedValueOnce({
      ok: true,
      data: { item: { ...item, status: 'done' } },
    });
    await admin.setStatus('done');
    expect(admin.summary.value?.open).toBe(0);
    updateAdminFeedback.mockResolvedValueOnce({
      ok: true,
      data: { item: { ...item, status: 'triaged' } },
    });
    await admin.setStatus('triaged');
    expect(admin.summary.value?.open).toBe(1);
    updateAdminFeedback.mockResolvedValueOnce({
      ok: true,
      data: { item: { ...item, status: 'new' } },
    });
    await admin.setStatus('new');
    expect(admin.summary.value?.open).toBe(1);
  });

  it('lands in the error state when the request throws', async () => {
    fetchAdminFeedback.mockRejectedValue(new Error('boom'));
    const admin = useAdminFeedback();
    await admin.load();
    expect(admin.state.value).toBe('error');
  });

  it('confirms a successful save briefly', async () => {
    const admin = useAdminFeedback();
    await admin.load();
    admin.select('a');
    updateAdminFeedback.mockResolvedValue({ ok: true, data: { item } });
    await admin.saveNote('x');
    expect(admin.saved.value).toBe('note');
    await vi.advanceTimersByTimeAsync(FEEDBACK_SAVED_RESET_MS);
    expect(admin.saved.value).toBeNull();
  });
});
