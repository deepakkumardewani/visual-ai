import { createPinia, setActivePinia } from 'pinia';
import type { MaybeRefOrGetter } from 'vue';
import { unref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendSignal = vi.fn();
const closeEventSource = vi.fn();
const imageOpen = vi.fn();
const appStoreState = {
  sendSignal,
  closeEventSource,
  imageOpen,
  progressUrl: '',
  snackbar: false,
  snackbarText: '',
};

vi.mock('vue-clerk', () => ({
  useUser: () => ({ isLoaded: { value: true }, isSignedIn: { value: true } }),
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue('tok') }),
}));

vi.mock('@telemetrydeck/sdk', () => ({
  default: class TelemetryDeck {
    clientUser = '';
    signal = vi.fn();
  },
}));

vi.mock('@/stores/app', () => ({
  useAppStore: () => appStoreState,
}));

vi.mock('@/composables/useFetch', () => ({
  useFetch: vi.fn(),
}));

vi.mock('@/composables/local', () => ({
  useLocal: () => ({
    setLocal: vi.fn(),
    getLocal: vi.fn(),
    removeLocal: vi.fn(),
  }),
}));

import { useFetch } from '@/composables/useFetch';
import { useAsideStore } from '@/stores/aside';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';
import { FeatureType } from '@/types';
import type { ImageBody } from '@/types';

function fetchUrlString(url: MaybeRefOrGetter<string>): string {
  return String(unref(url));
}

function mockFetchJson(errorValue: unknown = null) {
  vi.mocked(useFetch).mockReturnValue({
    json: async () => ({ data: { value: {} }, error: { value: errorValue } }),
  } as unknown as ReturnType<typeof useFetch>);
}

type MockFetchJsonResult = {
  data: { value: unknown };
  error: { value: unknown };
};

function mockFetchByUrl(
  handler: (url: string) => MockFetchJsonResult | Promise<MockFetchJsonResult>,
) {
  vi.mocked(useFetch).mockImplementation(
    (url) =>
      ({
        json: async () => handler(fetchUrlString(url)),
      }) as unknown as ReturnType<typeof useFetch>,
  );
}

const imageBody: ImageBody = {
  jobId: 'job_1',
  modelId: 'FLUX_BASIC',
  modelName: 'Flux Lightning',
  prompt: 'a red fox',
  noOfOutputs: 2,
  outputQuality: 80,
  aspectRatio: '1:1',
  outputFormat: 'png',
  imageType: 'square',
};

describe('useGenerateStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    useUserStore().userId = 'user_1';
    appStoreState.snackbar = false;
    appStoreState.snackbarText = '';
    mockFetchJson(null);
  });

  it('has correct initial state', () => {
    const store = useGenerateStore();
    expect(store.promptText).toBe('');
    expect(store.activePrompt).toBe('');
    expect(store.isLoading).toBe(false);
    expect(store.images).toEqual([]);
    expect(store.imageData).toBeNull();
    expect(store.errMsg).toEqual({});
    expect(store.hasAnyError).toBe(false);
    expect(store.jobStatus).toBeNull();
    expect(store.jobProgress).toBeNull();
    expect(store.styleId).toBe('dynamic');
    expect(store.enhanceMode).toBe('auto');
  });

  it('setFeatureError and clearFeatureError update errMsg', () => {
    const store = useGenerateStore();
    store.setFeatureError(FeatureType.IMAGE, 'failed');
    expect(store.errMsg.image).toBe('failed');
    expect(store.hasAnyError).toBe(true);
    store.clearFeatureError(FeatureType.IMAGE);
    expect(store.errMsg).toEqual({});
    store.clearFeatureError(FeatureType.IMAGE);
    expect(store.errMsg).toEqual({});
  });

  it('updateJobProgress ignores empty or non-finite values', () => {
    const store = useGenerateStore();
    store.updateJobProgress({ status: '', progress: Number.NaN });
    expect(store.jobStatus).toBeNull();
    expect(store.jobProgress).toBeNull();
    store.updateJobProgress({ status: 'processing', progress: 40 });
    expect(store.jobStatus).toBe('processing');
    expect(store.jobProgress).toBe(40);
    store.clearJobProgress();
    expect(store.jobStatus).toBeNull();
    expect(store.jobProgress).toBeNull();
  });

  it('generateImage posts defaults and remembers retry payload', async () => {
    const store = useGenerateStore();
    store.setFeatureError(FeatureType.IMAGE, 'old');
    await store.generateImage(imageBody);
    expect(sendSignal).toHaveBeenCalledWith('generate_image');
    expect(store.activePrompt).toBe('a red fox');
    expect(store.isLoading).toBe(true);
    expect(store.errMsg.image).toBeUndefined();
    const body = JSON.parse(vi.mocked(useFetch).mock.calls[0][1]!.body as string);
    expect(body).toMatchObject({
      jobId: 'job_1',
      userId: 'user_1',
      modelId: 'FLUX_BASIC',
      outputQuality: 80,
      numOfOutputs: 2,
    });
  });

  it('generateImage uses registry defaults when payload fields are omitted', async () => {
    const store = useGenerateStore();
    await store.generateImage();
    const body = JSON.parse(vi.mocked(useFetch).mock.calls[0][1]!.body as string);
    expect(body.modelId).toBe('FLUX_BASIC');
    expect(body.prompt).toBe('');
    expect(body.numOfOutputs).toBe(1);
    expect(body.outputQuality).toBe(70);
    expect(store.activePrompt).toBe('');
    expect(store.retryByFeature.image).toBeUndefined();
  });

  it('generateImage omits outputQuality for models that do not support it', async () => {
    const store = useGenerateStore();
    await store.generateImage({ ...imageBody, modelId: 'FLUX_PRO' });
    const body = JSON.parse(vi.mocked(useFetch).mock.calls[0][1]!.body as string);
    expect(body.outputQuality).toBeUndefined();
  });

  it('generateImage uploads reference images and sends surviving urls', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const aside = useAsideStore();
    aside.addReferenceImage(new File(['a'], 'a.png', { type: 'image/png' }));
    aside.addReferenceImage(new File(['b'], 'b.webp', { type: 'image/webp' }));

    mockFetchByUrl((url) => {
      if (url.includes('reference-images')) {
        aside.removeReferenceImageAt(1);
        return {
          data: { value: { urls: ['https://cdn/a.png', 'https://cdn/b.webp'] } },
          error: { value: null },
        };
      }
      return { data: { value: {} }, error: { value: null } };
    });

    const store = useGenerateStore();
    await store.generateImage(imageBody);

    const refCall = vi
      .mocked(useFetch)
      .mock.calls.find(([path]) => fetchUrlString(path).includes('reference-images'));
    expect(fetchUrlString(refCall?.[0] ?? '')).toBe('/generate/reference-images');
    const form = refCall?.[1]?.body as FormData;
    expect(form.get('feature')).toBe('reference');
    expect(form.get('format')).toBe('png');

    const imageCall = vi.mocked(useFetch).mock.calls.find(([path]) => path === '/generate/image');
    const body = JSON.parse(imageCall?.[1]!.body as string);
    expect(body.referenceImageUrls).toEqual(['https://cdn/a.png']);
  });

  it('generateImage aborts when reference upload returns no urls', async () => {
    useAsideStore().addReferenceImage(new File(['a'], 'photo.jpeg', { type: 'image/jpeg' }));

    mockFetchByUrl((url) => {
      if (url.includes('reference-images')) {
        return { data: { value: { urls: [] } }, error: { value: null } };
      }
      return { data: { value: {} }, error: { value: null } };
    });

    const store = useGenerateStore();
    await store.generateImage(imageBody);

    const refCall = vi
      .mocked(useFetch)
      .mock.calls.find(([path]) => fetchUrlString(path).includes('reference-images'));
    expect(refCall).toBeDefined();
    expect((refCall![1]!.body as FormData).get('format')).toBe('jpg');
    expect(store.errMsg.image).toContain('Could not upload reference images');
    expect(vi.mocked(useFetch).mock.calls.some(([path]) => path === '/generate/image')).toBe(false);
  });

  it('generateImage aborts when reference upload fails', async () => {
    const aside = useAsideStore();
    aside.addReferenceImage(new File(['a'], 'a.png', { type: 'image/png' }));

    mockFetchByUrl((url) => {
      if (url.includes('reference-images')) {
        return { data: { value: null }, error: { value: new Error('upload failed') } };
      }
      return { data: { value: {} }, error: { value: null } };
    });

    const store = useGenerateStore();
    await store.generateImage(imageBody);

    expect(store.isLoading).toBe(false);
    expect(store.errMsg.image).toContain('Could not upload reference images');
    expect(appStoreState.snackbarText).toContain('Could not upload reference images');
    expect(closeEventSource).toHaveBeenCalledWith('image');
    expect(vi.mocked(useFetch).mock.calls.some(([path]) => path === '/generate/image')).toBe(false);
  });

  it('generateImage sets an error and closes the event source on failure', async () => {
    mockFetchJson(new Error('fail'));
    const store = useGenerateStore();
    await store.generateImage(imageBody);
    expect(store.isLoading).toBe(false);
    expect(store.errMsg.image).toContain('Sorry, there was an error');
    expect(closeEventSource).toHaveBeenCalledWith('image');
  });

  it('upscaleImage appends form data and handles object errors', async () => {
    const store = useGenerateStore();
    await store.upscaleImage({
      image: new File(['x'], 'a.png'),
      format: 'png',
      scale: '2',
      jobId: 'job_u',
      outputFormat: 'png',
      model: 'UPSCALE_IMAGE',
    });
    expect(sendSignal).toHaveBeenCalledWith('upscale_image');
    const form = vi.mocked(useFetch).mock.calls[0][1]!.body as FormData;
    expect(form.get('feature')).toBe('upscale');
    expect(form.get('model')).toBe('UPSCALE_IMAGE');

    mockFetchJson({});
    await store.upscaleImage({
      image: new File(['x'], 'a.png'),
      format: 'png',
      scale: '2',
      jobId: 'job_u',
      outputFormat: 'png',
    });
    expect(store.errMsg.upscale).toBeUndefined();

    mockFetchJson({ message: 'fail' });
    await store.upscaleImage({
      image: new File(['x'], 'a.png'),
      format: 'png',
      scale: '2',
      jobId: 'job_u',
      outputFormat: 'png',
    });
    expect(store.upscaleInProgress).toBe(false);
    expect(store.errMsg.upscale).toBeTruthy();

    mockFetchJson('plain failure');
    await store.upscaleImage({
      image: new File(['x'], 'a.png'),
      format: 'png',
      scale: '2',
      jobId: 'job_u2',
      outputFormat: 'png',
    });
    expect(store.errMsg.upscale).toBeUndefined();
  });

  it('colorizeImage, removeBgImage, and reviveOldImage handle success and errors', async () => {
    const store = useGenerateStore();
    const file = new File(['x'], 'a.png');

    await store.colorizeImage({ image: file, modelId: 'COLORIZE', jobId: 'j1' });
    expect(sendSignal).toHaveBeenCalledWith('colorize_image');

    await store.removeBgImage({ image: file, jobId: 'j2' });
    expect(sendSignal).toHaveBeenCalledWith('remove_bg_image');

    await store.reviveOldImage({ image: file });
    expect(sendSignal).toHaveBeenCalledWith('revive_image');

    mockFetchJson({ message: 'fail' });
    await store.colorizeImage({ image: file, modelId: 'COLORIZE' });
    expect(store.errMsg.colorize).toBeTruthy();
    await store.removeBgImage({ image: file, jobId: 'j2' });
    expect(store.errMsg.remove_bg).toBeTruthy();
    await store.reviveOldImage({ image: file });
    expect(store.errMsg.revive).toBeTruthy();

    mockFetchJson('plain failure');
    await store.colorizeImage({ image: file, modelId: 'COLORIZE' });
    expect(store.errMsg.colorize).toBeUndefined();
    await store.removeBgImage({ image: file, jobId: 'j2' });
    expect(store.errMsg.remove_bg).toBeUndefined();
    await store.reviveOldImage({ image: file });
    expect(store.errMsg.revive).toBeUndefined();
  });

  it('retryFailed rebuilds an image payload from the active prompt when none was stored', async () => {
    mockFetchJson(null);
    const store = useGenerateStore();
    const aside = useAsideStore();
    aside.outputQuality = 50;
    store.activePrompt = 'retry me';
    await store.retryFailed(FeatureType.IMAGE);
    const imageCall = vi.mocked(useFetch).mock.calls.find(([path]) => path === '/generate/image');
    const body = JSON.parse(imageCall?.[1]!.body as string);
    expect(body.outputQuality).toBe(100);
    expect(body.prompt).toBe('retry me');
  });

  it('retryFailed prefers typingPrompt and default output quality from the aside store', async () => {
    mockFetchJson(null);
    const store = useGenerateStore();
    const aside = useAsideStore();
    aside.outputQuality = 0;
    store.promptText = 'typed prompt';
    store.activePrompt = '';
    await store.retryFailed(FeatureType.IMAGE);
    await vi.waitUntil(() =>
      vi.mocked(useFetch).mock.calls.some(([path]) => path === '/generate/image'),
    );
    const body = JSON.parse(
      vi.mocked(useFetch).mock.calls.find(([path]) => path === '/generate/image')?.[1]!
        .body as string,
    );
    expect(body.prompt).toBe('typed prompt');
    expect(body.outputQuality).toBe(70);
  });

  it('skips reference urls removed before upload completes or missing in the response', async () => {
    const aside = useAsideStore();
    aside.addReferenceImage(new File(['a'], 'a.png', { type: 'image/png' }));
    aside.addReferenceImage(new File(['b'], 'b.png', { type: 'image/png' }));

    mockFetchByUrl((url) => {
      if (url.includes('reference-images')) {
        return {
          data: { value: { urls: ['https://cdn/a.png', undefined] } },
          error: { value: null },
        };
      }
      return { data: { value: {} }, error: { value: null } };
    });

    await useGenerateStore().generateImage(imageBody);
    const body = JSON.parse(
      vi.mocked(useFetch).mock.calls.find(([path]) => path === '/generate/image')?.[1]!
        .body as string,
    );
    expect(body.referenceImageUrls).toEqual(['https://cdn/a.png']);
  });

  it('uploads references using webp format inference', async () => {
    const aside = useAsideStore();
    aside.clearReferenceImages();
    aside.addReferenceImage(new File(['w'], 'photo.webp', { type: 'image/webp' }));

    mockFetchByUrl((url) => {
      if (url.includes('reference-images')) {
        return { data: { value: { urls: ['https://cdn/w.webp'] } }, error: { value: null } };
      }
      return { data: { value: {} }, error: { value: null } };
    });

    await useGenerateStore().generateImage(imageBody);
    const refCall = vi
      .mocked(useFetch)
      .mock.calls.find(([path]) => fetchUrlString(path).includes('reference-images'));
    expect(refCall).toBeDefined();
    expect((refCall![1]!.body as FormData).get('format')).toBe('webp');
  });

  it('retryFailed no-ops without a payload and retries remembered actions', async () => {
    const store = useGenerateStore();
    await store.retryFailed(FeatureType.IMAGE);
    expect(useFetch).not.toHaveBeenCalled();

    mockFetchJson(null);
    await store.generateImage(imageBody);
    await store.upscaleImage({
      image: new File(['x'], 'a.png'),
      format: 'png',
      scale: '2',
      jobId: 'job_u',
      outputFormat: 'png',
    });
    await store.colorizeImage({ image: new File(['x'], 'a.png'), modelId: 'm', jobId: 'c' });
    await store.removeBgImage({ image: new File(['x'], 'a.png'), jobId: 'r' });
    await store.reviveOldImage({ image: new File(['x'], 'a.png') });

    vi.mocked(useFetch).mockClear();
    await store.retryFailed(FeatureType.IMAGE);
    await store.retryFailed(FeatureType.UPSCALE);
    await store.retryFailed(FeatureType.COLORIZE);
    await store.retryFailed(FeatureType.REMOVE_BG);
    await store.retryFailed(FeatureType.REVIVE);
    expect(useFetch).toHaveBeenCalledTimes(5);

    store.retryByFeature = { image: { action: 'unknown' as never, payload: {} } };
    await store.retryFailed(FeatureType.IMAGE);
  });

  it('clears images whenever isLoading becomes true', async () => {
    const store = useGenerateStore();
    store.images = [{ name: 'old' } as never];
    store.isLoading = true;
    await Promise.resolve();
    expect(store.images).toEqual([]);
  });
});
