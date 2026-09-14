import { flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('vue-clerk', () => ({
  useUser: () => ({ isLoaded: { value: true }, isSignedIn: { value: true } }),
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue('tok') }),
}));

vi.mock('@/composables/useFetch', () => ({
  useFetch: vi.fn(),
}));

import { useFetch } from '@/composables/useFetch';
import { useExploreStore } from '@/stores/explore';
import { useUserStore } from '@/stores/user';
import type { ExploreFeedItem } from '@/types';

function item(id: string): ExploreFeedItem {
  return { id } as ExploreFeedItem;
}

type FetchResult<T> = {
  data: { value: T | null };
  error: { value: unknown };
};

function mockFetchJson<T>(result: FetchResult<T>) {
  vi.mocked(useFetch).mockReturnValue({
    json: async () => result,
  } as unknown as ReturnType<typeof useFetch>);
}

describe('useExploreStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    useUserStore().userId = 'user_1';
  });

  it('has correct initial state and getters', () => {
    const store = useExploreStore();
    expect(store.items).toEqual([]);
    expect(store.nextCursor).toBeNull();
    expect(store.hasMore).toBe(false);
    expect(store.isEmpty).toBe(false);
    expect(store.activeIndex).toBe(-1);
    expect(store.activeItem).toBeNull();
    expect(store.positionLabel).toBe('');
    expect(store.findById('missing')).toBeUndefined();
  });

  it('loadFeed is a no-op without a user id', async () => {
    useUserStore().userId = '';
    const store = useExploreStore();
    store.error = 'stale';
    await store.loadFeed();
    expect(store.error).toBeNull();
    expect(useFetch).not.toHaveBeenCalled();
    expect(store.hasFetched).toBe(false);
  });

  it('loadFeed replaces items and cursor', async () => {
    mockFetchJson({
      data: { value: { items: [item('a'), item('b')], nextCursor: 'cur' } },
      error: { value: null },
    });
    const store = useExploreStore();
    await store.loadFeed();
    expect(store.items.map((i) => i.id)).toEqual(['a', 'b']);
    expect(store.nextCursor).toBe('cur');
    expect(store.hasMore).toBe(true);
    expect(store.hasFetched).toBe(true);
    expect(store.isEmpty).toBe(false);
  });

  it('isEmpty is true after a successful empty fetch', async () => {
    mockFetchJson({
      data: { value: { items: [], nextCursor: null } },
      error: { value: null },
    });
    const store = useExploreStore();
    await store.loadFeed();
    expect(store.isEmpty).toBe(true);
  });

  it('loadFeed sets an error when the request fails or the page is missing', async () => {
    mockFetchJson({ data: { value: null }, error: { value: new Error('fail') } });
    const store = useExploreStore();
    await store.loadFeed();
    expect(store.error).toContain('Could not load community creations');

    mockFetchJson({ data: { value: null }, error: { value: null } });
    await store.loadFeed();
    expect(store.error).toContain('Could not load community creations');
  });

  it('loadFeed wraps unexpected throws', async () => {
    vi.mocked(useFetch).mockReturnValue({
      json: async () => {
        throw new Error('network');
      },
    } as unknown as ReturnType<typeof useFetch>);
    const store = useExploreStore();
    await store.loadFeed();
    expect(store.error).toContain('Could not load community creations');
    expect(store.isLoading).toBe(false);
  });

  it('loadFeed is a no-op while already loading', async () => {
    let resolveJson: (
      value: FetchResult<{ items: ExploreFeedItem[]; nextCursor: string | null }>,
    ) => void = () => {};
    vi.mocked(useFetch).mockReturnValue({
      json: () =>
        new Promise((resolve) => {
          resolveJson = resolve;
        }),
    } as unknown as ReturnType<typeof useFetch>);
    const store = useExploreStore();
    const first = store.loadFeed();
    await store.loadFeed();
    expect(useFetch).toHaveBeenCalledTimes(1);
    resolveJson({ data: { value: { items: [], nextCursor: null } }, error: { value: null } });
    await first;
  });

  it('loadMore appends unique items and skips without a cursor', async () => {
    const store = useExploreStore();
    await store.loadMore();
    expect(useFetch).not.toHaveBeenCalled();

    store.items = [item('a')];
    store.nextCursor = 'page2';
    mockFetchJson({
      data: { value: { items: [item('a'), item('b')], nextCursor: null } },
      error: { value: null },
    });
    await store.loadMore();
    expect(store.items.map((i) => i.id)).toEqual(['a', 'b']);
    expect(store.hasMore).toBe(false);
  });

  it('loadMore is a no-op while already loading more', async () => {
    let resolveJson: (
      value: FetchResult<{ items: ExploreFeedItem[]; nextCursor: string | null }>,
    ) => void = () => {};
    vi.mocked(useFetch).mockReturnValue({
      json: () =>
        new Promise((resolve) => {
          resolveJson = resolve;
        }),
    } as unknown as ReturnType<typeof useFetch>);
    const store = useExploreStore();
    store.nextCursor = 'c';
    const first = store.loadMore();
    await store.loadMore();
    expect(useFetch).toHaveBeenCalledTimes(1);
    resolveJson({ data: { value: { items: [], nextCursor: null } }, error: { value: null } });
    await first;
  });

  it('ensureItem returns an existing item and backfills the feed', async () => {
    const existing = item('deep');
    mockFetchJson({
      data: { value: { items: [item('a')], nextCursor: null } },
      error: { value: null },
    });
    const store = useExploreStore();
    store.items = [existing];
    const result = await store.ensureItem('deep');
    expect(result?.id).toBe('deep');
    await flushPromises();
    expect(store.findById('deep')?.id).toBe('deep');
    expect(store.findById('a')?.id).toBe('a');
  });

  it('ensureItem fetches a missing item and then loads the feed', async () => {
    vi.mocked(useFetch).mockImplementation((url: string) => {
      if (String(url).includes('/explore/items/')) {
        return {
          json: async () => ({ data: { value: item('solo') }, error: { value: null } }),
        } as unknown as ReturnType<typeof useFetch>;
      }
      return {
        json: async () => ({
          data: { value: { items: [item('feed')], nextCursor: null } },
          error: { value: null },
        }),
      } as unknown as ReturnType<typeof useFetch>;
    });
    const store = useExploreStore();
    const result = await store.ensureItem('solo');
    expect(result?.id).toBe('solo');
    expect(store.findById('solo')).toBeTruthy();
    expect(store.findById('feed')).toBeTruthy();
  });

  it('ensureItem restores a deep-linked item dropped by the feed reload', async () => {
    vi.mocked(useFetch).mockImplementation((url: string) => {
      if (String(url).includes('/explore/items/')) {
        return {
          json: async () => ({ data: { value: item('solo') }, error: { value: null } }),
        } as unknown as ReturnType<typeof useFetch>;
      }
      return {
        json: async () => ({
          data: { value: { items: [item('other')], nextCursor: null } },
          error: { value: null },
        }),
      } as unknown as ReturnType<typeof useFetch>;
    });
    const store = useExploreStore();
    const result = await store.ensureItem('solo');
    expect(result?.id).toBe('solo');
    expect(store.items[0].id).toBe('solo');
  });

  it('ensureItem sets an error when the item cannot be fetched', async () => {
    mockFetchJson({ data: { value: null }, error: { value: new Error('404') } });
    const store = useExploreStore();
    expect(await store.ensureItem('missing')).toBeNull();
    expect(store.error).toBe('This creation could not be found.');
  });

  it('ensureItem wraps item fetch throws', async () => {
    vi.mocked(useFetch).mockReturnValue({
      json: async () => {
        throw new Error('network');
      },
    } as unknown as ReturnType<typeof useFetch>);
    const store = useExploreStore();
    expect(await store.ensureItem('x')).toBeNull();
    expect(store.isLoadingItem).toBe(false);
  });

  it('goNext and goPrev move the active item and prefetch near the end', async () => {
    mockFetchJson({
      data: { value: { items: [item('e')], nextCursor: null } },
      error: { value: null },
    });
    const store = useExploreStore();
    store.items = [item('a'), item('b'), item('c'), item('d')];
    store.nextCursor = 'more';
    store.setActiveId('a');
    expect(store.positionLabel).toBe('1 / 4+');

    const nextId = await store.goNext();
    expect(nextId).toBe('b');
    expect(store.activeItem?.id).toBe('b');
    expect(store.findById('e')).toBeTruthy();

    expect(await store.goPrev()).toBe('a');
    expect(await store.goPrev()).toBeNull();
    store.setActiveId('e');
    expect(await store.goNext()).toBeNull();
  });

  it('goNext returns null without an active item', async () => {
    const store = useExploreStore();
    store.items = [item('a'), item('b')];
    expect(await store.goNext()).toBeNull();
    expect(await store.goPrev()).toBeNull();
  });

  it('positionLabel omits the plus when there is no next page', () => {
    const store = useExploreStore();
    store.items = [item('a')];
    store.setActiveId('a');
    expect(store.positionLabel).toBe('1 / 1');
  });

  it('loadMore sets an error when the request fails or the page is missing', async () => {
    const store = useExploreStore();
    store.nextCursor = 'c';
    mockFetchJson({ data: { value: null }, error: { value: new Error('fail') } });
    await store.loadMore();
    expect(store.error).toContain('Could not load community creations');

    store.nextCursor = 'c';
    mockFetchJson({ data: { value: null }, error: { value: null } });
    await store.loadMore();
    expect(store.error).toContain('Could not load community creations');
  });

  it('loadMore wraps unexpected throws', async () => {
    vi.mocked(useFetch).mockReturnValue({
      json: async () => {
        throw new Error('network');
      },
    } as unknown as ReturnType<typeof useFetch>);
    const store = useExploreStore();
    store.nextCursor = 'c';
    await store.loadMore();
    expect(store.error).toContain('Could not load community creations');
    expect(store.isLoadingMore).toBe(false);
  });

  it('ensureItem skips a feed reload when the feed was already fetched', async () => {
    const store = useExploreStore();
    store.items = [item('a')];
    store.hasFetched = true;
    expect(await store.ensureItem('a')).toEqual(item('a'));
    expect(useFetch).not.toHaveBeenCalled();
  });

  it('reset restores empty state', async () => {
    mockFetchJson({
      data: { value: { items: [item('a')], nextCursor: 'c' } },
      error: { value: null },
    });
    const store = useExploreStore();
    await store.loadFeed();
    store.setActiveId('a');
    store.reset();
    expect(store.items).toEqual([]);
    expect(store.nextCursor).toBeNull();
    expect(store.hasFetched).toBe(false);
    expect(store.activeId).toBeNull();
    expect(store.error).toBeNull();
  });
});
