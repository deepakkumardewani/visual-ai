import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useFetch } from '@/composables/useFetch';
import {
  getHistoryItemFeature,
  getHistoryItemId,
  groupHistoryItems,
  HISTORY_CHIPS,
  matchesChip,
  mergeHistoryItems,
  useHistoryStore,
  type HistoryChip,
  type HistoryItem,
} from '@/stores/history';
import { useUserStore } from '@/stores/user';
import type { IImageObject } from '@/types';
import { FeatureType, HISTORY_CAP, PLAN, type MediaAssetDto } from '@visual-ai/shared';

vi.mock('@/composables/useFetch', () => ({ useFetch: vi.fn() }));
vi.mock('@/utils/logger', () => ({
  createLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }),
}));

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

const asset = (id: string, feature: FeatureType, createdAt?: string): MediaAssetDto => ({
  id,
  type: 'audio',
  feature,
  modelKey: 'MINIMAX_MUSIC_26',
  title: `Asset ${id}`,
  url: `https://cdn.test/${id}.mp3`,
  creditsCharged: 1,
  saved: true,
  createdAt,
});

const image = (id: string, createdAt?: string) =>
  ({ _id: id, featureType: FeatureType.IMAGE, createdAt }) as IImageObject;

describe('history item helpers', () => {
  it('reads id and feature from either kind of entry', () => {
    const img: HistoryItem = { kind: 'image', item: image('img-1') };
    const med: HistoryItem = { kind: 'media', item: asset('med-1', FeatureType.SONG) };

    expect(getHistoryItemId(img)).toBe('img-1');
    expect(getHistoryItemId(med)).toBe('med-1');
    expect(getHistoryItemFeature(img)).toBe(FeatureType.IMAGE);
    expect(getHistoryItemFeature(med)).toBe(FeatureType.SONG);
  });

  it('falls back to an empty id for an unsaved image', () => {
    expect(getHistoryItemId({ kind: 'image', item: {} as IImageObject })).toBe('');
  });

  it('merges images and media newest first, with undated entries last', () => {
    const merged = mergeHistoryItems(
      [image('old', '2025-01-01T10:00:00Z'), image('undated')],
      [asset('new', FeatureType.MUSIC, '2025-03-01T10:00:00Z')],
    );
    expect(merged.map(getHistoryItemId)).toEqual(['new', 'old', 'undated']);
  });

  it('returns an empty list when both sources are empty', () => {
    expect(mergeHistoryItems([], [])).toEqual([]);
  });

  describe('matchesChip', () => {
    const img: HistoryItem = { kind: 'image', item: image('i') };
    const media = (feature: FeatureType): HistoryItem => ({
      kind: 'media',
      item: asset('m', feature),
    });

    it('shows everything under All', () => {
      expect(matchesChip(img, 'all')).toBe(true);
      expect(matchesChip(media(FeatureType.VIDEO), 'all')).toBe(true);
    });

    it('shows only image entries under Images', () => {
      expect(matchesChip(img, 'images')).toBe(true);
      expect(matchesChip(media(FeatureType.SONG), 'images')).toBe(false);
    });

    it.each<[HistoryChip, FeatureType]>([
      ['song', FeatureType.SONG],
      ['music', FeatureType.MUSIC],
      ['speech', FeatureType.SPEECH],
      ['video', FeatureType.VIDEO],
      ['tools', FeatureType.WATERMARK_IMAGE],
      ['tools', FeatureType.WATERMARK_VIDEO],
      ['tools', FeatureType.AUTOCAPTION],
    ])('puts %s chip entries for %s', (chip, feature) => {
      expect(matchesChip(media(feature), chip)).toBe(true);
      expect(matchesChip(img, chip)).toBe(false);
    });

    it('does not show a feature under another media chip', () => {
      expect(matchesChip(media(FeatureType.SONG), 'music')).toBe(false);
      expect(matchesChip(media(FeatureType.VIDEO), 'tools')).toBe(false);
    });
  });

  it('lists every chip once, starting with All', () => {
    expect(HISTORY_CHIPS.map((chip) => chip.id)).toEqual([
      'all',
      'images',
      'song',
      'music',
      'speech',
      'video',
      'tools',
    ]);
  });

  describe('groupHistoryItems', () => {
    it('groups mixed entries by local calendar day, newest group first, keeping the originals', () => {
      const first: HistoryItem = {
        kind: 'image',
        item: image('a', new Date(2025, 0, 15, 12).toISOString()),
      };
      const second: HistoryItem = {
        kind: 'media',
        item: asset('b', FeatureType.SONG, new Date(2025, 0, 15, 9).toISOString()),
      };
      const third: HistoryItem = {
        kind: 'media',
        item: asset('c', FeatureType.MUSIC, new Date(2025, 0, 10, 12).toISOString()),
      };

      const groups = groupHistoryItems([third, second, first]);

      expect(groups.map((group) => group.title)).toEqual([
        'Wednesday, 15 January 2025',
        'Friday, 10 January 2025',
      ]);
      expect(groups[0].data).toEqual([first, second]);
      expect(groups[0].data[1]).toBe(second);
      expect(groups[1].data).toEqual([third]);
      expect(groups.every((group) => group.isDeleting === false)).toBe(true);
    });

    it('collects undated entries under Unknown', () => {
      const undated: HistoryItem = { kind: 'media', item: asset('u', FeatureType.SPEECH) };
      expect(groupHistoryItems([undated])).toEqual([
        { title: 'Unknown', data: [undated], isDeleting: false },
      ]);
    });

    it('returns no groups for no entries', () => {
      expect(groupHistoryItems([])).toEqual([]);
    });
  });
});

type MediaPage = { items: MediaAssetDto[]; nextCursor: string | null };

function mockMediaPages(...pages: Array<MediaPage | 'error' | 'empty'>) {
  const queue = [...pages];
  vi.mocked(useFetch).mockImplementation((() => ({
    json: async () => {
      const next = queue.shift();
      if (next === 'error') return { data: { value: null }, error: { value: new Error('boom') } };
      if (next === 'empty' || next === undefined) {
        return { data: { value: null }, error: { value: null } };
      }
      return { data: { value: next }, error: { value: null } };
    },
  })) as unknown as typeof useFetch);
}

const requestedUrls = () => vi.mocked(useFetch).mock.calls.map(([url]) => String(url));

describe('useHistoryStore media', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(useFetch).mockReset();
  });

  it('starts on the All chip with no media', () => {
    const store = useHistoryStore();
    expect(store.activeChip).toBe('all');
    expect(store.mediaAssets).toEqual([]);
    expect(store.isMediaLoading).toBe(false);
  });

  describe('loadMedia', () => {
    it('follows cursors until the list ends', async () => {
      const store = useHistoryStore();
      mockMediaPages(
        { items: [asset('1', FeatureType.SONG)], nextCursor: 'c1' },
        { items: [asset('2', FeatureType.MUSIC)], nextCursor: null },
      );

      await store.loadMedia();

      expect(store.mediaAssets.map((item) => item.id)).toEqual(['1', '2']);
      expect(requestedUrls()).toEqual([
        '/media/assets?limit=50',
        '/media/assets?limit=50&cursor=c1',
      ]);
      expect(store.isMediaLoading).toBe(false);
    });

    it('ignores a second call while one is in flight', async () => {
      const store = useHistoryStore();
      mockMediaPages({ items: [asset('1', FeatureType.SONG)], nextCursor: null });

      await Promise.all([store.loadMedia(), store.loadMedia()]);

      expect(vi.mocked(useFetch)).toHaveBeenCalledTimes(1);
    });

    it('keeps what already loaded when a later page fails', async () => {
      const store = useHistoryStore();
      mockMediaPages({ items: [asset('1', FeatureType.SONG)], nextCursor: 'c1' }, 'error');

      await store.loadMedia();

      expect(store.mediaAssets.map((item) => item.id)).toEqual(['1']);
      expect(store.isMediaLoading).toBe(false);
    });

    it('does not blank an existing list when the first page fails', async () => {
      const store = useHistoryStore();
      store.mediaAssets = [asset('keep', FeatureType.SONG)];
      mockMediaPages('error');

      await store.loadMedia();

      expect(store.mediaAssets.map((item) => item.id)).toEqual(['keep']);
    });

    it('treats a response without data as a failure', async () => {
      const store = useHistoryStore();
      mockMediaPages('empty');

      await store.loadMedia();

      expect(store.mediaAssets).toEqual([]);
      expect(store.isMediaLoading).toBe(false);
    });

    it('replaces the list with the fresh result when it has items', async () => {
      const store = useHistoryStore();
      store.mediaAssets = [asset('stale', FeatureType.SONG)];
      mockMediaPages({ items: [asset('fresh', FeatureType.MUSIC)], nextCursor: null });

      await store.loadMedia();

      expect(store.mediaAssets.map((item) => item.id)).toEqual(['fresh']);
    });

    // Pins current behaviour: an empty result cannot clear a populated list (see report).
    it('keeps an existing list when the server returns an empty page', async () => {
      const store = useHistoryStore();
      store.mediaAssets = [asset('stale', FeatureType.SONG)];
      mockMediaPages({ items: [], nextCursor: null });

      await store.loadMedia();

      expect(store.mediaAssets.map((item) => item.id)).toEqual(['stale']);
    });

    it('stops after 20 pages even when the cursor never ends', async () => {
      const store = useHistoryStore();
      vi.mocked(useFetch).mockImplementation((() => ({
        json: async () => ({
          data: { value: { items: [], nextCursor: 'again' } },
          error: { value: null },
        }),
      })) as unknown as typeof useFetch);

      await store.loadMedia();

      expect(vi.mocked(useFetch)).toHaveBeenCalledTimes(20);
      expect(store.isMediaLoading).toBe(false);
    });
  });

  describe('deleteMedia', () => {
    const mockDelete = (error: unknown) =>
      vi.mocked(useFetch).mockImplementation((() => ({
        text: async () => ({ error: { value: error } }),
      })) as unknown as typeof useFetch);

    it('removes the asset after the server confirms', async () => {
      const store = useHistoryStore();
      store.mediaAssets = [asset('a', FeatureType.SONG), asset('b/c', FeatureType.MUSIC)];
      mockDelete(null);

      const result = await store.deleteMedia('b/c');

      expect(result).toBe(true);
      expect(store.mediaAssets.map((item) => item.id)).toEqual(['a']);
      expect(vi.mocked(useFetch)).toHaveBeenCalledWith('/media/assets/b%2Fc', { method: 'DELETE' });
    });

    it('keeps the asset and returns false when the server rejects', async () => {
      const store = useHistoryStore();
      store.mediaAssets = [asset('a', FeatureType.SONG)];
      mockDelete(new Error('500'));

      const result = await store.deleteMedia('a');

      expect(result).toBe(false);
      expect(store.mediaAssets.map((item) => item.id)).toEqual(['a']);
    });
  });
});
