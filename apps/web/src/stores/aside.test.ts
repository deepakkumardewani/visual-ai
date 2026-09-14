import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

const routerPush = vi.fn().mockResolvedValue(undefined);

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush }),
}));

vi.mock('vue-clerk', () => ({
  useUser: () => ({ isLoaded: { value: true }, isSignedIn: { value: true } }),
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue('tok') }),
}));

import { useAsideStore } from '@/stores/aside';
import { FeatureType } from '@/types';
import { ASPECT_RATIOS, IMAGE_FORMATS } from '@/utils/constants';
import { MODELS } from '@/utils/models';

describe('useAsideStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('has correct initial defaults', () => {
    const store = useAsideStore();
    expect(store.imageFormat).toEqual(IMAGE_FORMATS[0]);
    expect(store.aspectRatio).toEqual(ASPECT_RATIOS[0]);
    expect(store.outputQuality).toBe(0);
    expect(store.noOfOutputs).toBe(1);
    expect(store.mode.id).toBe('FLUX_BASIC');
    expect(store.upscaleModel.id).toBe('UPSCALE_IMAGE');
    expect(store.typingPrompt).toBe('');
    expect(store.referenceImage).toBeNull();
    expect(store.pendingFeatureImage).toBeNull();
    expect(store.supportsImageInput).toBe(false);
    expect(store.imageInputMax).toBe(1);
    expect(store.selectedModelFields?.outputQuality).toBeTruthy();
    expect(store.selectedUpscaleModelFields).toBeTruthy();
  });

  it('setReferenceImage replaces a previous preview url', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL');
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
    const store = useAsideStore();
    const first = new File(['a'], 'one.png', { type: 'image/png' });
    store.setReferenceImage(first);
    expect(store.referenceImage?.name).toBe('one.png');
    expect(store.referenceImage?.previewUrl).toBe('blob:preview');

    create.mockReturnValue('blob:two');
    store.setReferenceImage(new File(['b'], 'two.jpg', { type: 'image/jpeg' }));
    expect(revoke).toHaveBeenCalledWith('blob:preview');
    expect(store.referenceImage?.name).toBe('two.jpg');
    store.clearReferenceImage();
    expect(store.referenceImage).toBeNull();
    create.mockRestore();
    revoke.mockRestore();
  });

  it('clearReferenceImage is a no-op without a preview', () => {
    const store = useAsideStore();
    store.clearReferenceImage();
    expect(store.referenceImage).toBeNull();
  });

  it('consumePendingFeatureImage returns the file once', () => {
    const store = useAsideStore();
    const file = new File(['x'], 'pending.png', { type: 'image/png' });
    store.pendingFeatureImage = file;
    expect(store.consumePendingFeatureImage()?.name).toBe('pending.png');
    expect(store.pendingFeatureImage).toBeNull();
    expect(store.consumePendingFeatureImage()).toBeNull();
  });

  it('clearPendingFeatureImage drops a staged file', () => {
    const store = useAsideStore();
    store.pendingFeatureImage = new File(['x'], 'pending.png', { type: 'image/png' });
    store.clearPendingFeatureImage();
    expect(store.pendingFeatureImage).toBeNull();
  });

  it('sendToFeature rejects unsupported features and missing urls', async () => {
    const store = useAsideStore();
    expect(await store.sendToFeature('https://cdn.example/a.png', FeatureType.IMAGE as never)).toBe(
      false,
    );
    expect(await store.sendToFeature({} as never, FeatureType.UPSCALE)).toBe(false);
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('sendToFeature returns false when the image fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    const store = useAsideStore();
    expect(await store.sendToFeature('https://cdn.example/a.png', FeatureType.UPSCALE)).toBe(false);
    vi.unstubAllGlobals();
  });

  it('sendToFeature returns false when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const store = useAsideStore();
    expect(await store.sendToFeature('https://cdn.example/a.png', FeatureType.REMOVE_BG)).toBe(
      false,
    );
    vi.unstubAllGlobals();
  });

  it('sendToFeature stages a file after navigating to the feature', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(['img'], { type: 'image/png' }),
      }),
    );
    const store = useAsideStore();
    expect(await store.sendToFeature('https://cdn.example/a.png', FeatureType.UPSCALE)).toBe(true);
    expect(routerPush).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { feature: FeatureType.UPSCALE },
      }),
    );
    expect(store.pendingFeatureImage).toBeInstanceOf(File);
    expect(store.pendingFeatureImage?.name).toBe('from-result.png');
    vi.unstubAllGlobals();
  });

  it('sendToFeature falls back to jpg when the blob type is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(['img'], { type: '' }),
      }),
    );
    const store = useAsideStore();
    expect(await store.sendToFeature('https://cdn.example/a.png', FeatureType.REMOVE_BG)).toBe(
      true,
    );
    expect(store.pendingFeatureImage?.name).toBe('from-result.jpg');
    vi.unstubAllGlobals();
  });

  it('clears a reference image when switching to a model without image input', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:ref');
    const store = useAsideStore();
    const imageModel = MODELS.find((model) => model.id === 'FLUX_2_PRO');
    expect(imageModel).toBeTruthy();
    store.mode = imageModel!;
    await nextTick();
    expect(store.supportsImageInput).toBe(true);
    expect(store.imageInputMax).toBe(8);

    store.setReferenceImage(new File(['a'], 'ref.png', { type: 'image/png' }));
    expect(store.referenceImage).toBeTruthy();

    store.mode = MODELS.find((model) => model.id === 'FLUX_BASIC')!;
    await nextTick();
    expect(store.supportsImageInput).toBe(false);
    expect(store.referenceImage).toBeNull();
  });

  it('selectedModelFields is null for an unknown mode id', () => {
    const store = useAsideStore();
    store.mode = { ...store.mode, id: 'NOT_A_MODEL' };
    expect(store.selectedModelFields).toBeNull();
    expect(store.imageInputMax).toBe(1);
  });
});
