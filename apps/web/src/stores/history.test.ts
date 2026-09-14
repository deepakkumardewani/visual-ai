import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useHistoryStore } from '@/stores/history';

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
});
