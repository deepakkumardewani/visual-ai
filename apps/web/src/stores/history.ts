import {
  FeatureType,
  getHistoryFullLevel,
  HISTORY_CAP,
  type HistoryFullLevel,
  type IImageObject,
  type MediaAssetDto,
  type MediaAssetListResponse,
} from '@visual-ai/shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { groupByDate } from '@/pages/utils';
import { useUserStore } from '@/stores/user';
import { useFetch } from '@/composables/useFetch';
import { createLogger } from '@/utils/logger';

const log = createLogger('history');

const MEDIA_ASSETS_PATH = '/media/assets';
/** Assets per request; the loader follows cursors until the list ends. */
const MEDIA_PAGE_SIZE = 50;
/** Hard stop so a misbehaving cursor can never loop forever. */
const MEDIA_MAX_PAGES = 20;

export type HistoryChip = 'all' | 'images' | 'song' | 'music' | 'speech' | 'video' | 'tools';

export const HISTORY_CHIPS: ReadonlyArray<{ id: HistoryChip; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'images', label: 'Images' },
  { id: 'song', label: 'Song' },
  { id: 'music', label: 'Music' },
  { id: 'speech', label: 'Speech' },
  { id: 'video', label: 'Video' },
  { id: 'tools', label: 'Tools' },
];

/** Media features each chip shows; sketch results are normal images and sit under Images (G11). */
const CHIP_MEDIA_FEATURES: Record<Exclude<HistoryChip, 'all' | 'images'>, readonly string[]> = {
  song: [FeatureType.SONG],
  music: [FeatureType.MUSIC],
  speech: [FeatureType.SPEECH],
  video: [FeatureType.VIDEO],
  tools: [FeatureType.WATERMARK_IMAGE, FeatureType.WATERMARK_VIDEO, FeatureType.AUTOCAPTION],
};

export type HistoryItem =
  | { kind: 'image'; item: IImageObject }
  | { kind: 'media'; item: MediaAssetDto };

export interface HistoryGroup {
  title: string;
  data: HistoryItem[];
  isDeleting: boolean;
}

export function getHistoryItemId(entry: HistoryItem): string {
  return (entry.kind === 'image' ? entry.item._id : entry.item.id) ?? '';
}

function getHistoryItemTime(entry: HistoryItem): number {
  const createdAt = entry.item.createdAt;
  return createdAt ? new Date(createdAt).getTime() : 0;
}

export function getHistoryItemFeature(entry: HistoryItem): string {
  return entry.kind === 'image' ? entry.item.featureType : entry.item.feature;
}

/** Images and media as one list, newest first. */
export function mergeHistoryItems(
  images: readonly IImageObject[],
  media: readonly MediaAssetDto[],
): HistoryItem[] {
  const entries: HistoryItem[] = [
    ...images.map((item): HistoryItem => ({ kind: 'image', item })),
    ...media.map((item): HistoryItem => ({ kind: 'media', item })),
  ];
  return entries.sort((a, b) => getHistoryItemTime(b) - getHistoryItemTime(a));
}

export function matchesChip(entry: HistoryItem, chip: HistoryChip): boolean {
  if (chip === 'all') return true;
  if (chip === 'images') return entry.kind === 'image';
  return entry.kind === 'media' && CHIP_MEDIA_FEATURES[chip].includes(entry.item.feature);
}

/** Splits out versions whose original is in `entries`; others stay top-level. */
function splitVersions(entries: readonly HistoryItem[]) {
  const versionsByParent = new Map<string, HistoryItem[]>();
  const top: HistoryItem[] = [];
  const ids = new Set(entries.map(getHistoryItemId));
  for (const entry of entries) {
    const parentId = entry.kind === 'media' ? entry.item.parentId : undefined;
    if (!parentId || !ids.has(parentId)) {
      top.push(entry);
      continue;
    }
    versionsByParent.set(parentId, [...(versionsByParent.get(parentId) ?? []), entry]);
  }
  return { top, versionsByParent };
}

/**
 * Reuses groupByDate (which only reads createdAt) so media and images share one set of date
 * headings; shells carry an index key so the original entries are recovered after grouping.
 */
export function groupHistoryItems(entries: readonly HistoryItem[]): HistoryGroup[] {
  // Versions are not dated on their own: they follow their original into its date group, so the
  // date sort cannot separate a song from its edits.
  const { top, versionsByParent } = splitVersions(entries);
  const shells = top.map(
    (entry, index) => ({ _id: String(index), createdAt: entry.item.createdAt }) as IImageObject,
  );
  return groupByDate(shells).map((group) => ({
    title: group.title,
    isDeleting: group.isDeleting,
    data: group.data.flatMap((shell) => {
      const entry = top[Number(shell._id)];
      return [entry, ...(versionsByParent.get(getHistoryItemId(entry)) ?? [])];
    }),
  }));
}

export const useHistoryStore = defineStore('history', () => {
  const selectedSize = ref('medium');
  const searchQuery = ref('');
  const selectedFeatureTypes = ref<string[]>([]);
  const activeChip = ref<HistoryChip>('all');
  const mediaAssets = ref<MediaAssetDto[]>([]);
  const isMediaLoading = ref(false);
  const isBulkDeleting = ref(false);
  const isBulkFavoriting = ref(false);
  const isBulkDownloading = ref(false);

  const userStore = useUserStore();
  const historyCap = computed(() => HISTORY_CAP[userStore.plan]);
  // Only entries with an `_id` are saved server-side; unsaved at-cap results also live in
  // `userStore.history` and must not count toward the cap.
  const savedCount = computed(() => userStore.history.filter((item) => item._id).length);
  // Users over the cap (e.g. downgraded) evaluate as full.
  // Unknown until the user sync finishes, so no note flashes while loading.
  const historyFullLevel = computed<HistoryFullLevel>(() =>
    userStore.isReady ? getHistoryFullLevel(savedCount.value, historyCap.value) : 'none',
  );

  async function fetchMediaPage(cursor: string | null): Promise<MediaAssetListResponse | null> {
    const query = new URLSearchParams({ limit: String(MEDIA_PAGE_SIZE) });
    if (cursor) query.set('cursor', cursor);
    const { data, error } = await useFetch(
      `${MEDIA_ASSETS_PATH}?${query}`,
    ).json<MediaAssetListResponse>();
    if (error.value || !data.value) {
      log.error('loadMedia failed', { error: error.value, cursor });
      return null;
    }
    return data.value;
  }

  async function loadMedia() {
    if (isMediaLoading.value) return;
    isMediaLoading.value = true;
    const loaded: MediaAssetDto[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < MEDIA_MAX_PAGES; page += 1) {
      const response = await fetchMediaPage(cursor);
      if (!response) break;
      loaded.push(...response.items);
      cursor = response.nextCursor;
      if (!cursor) break;
    }
    // A failed page keeps what already loaded instead of blanking the list.
    if (loaded.length > 0 || mediaAssets.value.length === 0) mediaAssets.value = loaded;
    isMediaLoading.value = false;
  }

  /** Adds a freshly created asset (such as a saved version) without refetching the list. */
  function addMediaAsset(asset: MediaAssetDto) {
    mediaAssets.value = [asset, ...mediaAssets.value.filter((item) => item.id !== asset.id)];
  }

  /** Returns true once the server confirmed the delete and the asset left the list. */
  async function deleteMedia(id: string): Promise<boolean> {
    const { error } = await useFetch(`${MEDIA_ASSETS_PATH}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).text();
    if (error.value) {
      log.error('deleteMedia failed', { error: error.value, assetId: id });
      return false;
    }
    mediaAssets.value = mediaAssets.value.filter((asset) => asset.id !== id);
    return true;
  }

  return {
    historyCap,
    savedCount,
    historyFullLevel,
    selectedSize,
    searchQuery,
    selectedFeatureTypes,
    activeChip,
    mediaAssets,
    isMediaLoading,
    isBulkDeleting,
    isBulkFavoriting,
    isBulkDownloading,
    loadMedia,
    addMediaAsset,
    deleteMedia,
  };
});
