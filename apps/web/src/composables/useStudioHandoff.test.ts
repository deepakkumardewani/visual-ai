import type { MediaAssetDto } from '@visual-ai/shared';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, ref } from 'vue';

import {
  HANDOFF_QUERY_KEY,
  handoffTargetsFor,
  type HandoffTarget,
  useHandoffPreload,
  useStudioHandoff,
} from '@/composables/useStudioHandoff';
import type { UploadedFile } from '@/composables/useToolVideoUpload';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  route: { query: {} as Record<string, unknown> },
  fetchResult: { data: null as unknown, statusCode: 200 },
  upload: vi.fn(),
  uploadStatus: { value: 'idle' },
  uploadError: { value: '' },
}));

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));

vi.mock('@/composables/useFetch', () => ({
  useFetch: vi.fn(() => ({
    json: () =>
      Promise.resolve({
        data: { value: mocks.fetchResult.data },
        statusCode: { value: mocks.fetchResult.statusCode },
      }),
  })),
}));

vi.mock('@/composables/useToolVideoUpload', () => ({
  useToolVideoUpload: () => ({
    upload: mocks.upload,
    status: mocks.uploadStatus,
    error: mocks.uploadError,
  }),
}));

const VIDEO = {
  id: 'v1',
  type: 'video',
  title: 'Clip',
  url: 'https://cdn.test/c.mp4',
} as MediaAssetDto;

function mountPreload() {
  const target = ref<UploadedFile | null>(null);
  let api!: ReturnType<typeof useHandoffPreload>;
  mount(
    defineComponent({
      setup() {
        api = useHandoffPreload({ assetType: 'video', purpose: 'tool-video', target });
        return () => null;
      },
    }),
  );
  return api;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  mocks.route.query = {};
  mocks.fetchResult = { data: VIDEO, statusCode: 200 };
  mocks.uploadStatus.value = 'idle';
  mocks.uploadError.value = '';
  mocks.upload.mockResolvedValue(undefined);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['x'], { type: 'video/mp4' })),
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('handoffTargetsFor', () => {
  it('offers the video studios for a video', () => {
    expect(handoffTargetsFor({ type: 'video' }).map((t) => t.label)).toEqual([
      'Video watermark',
      'Autocaption',
    ]);
  });

  it('offers the image studios for an image', () => {
    expect(handoffTargetsFor({ type: 'image' }).map((t) => t.label)).toEqual([
      'Image watermark',
      'Video image input',
    ]);
  });

  it('offers nothing for audio', () => {
    expect(handoffTargetsFor({ type: 'audio' })).toEqual([]);
  });
});

describe('useStudioHandoff', () => {
  it('opens the target route with the asset id in the query', async () => {
    const target: HandoffTarget = { label: 'X', routeName: 'tools-autocaption' };
    useStudioHandoff().open(target, { id: 'abc' });
    expect(mocks.push).toHaveBeenCalledWith({
      name: 'tools-autocaption',
      query: { [HANDOFF_QUERY_KEY]: 'abc' },
    });
  });
});

describe('useHandoffPreload', () => {
  it('does nothing without an asset param', async () => {
    const api = mountPreload();
    await flush();
    expect(api.status.value).toBe('idle');
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it('loads the asset, uploads it and drops the param', async () => {
    mocks.route.query = { asset: ' v1 ', other: '1' };
    const api = mountPreload();
    await flush();
    expect(mocks.replace).toHaveBeenCalledWith({ query: { asset: undefined, other: '1' } });
    expect(fetch).toHaveBeenCalledWith(VIDEO.url);
    const file = mocks.upload.mock.calls[0]?.[0] as File;
    expect(file.name).toBe('Clip');
    expect(api.status.value).toBe('idle');
  });

  it('uses the first value of a repeated param', async () => {
    mocks.route.query = { asset: ['v1', 'v2'] };
    mountPreload();
    await flush();
    expect(mocks.upload).toHaveBeenCalledTimes(1);
  });

  it('ignores a non-string param', async () => {
    mocks.route.query = { asset: 5 };
    mountPreload();
    await flush();
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it('shows not-found copy for a 404', async () => {
    mocks.route.query = { asset: 'other-users' };
    mocks.fetchResult = { data: null, statusCode: 404 };
    const api = mountPreload();
    await flush();
    expect(api.status.value).toBe('error');
    expect(api.message.value).toBe('That file could not be found. Add one below instead.');
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it('treats a wrong asset type as not found', async () => {
    mocks.route.query = { asset: 'i1' };
    mocks.fetchResult = { data: { ...VIDEO, type: 'image' }, statusCode: 200 };
    const api = mountPreload();
    await flush();
    expect(api.message.value).toBe('That file could not be found. Add one below instead.');
  });

  it('shows the generic failure copy on a server error', async () => {
    mocks.route.query = { asset: 'v1' };
    mocks.fetchResult = { data: null, statusCode: 500 };
    const api = mountPreload();
    await flush();
    expect(api.status.value).toBe('error');
    expect(api.message.value).toBe('We could not load that file. Add one below instead.');
  });

  it('shows the generic failure copy when the file download fails', async () => {
    mocks.route.query = { asset: 'v1' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    const api = mountPreload();
    await flush();
    expect(api.status.value).toBe('error');
    expect(api.message.value).toBe('We could not load that file. Add one below instead.');
  });

  it('surfaces the upload error copy', async () => {
    mocks.route.query = { asset: 'v1' };
    mocks.upload.mockImplementation(async () => {
      mocks.uploadStatus.value = 'error';
      mocks.uploadError.value = 'Videos up to 2 minutes and 100 MB';
    });
    const api = mountPreload();
    await flush();
    expect(api.status.value).toBe('error');
    expect(api.message.value).toBe('Videos up to 2 minutes and 100 MB');
  });

  it('dismiss clears the error', async () => {
    mocks.route.query = { asset: 'v1' };
    mocks.fetchResult = { data: null, statusCode: 404 };
    const api = mountPreload();
    await flush();
    api.dismiss();
    expect(api.status.value).toBe('idle');
    expect(api.message.value).toBe('');
  });
});
