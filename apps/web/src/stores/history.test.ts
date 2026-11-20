import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useHistoryStore } from '@/stores/history';
import { useUserStore } from '@/stores/user';
import type { IImageObject } from '@/types';
import { HISTORY_CAP, PLAN } from '@visual-ai/shared';

describe('useHistoryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('has correct initial state', () => {
    const store = useHistoryStore();
    expect(store.selectedSize).toBe('medium');
    expect(store.searchQuery).toBe('');
    expect(store.selectedFeatureTypes).toEqual([]);
    expect(store.isBulkDeleting).toBe(false);
    expect(store.isBulkFavoriting).toBe(false);
    expect(store.isBulkDownloading).toBe(false);
  });

  it('updates filter and bulk-action flags', () => {
    const store = useHistoryStore();
    store.selectedSize = 'large';
    store.searchQuery = 'sunset';
    store.selectedFeatureTypes = ['image', 'upscale'];
    store.isBulkDeleting = true;
    store.isBulkFavoriting = true;
    store.isBulkDownloading = true;

    expect(store.selectedSize).toBe('large');
    expect(store.searchQuery).toBe('sunset');
    expect(store.selectedFeatureTypes).toEqual(['image', 'upscale']);
    expect(store.isBulkDeleting).toBe(true);
    expect(store.isBulkFavoriting).toBe(true);
    expect(store.isBulkDownloading).toBe(true);
  });

  describe('historyFullLevel', () => {
    const fill = (count: number) => {
      useUserStore().history = Array.from(
        { length: count },
        (_, i) => ({ _id: String(i) }) as IImageObject,
      );
    };

    it('is none until the user sync finishes', () => {
      const user = useUserStore();
      fill(HISTORY_CAP[PLAN.FREE]);
      expect(useHistoryStore().historyFullLevel).toBe('none');
      user.isReady = true;
      expect(useHistoryStore().historyFullLevel).toBe('full');
    });

    it('does not count unsaved entries without an _id', () => {
      useUserStore().isReady = true;
      fill(HISTORY_CAP[PLAN.FREE] - 1);
      useUserStore().history.unshift({} as IImageObject);
      const store = useHistoryStore();
      expect(store.savedCount).toBe(HISTORY_CAP[PLAN.FREE] - 1);
      expect(store.historyFullLevel).toBe('near');
    });

    it('follows the plan cap', () => {
      const user = useUserStore();
      user.isReady = true;
      fill(HISTORY_CAP[PLAN.FREE]);
      const store = useHistoryStore();
      expect(store.historyCap).toBe(HISTORY_CAP[PLAN.FREE]);
      user.plan = PLAN.PRO;
      expect(store.historyCap).toBe(HISTORY_CAP[PLAN.PRO]);
      expect(store.historyFullLevel).toBe('none');
    });

    it('re-evaluates when images are deleted', () => {
      useUserStore().isReady = true;
      const store = useHistoryStore();
      fill(100);
      expect(store.historyFullLevel).toBe('full');
      useUserStore().history.splice(90);
      expect(store.historyFullLevel).toBe('near');
      useUserStore().history.splice(50);
      expect(store.historyFullLevel).toBe('none');
    });
  });
});
