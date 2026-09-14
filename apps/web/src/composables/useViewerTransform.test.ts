import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

import type { ExploreFeedItem } from '@/types';
import { FeatureType } from '@/types';

const isSignedIn = vi.hoisted(() => ({ value: true }));

vi.mock('vue-clerk', () => ({
  useUser: () => ({ isSignedIn }),
}));

vi.mock('uuid', () => ({
  v4: () => 'viewer-job-1',
}));

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>();
  return {
    ...actual,
    useEventSource: () => ({
      event: ref(null),
      data: ref(null),
      status: ref('CLOSED'),
      error: ref(null),
      open: vi.fn(),
      close: vi.fn(),
    }),
  };
});

import { useViewerTransform } from '@/composables/useViewerTransform';
import { useAppStore } from '@/stores/app';
import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';

function feedItem(id = 'exp_1'): ExploreFeedItem {
  return {
    id,
    imageUrl: 'https://cdn.example/explore.jpg',
  } as ExploreFeedItem;
}

function setupViewer(item = ref(feedItem())) {
  let result: ReturnType<typeof useViewerTransform>;
  const wrapper = mount({
    setup() {
      result = useViewerTransform(item);
      return {};
    },
    template: '<div />',
  });
  return { viewer: result!, wrapper, item };
}

describe('useViewerTransform', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    isSignedIn.value = true;
    localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob([new Uint8Array([9, 8, 7])], { type: 'image/png' }),
      }),
    );
  });

  it('asks unsigned users to sign up and low-credit users to buy more', async () => {
    const { viewer } = setupViewer();
    const dialog = useDialogStore();
    const showSignup = vi.spyOn(dialog, 'showSignup');
    const showLowCredits = vi.spyOn(dialog, 'showLowCredits');

    isSignedIn.value = false;
    await viewer.startAction('upscale');
    expect(showSignup).toHaveBeenCalled();
    expect(viewer.isProcessing.value).toBe(false);

    isSignedIn.value = true;
    useUserStore().credits = 1;
    await viewer.startAction('colorize');
    expect(showLowCredits).toHaveBeenCalled();
  });

  it('starts an upscale job and records the result when imageData arrives', async () => {
    useUserStore().credits = 20;
    const generate = useGenerateStore();
    const upscaleImage = vi.spyOn(generate, 'upscaleImage').mockResolvedValue(undefined as never);
    const { viewer } = setupViewer();

    await viewer.startAction('upscale');
    await flushPromises();

    expect(viewer.processingLabel.value).toBe('Upscaling…');
    expect(localStorage.getItem('upscaleInProgress')).toBe('true');
    expect(useAppStore().progressUrl).toContain('jobId=viewer-job-1');
    expect(upscaleImage).toHaveBeenCalled();

    generate.imageData = {
      featureType: FeatureType.UPSCALE,
      images: [{ enhancedImageUrl: 'https://cdn.example/up.png' }],
    } as never;
    await nextTick();

    expect(viewer.resultUrl.value).toBe('https://cdn.example/up.png');
    expect(viewer.hasResult.value).toBe(true);
    expect(viewer.isProcessing.value).toBe(false);
    expect(viewer.resultIsTransparent.value).toBe(false);
  });

  it('marks remove-bg results as transparent and clears on item change', async () => {
    useUserStore().credits = 20;
    const generate = useGenerateStore();
    vi.spyOn(generate, 'removeBgImage').mockResolvedValue(undefined as never);
    const item = ref(feedItem('a'));
    const { viewer } = setupViewer(item);

    await viewer.startAction('remove_bg');
    await flushPromises();

    generate.imageData = {
      featureType: FeatureType.REMOVE_BG,
      images: [{ aiImageUrl: 'https://cdn.example/cut.png' }],
    } as never;
    await nextTick();
    expect(viewer.resultIsTransparent.value).toBe(true);

    item.value = feedItem('b');
    await nextTick();
    expect(viewer.hasResult.value).toBe(false);
    expect(viewer.processingAction.value).toBeNull();
  });

  it('resets processing when the fetch fails or the store reports an error', async () => {
    useUserStore().credits = 20;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502 }));
    const generate = useGenerateStore();
    const setFeatureError = vi.spyOn(generate, 'setFeatureError');
    const { viewer } = setupViewer();

    await viewer.startAction('colorize');
    await flushPromises();

    expect(setFeatureError).toHaveBeenCalledWith(
      FeatureType.COLORIZE,
      expect.stringContaining('error processing'),
    );
    expect(viewer.isProcessing.value).toBe(false);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob([new Uint8Array([1])], { type: 'image/png' }),
      }),
    );
    vi.spyOn(generate, 'colorizeImage').mockResolvedValue(undefined as never);
    await viewer.startAction('colorize');
    generate.errMsg = { [FeatureType.COLORIZE]: 'failed' };
    await nextTick();
    expect(viewer.isProcessing.value).toBe(false);
  });

  it('ignores a second start while a job is already processing', async () => {
    useUserStore().credits = 20;
    const generate = useGenerateStore();
    const upscaleImage = vi.spyOn(generate, 'upscaleImage').mockResolvedValue(undefined as never);
    const { viewer } = setupViewer();

    const first = viewer.startAction('upscale');
    await viewer.startAction('colorize');
    await first;
    await flushPromises();

    expect(upscaleImage).toHaveBeenCalledTimes(1);
    expect(viewer.processingLabel.value).toBe('Upscaling…');
  });

  it('starts colorize and ignores imageData that does not match the action', async () => {
    useUserStore().credits = 20;
    const generate = useGenerateStore();
    vi.spyOn(generate, 'colorizeImage').mockResolvedValue(undefined as never);
    const { viewer } = setupViewer();

    expect(viewer.processingLabel.value).toBe('');
    await viewer.startAction('colorize');
    await flushPromises();
    expect(viewer.processingLabel.value).toBe('Colorizing…');

    generate.imageData = {
      featureType: FeatureType.UPSCALE,
      images: [{ enhancedImageUrl: 'https://cdn.example/wrong.png' }],
    } as never;
    await nextTick();
    expect(viewer.resultUrl.value).toBeNull();

    generate.imageData = { featureType: FeatureType.COLORIZE, images: [{}] } as never;
    await nextTick();
    expect(viewer.resultUrl.value).toBeNull();

    generate.imageData = {
      featureType: FeatureType.COLORIZE,
      images: [{ enhancedImageUrl: 'https://cdn.example/color.png' }],
    } as never;
    await nextTick();
    expect(viewer.resultUrl.value).toBe('https://cdn.example/color.png');
  });

  it('ignores imageData when idle or the payload has no images', async () => {
    useUserStore().credits = 20;
    const generate = useGenerateStore();
    const { viewer } = setupViewer();

    generate.imageData = {
      featureType: FeatureType.UPSCALE,
      images: [{ enhancedImageUrl: 'https://cdn.example/late.png' }],
    } as never;
    await nextTick();
    expect(viewer.resultUrl.value).toBeNull();

    vi.spyOn(generate, 'upscaleImage').mockResolvedValue(undefined as never);
    await viewer.startAction('upscale');
    await flushPromises();
    generate.imageData = { featureType: FeatureType.UPSCALE, images: [] } as never;
    await nextTick();
    expect(viewer.resultUrl.value).toBeNull();
    expect(viewer.isProcessing.value).toBe(true);
  });

  it('does not clear processing for errors on a different feature', async () => {
    useUserStore().credits = 20;
    const generate = useGenerateStore();
    vi.spyOn(generate, 'upscaleImage').mockResolvedValue(undefined as never);
    const { viewer } = setupViewer();

    generate.errMsg = { [FeatureType.COLORIZE]: 'stale' };
    await nextTick();

    await viewer.startAction('upscale');
    await flushPromises();
    generate.errMsg = { [FeatureType.COLORIZE]: 'still other' };
    await nextTick();
    expect(viewer.isProcessing.value).toBe(true);
  });
});
