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
import { useCollectionsStore } from '@/stores/collections';
import { useUserStore } from '@/stores/user';

type FetchResult<T> = {
  data: { value: T | null };
  error: { value: unknown };
};

function mockFetchJson<T>(result: FetchResult<T>) {
  vi.mocked(useFetch).mockReturnValue({
    json: async () => result,
  } as unknown as ReturnType<typeof useFetch>);
}

const collection = {
  id: 'c1',
  name: 'Favorites',
  userId: 'user_1',
  imageIds: ['img1', 'img2', 'img3', 'img4', 'img5'],
};

describe('useCollectionsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    useUserStore().userId = 'user_1';
  });

  it('has correct initial state', () => {
    const store = useCollectionsStore();
    expect(store.collections).toEqual([]);
    expect(store.selectedCollectionId).toBeNull();
    expect(store.isLoading).toBe(false);
    expect(store.isMutating).toBe(false);
  });

  it('selectCollection stores the id', () => {
    const store = useCollectionsStore();
    store.selectCollection('c1');
    expect(store.selectedCollectionId).toBe('c1');
    store.selectCollection(null);
    expect(store.selectedCollectionId).toBeNull();
  });

  it('skips fetch and mutations when there is no user id', async () => {
    useUserStore().userId = '';
    const store = useCollectionsStore();
    await store.fetchCollections();
    expect(await store.createCollection('Mood')).toBeNull();
    expect(await store.renameCollection('c1', 'New')).toBeNull();
    expect(await store.deleteCollection('c1')).toBe(false);
    expect(await store.addImages('c1', ['a'])).toBeNull();
    expect(await store.removeImages('c1', ['a'])).toBeNull();
    expect(useFetch).not.toHaveBeenCalled();
  });

  it('createCollection and renameCollection reject blank names', async () => {
    const store = useCollectionsStore();
    expect(await store.createCollection('   ')).toBeNull();
    expect(await store.renameCollection('c1', ' ')).toBeNull();
    expect(useFetch).not.toHaveBeenCalled();
  });

  it('addImages and removeImages skip empty image id lists', async () => {
    const store = useCollectionsStore();
    expect(await store.addImages('c1', [])).toBeNull();
    expect(await store.removeImages('c1', [])).toBeNull();
    expect(useFetch).not.toHaveBeenCalled();
  });

  it('fetchCollections stores items on success', async () => {
    mockFetchJson({
      data: { value: { success: true, collections: [{ ...collection, count: 5 }] } },
      error: { value: null },
    });
    const store = useCollectionsStore();
    await store.fetchCollections();
    expect(store.collections).toHaveLength(1);
    expect(store.isLoading).toBe(false);
  });

  it('fetchCollections defaults to an empty list when data is missing', async () => {
    mockFetchJson({ data: { value: null }, error: { value: null } });
    const store = useCollectionsStore();
    await store.fetchCollections();
    expect(store.collections).toEqual([]);
  });

  it('fetchCollections logs and keeps the current list on error', async () => {
    mockFetchJson({ data: { value: null }, error: { value: new Error('fail') } });
    const store = useCollectionsStore();
    store.collections = [{ id: 'keep', name: 'Keep', count: 0, coverImageIds: [] } as never];
    await store.fetchCollections();
    expect(store.collections[0].id).toBe('keep');
    expect(store.isLoading).toBe(false);
  });

  it('createCollection prepends a local list item', async () => {
    mockFetchJson({
      data: { value: { success: true, collection } },
      error: { value: null },
    });
    const store = useCollectionsStore();
    const created = await store.createCollection('  Favorites  ');
    expect(created).toEqual(collection);
    expect(store.collections[0]).toMatchObject({
      id: 'c1',
      count: 5,
      coverImageIds: ['img1', 'img2', 'img3', 'img4'],
    });
  });

  it('createCollection returns null when the API errors or omits the collection', async () => {
    mockFetchJson({ data: { value: null }, error: { value: new Error('fail') } });
    const store = useCollectionsStore();
    expect(await store.createCollection('Mood')).toBeNull();

    mockFetchJson({ data: { value: { success: true } }, error: { value: null } });
    expect(await store.createCollection('Mood')).toBeNull();
  });

  it('renameCollection updates an existing local item', async () => {
    const renamed = { ...collection, name: 'Renamed' };
    mockFetchJson({
      data: { value: { success: true, collection: renamed } },
      error: { value: null },
    });
    const store = useCollectionsStore();
    store.collections = [
      { ...collection, count: 5, coverImageIds: ['img1', 'img2', 'img3', 'img4'] },
    ];
    const result = await store.renameCollection('c1', 'Renamed');
    expect(result?.name).toBe('Renamed');
    expect(store.collections[0].name).toBe('Renamed');
    expect(store.collections).toHaveLength(1);
  });

  it('renameCollection returns null on error or missing collection', async () => {
    mockFetchJson({ data: { value: null }, error: { value: new Error('fail') } });
    const store = useCollectionsStore();
    expect(await store.renameCollection('c1', 'X')).toBeNull();
    mockFetchJson({ data: { value: { success: true } }, error: { value: null } });
    expect(await store.renameCollection('c1', 'X')).toBeNull();
  });

  it('deleteCollection removes the item and clears the selection', async () => {
    mockFetchJson({ data: { value: { success: true } }, error: { value: null } });
    const store = useCollectionsStore();
    store.collections = [{ ...collection, count: 1, coverImageIds: ['img1'] }];
    store.selectCollection('c1');
    expect(await store.deleteCollection('c1')).toBe(true);
    expect(store.collections).toEqual([]);
    expect(store.selectedCollectionId).toBeNull();
  });

  it('deleteCollection keeps selection when another collection is selected', async () => {
    mockFetchJson({ data: { value: { success: true } }, error: { value: null } });
    const store = useCollectionsStore();
    store.collections = [{ ...collection, count: 1, coverImageIds: ['img1'] }];
    store.selectCollection('other');
    expect(await store.deleteCollection('c1')).toBe(true);
    expect(store.selectedCollectionId).toBe('other');
  });

  it('deleteCollection returns false on error', async () => {
    mockFetchJson({ data: { value: null }, error: { value: new Error('fail') } });
    const store = useCollectionsStore();
    expect(await store.deleteCollection('c1')).toBe(false);
  });

  it('addImages and removeImages upsert the returned collection', async () => {
    mockFetchJson({
      data: { value: { success: true, collection } },
      error: { value: null },
    });
    const store = useCollectionsStore();
    expect(await store.addImages('c1', ['img9'])).toEqual(collection);
    expect(store.collections[0].id).toBe('c1');

    const updated = { ...collection, imageIds: ['img1'] };
    mockFetchJson({
      data: { value: { success: true, collection: updated } },
      error: { value: null },
    });
    expect(await store.removeImages('c1', ['img2'])).toEqual(updated);
    expect(store.collections[0].count).toBe(1);
  });

  it('addImages and removeImages return null on error or missing collection', async () => {
    mockFetchJson({ data: { value: null }, error: { value: new Error('fail') } });
    const store = useCollectionsStore();
    expect(await store.addImages('c1', ['a'])).toBeNull();
    expect(await store.removeImages('c1', ['a'])).toBeNull();

    mockFetchJson({ data: { value: { success: true } }, error: { value: null } });
    expect(await store.addImages('c1', ['a'])).toBeNull();
    expect(await store.removeImages('c1', ['a'])).toBeNull();
  });

  it('upsertLocal defaults missing imageIds to an empty array', async () => {
    mockFetchJson({
      data: {
        value: { success: true, collection: { id: 'empty', name: 'Empty', userId: 'user_1' } },
      },
      error: { value: null },
    });
    const store = useCollectionsStore();
    await store.createCollection('Empty');
    expect(store.collections[0]).toMatchObject({ count: 0, coverImageIds: [] });
  });
});
