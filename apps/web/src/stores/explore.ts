import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import type { ExploreFeedItem, ExploreFeedResponse } from '@/types';

import { useUserStore } from '@/stores/user';

import { useFetch } from '@/composables/useFetch';
import { createLogger } from '@/utils/logger';

const log = createLogger('explore');

const DEFAULT_LIMIT = 24;
/** Prefetch more pages when this many items remain after the active index. */
const LOAD_MORE_THRESHOLD = 3;

export const useExploreStore = defineStore('explore', () => {
  const items = ref<ExploreFeedItem[]>([]);
  const nextCursor = ref<string | null>(null);
  const isLoading = ref(false);
  const isLoadingMore = ref(false);
  const isLoadingItem = ref(false);
  const error = ref<string | null>(null);
  const hasFetched = ref(false);
  const activeId = ref<string | null>(null);

  const hasMore = computed(() => Boolean(nextCursor.value));
  const isEmpty = computed(() => hasFetched.value && !isLoading.value && items.value.length === 0);

  const activeIndex = computed(() => {
    if (!activeId.value) return -1;
    return items.value.findIndex((item) => item.id === activeId.value);
  });

  const activeItem = computed(() => {
    const index = activeIndex.value;
    if (index < 0) return null;
    return items.value[index] ?? null;
  });

  const positionLabel = computed(() => {
    const index = activeIndex.value;
    if (index < 0) return '';
    return `${index + 1} / ${items.value.length}${hasMore.value ? '+' : ''}`;
  });

  function findById(id: string): ExploreFeedItem | undefined {
    return items.value.find((item) => item.id === id);
  }

  function upsertItem(item: ExploreFeedItem) {
    const index = items.value.findIndex((existing) => existing.id === item.id);
    if (index >= 0) {
      items.value[index] = item;
      return;
    }
    items.value = [item, ...items.value];
  }

  async function fetchPage(options: { append: boolean }) {
    const userStore = useUserStore();
    const excludeUserId = userStore.userId;
    if (!excludeUserId) {
      error.value = null;
      return;
    }

    if (options.append) {
      if (!nextCursor.value || isLoadingMore.value) return;
      isLoadingMore.value = true;
    } else {
      isLoading.value = true;
      error.value = null;
    }

    const params = new URLSearchParams({
      excludeUserId,
      limit: String(DEFAULT_LIMIT),
    });
    if (options.append && nextCursor.value) {
      params.set('cursor', nextCursor.value);
    }

    try {
      const { data, error: fetchError } = await useFetch(
        `/explore/feed?${params.toString()}`,
      ).json<ExploreFeedResponse>();

      if (fetchError.value) {
        log.error('explore feed fetch failed', { error: fetchError.value });
        error.value = 'Could not load community creations. Try again.';
        return;
      }

      const page = data.value;
      if (!page) {
        error.value = 'Could not load community creations. Try again.';
        return;
      }

      if (options.append) {
        const seen = new Set(items.value.map((item) => item.id));
        const fresh = page.items.filter((item) => !seen.has(item.id));
        items.value = [...items.value, ...fresh];
      } else {
        items.value = page.items;
      }
      nextCursor.value = page.nextCursor;
      error.value = null;
    } catch (err) {
      log.error('explore feed fetch failed', { error: err });
      error.value = 'Could not load community creations. Try again.';
    } finally {
      isLoading.value = false;
      isLoadingMore.value = false;
      hasFetched.value = true;
    }
  }

  async function fetchItemById(id: string): Promise<ExploreFeedItem | null> {
    isLoadingItem.value = true;
    try {
      const { data, error: fetchError } = await useFetch(
        `/explore/items/${id}`,
      ).json<ExploreFeedItem>();
      if (fetchError.value || !data.value) {
        log.error('explore item fetch failed', { error: fetchError.value, id });
        return null;
      }
      return data.value;
    } catch (err) {
      log.error('explore item fetch failed', { error: err, id });
      return null;
    } finally {
      isLoadingItem.value = false;
    }
  }

  async function loadFeed() {
    if (isLoading.value) return;
    nextCursor.value = null;
    await fetchPage({ append: false });
  }

  async function loadMore() {
    await fetchPage({ append: true });
  }

  /**
   * Ensures the item is available for the viewer. Loads feed neighbors when possible.
   */
  async function ensureItem(id: string): Promise<ExploreFeedItem | null> {
    activeId.value = id;
    error.value = null;

    const existing = findById(id);
    if (existing) {
      if (!hasFetched.value) {
        void loadFeed().then(() => {
          // Keep the focused item if feed reload dropped a deep-linked outlier.
          if (!findById(id) && existing) upsertItem(existing);
        });
      }
      return existing;
    }

    const fetched = await fetchItemById(id);
    if (!fetched) {
      error.value = 'This creation could not be found.';
      return null;
    }

    upsertItem(fetched);

    if (!hasFetched.value) {
      await loadFeed();
      if (!findById(id)) upsertItem(fetched);
    }

    return findById(id) ?? fetched;
  }

  async function maybeLoadMoreNearEnd() {
    const index = activeIndex.value;
    if (index < 0) return;
    if (items.value.length - index - 1 <= LOAD_MORE_THRESHOLD && hasMore.value) {
      await loadMore();
    }
  }

  async function goNext(): Promise<string | null> {
    await maybeLoadMoreNearEnd();
    const index = activeIndex.value;
    if (index < 0 || index >= items.value.length - 1) return null;
    const next = items.value[index + 1];
    if (!next) return null;
    activeId.value = next.id;
    void maybeLoadMoreNearEnd();
    return next.id;
  }

  async function goPrev(): Promise<string | null> {
    const index = activeIndex.value;
    if (index <= 0) return null;
    const prev = items.value[index - 1];
    if (!prev) return null;
    activeId.value = prev.id;
    return prev.id;
  }

  function setActiveId(id: string | null) {
    activeId.value = id;
  }

  function reset() {
    items.value = [];
    nextCursor.value = null;
    isLoading.value = false;
    isLoadingMore.value = false;
    isLoadingItem.value = false;
    error.value = null;
    hasFetched.value = false;
    activeId.value = null;
  }

  return {
    items,
    nextCursor,
    isLoading,
    isLoadingMore,
    isLoadingItem,
    error,
    hasFetched,
    hasMore,
    isEmpty,
    activeId,
    activeIndex,
    activeItem,
    positionLabel,
    findById,
    ensureItem,
    goNext,
    goPrev,
    setActiveId,
    loadFeed,
    loadMore,
    reset,
  };
});
