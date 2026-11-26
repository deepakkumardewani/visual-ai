import type { MediaAssetDto, MediaAssetType } from '@visual-ai/shared';
import { onMounted, ref, type Ref } from 'vue';
import { type LocationQuery, useRoute, useRouter } from 'vue-router';

import {
  type UploadedFile,
  useToolVideoUpload,
  type VideoUploadPurpose,
} from '@/composables/useToolVideoUpload';
import { useFetch } from '@/composables/useFetch';
import { APP_SURFACE } from '@/utils/dashboardRoutes';
import { createLogger } from '@/utils/logger';

const log = createLogger('studioHandoff');

/** Query key a handoff sets on the target route: an asset id, never a URL. */
export const HANDOFF_QUERY_KEY = 'asset';

const HTTP_NOT_FOUND = 404;
const NOT_FOUND_COPY = 'That file could not be found. Add one below instead.';
const FAILED_COPY = 'We could not load that file. Add one below instead.';

export interface HandoffTarget {
  label: string;
  routeName: string;
}

/** Which studios accept which asset type; a type with no entry (audio) offers no handoff. */
const HANDOFF_TARGETS: Partial<Record<MediaAssetType, readonly HandoffTarget[]>> = {
  video: [
    { label: 'Video watermark', routeName: APP_SURFACE.TOOLS_VIDEO_WATERMARK },
    { label: 'Autocaption', routeName: APP_SURFACE.TOOLS_AUTOCAPTION },
  ],
  image: [
    { label: 'Image watermark', routeName: APP_SURFACE.TOOLS_IMAGE_WATERMARK },
    { label: 'Video image input', routeName: APP_SURFACE.VIDEO },
  ],
};

/** The studios an asset can be sent to; empty when none apply. */
export function handoffTargetsFor(asset: Pick<MediaAssetDto, 'type'>): readonly HandoffTarget[] {
  return HANDOFF_TARGETS[asset.type] ?? [];
}

/** Opens a target studio with the asset id in the query. */
export function useStudioHandoff() {
  const router = useRouter();

  function open(target: HandoffTarget, asset: Pick<MediaAssetDto, 'id'>) {
    return router.push({ name: target.routeName, query: { [HANDOFF_QUERY_KEY]: asset.id } });
  }

  return { open };
}

function readAssetId(query: LocationQuery): string {
  const raw = query[HANDOFF_QUERY_KEY];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' ? value.trim() : '';
}

export type HandoffStatus = 'idle' | 'loading' | 'error';

interface PreloadOptions {
  /** The asset type this input takes; any other type is treated as not found. */
  assetType: MediaAssetType;
  purpose: VideoUploadPurpose;
  target: Ref<UploadedFile | null>;
}

/**
 * Fills a studio's file input from `?asset=<id>`. The asset is read through the user-scoped
 * assets API, so another user's id looks the same as a missing one and nothing is loaded.
 * The file then goes through the normal upload, so the server validates it like any other.
 */
export function useHandoffPreload({ assetType, purpose, target }: PreloadOptions) {
  const route = useRoute();
  const router = useRouter();
  const status = ref<HandoffStatus>('idle');
  const message = ref('');
  const uploader = useToolVideoUpload(purpose, target);

  function fail(copy: string) {
    status.value = 'error';
    message.value = copy;
  }

  async function fetchAsset(id: string): Promise<MediaAssetDto | null> {
    const { data, statusCode } = await useFetch(
      `/media/assets/${encodeURIComponent(id)}`,
      {},
      { updateDataOnError: true },
    ).json<MediaAssetDto>();
    const code = statusCode.value;
    if (code === HTTP_NOT_FOUND || (code === 200 && data.value?.type !== assetType)) {
      fail(NOT_FOUND_COPY);
      return null;
    }
    if (code !== 200 || !data.value) {
      log.warn('handoff asset load failed', { status: code });
      fail(FAILED_COPY);
      return null;
    }
    return data.value;
  }

  async function load(id: string) {
    status.value = 'loading';
    message.value = '';
    try {
      const asset = await fetchAsset(id);
      if (!asset) return;
      const response = await fetch(asset.url);
      if (!response.ok) throw new Error(`asset download ${response.status}`);
      const blob = await response.blob();
      await uploader.upload(new File([blob], asset.title, { type: blob.type }));
      if (uploader.status.value === 'error') return fail(uploader.error.value);
      status.value = 'idle';
    } catch (error) {
      log.warn('handoff preload failed', { error });
      fail(FAILED_COPY);
    }
  }

  function dismiss() {
    status.value = 'idle';
    message.value = '';
  }

  onMounted(() => {
    const id = readAssetId(route.query ?? {});
    if (!id) return;
    // Drop the param so a reload or Back does not silently reload the same file.
    void router.replace({ query: { ...route.query, [HANDOFF_QUERY_KEY]: undefined } });
    void load(id);
  });

  return { status, message, dismiss };
}
