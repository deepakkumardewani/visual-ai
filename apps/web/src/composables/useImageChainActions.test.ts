import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const push = vi.hoisted(() => vi.fn());
const isSignedIn = vi.hoisted(() => ({ value: true }));
const showToast = vi.hoisted(() => vi.fn());

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('vue-clerk', () => ({
  useUser: () => ({ isSignedIn }),
}));

vi.mock('uuid', () => ({
  v4: () => 'job-test-1',
}));

vi.mock('@/composables/useShareActions', () => ({
  useShareActions: () => ({ showToast }),
}));

vi.mock('@/utils/helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/helpers')>();
  return {
    ...actual,
    getDownloadImageUrl: () => 'https://cdn.example/ref.jpg',
  };
});

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

import { useImageChainActions } from '@/composables/useImageChainActions';
import { useAppStore } from '@/stores/app';
import { useAsideStore } from '@/stores/aside';
import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';
import { FeatureType } from '@/types';
import { MODELS } from '@/utils/models';

function setupChain() {
  let result: ReturnType<typeof useImageChainActions>;
  mount({
    setup() {
      result = useImageChainActions();
      return {};
    },
    template: '<div />',
  });
  return result!;
}

describe('useImageChainActions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    isSignedIn.value = true;
    showToast.mockReset();
    push.mockReset();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' }),
      }),
    );
  });

  it('resolves string urls and image objects', () => {
    const chain = setupChain();
    expect(chain.resolveImageUrl(null)).toBe('');
    expect(chain.resolveImageUrl('https://cdn.example/a.png')).toBe('https://cdn.example/a.png');
    expect(chain.resolveImageUrl({} as never)).toBe('https://cdn.example/ref.jpg');
  });

  it('toasts when there is nothing to use as reference', async () => {
    const chain = setupChain();
    await expect(chain.useAsReference(null)).resolves.toBe(false);
    expect(showToast).toHaveBeenCalledWith('Nothing to use as reference');
  });

  it('downloads a reference image and routes to create', async () => {
    const chain = setupChain();
    const aside = useAsideStore();
    const setReferenceImage = vi.spyOn(aside, 'setReferenceImage');

    await expect(chain.useAsReference('https://cdn.example/ref.jpg')).resolves.toBe(true);
    expect(setReferenceImage).toHaveBeenCalled();
    expect(push).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith('Reference image added');
  });

  it('toasts when the reference download fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const chain = setupChain();
    await expect(chain.useAsReference('https://cdn.example/ref.jpg')).resolves.toBe(false);
    expect(showToast).toHaveBeenCalledWith('Could not use as reference');
  });

  it('sends an image to upscale after confirm', async () => {
    const chain = setupChain();
    const dialog = useDialogStore();
    const aside = useAsideStore();
    vi.spyOn(dialog, 'confirmChainAction').mockResolvedValue(true);
    vi.spyOn(aside, 'sendToFeature').mockResolvedValue(true);

    await expect(chain.sendToUpscale('https://cdn.example/ref.jpg')).resolves.toBe(true);
    expect(aside.sendToFeature).toHaveBeenCalledWith(
      'https://cdn.example/ref.jpg',
      FeatureType.UPSCALE,
    );
  });

  it('aborts send-to-feature when the user cancels or the source is missing', async () => {
    const chain = setupChain();
    await expect(chain.sendToRemoveBg(null)).resolves.toBe(false);
    expect(showToast).toHaveBeenCalledWith('Nothing to send');

    const dialog = useDialogStore();
    vi.spyOn(dialog, 'confirmChainAction').mockResolvedValue(false);
    await expect(chain.sendToRemoveBg('https://cdn.example/ref.jpg')).resolves.toBe(false);
  });

  it('applies prompt and model settings from a history item', () => {
    const chain = setupChain();
    const aside = useAsideStore();
    const model = MODELS[0];

    chain.applyGenerationSettings({
      prompt: '  oil painting of rain  ',
      modelName: model.id,
      imageType: 'square',
    });

    expect(aside.typingPrompt).toBe('oil painting of rain');
    expect(aside.mode.id).toBe(model.id);
    expect(aside.aspectRatio.type).toBe('square');
  });

  it('generates variations when credits and auth allow it', async () => {
    const chain = setupChain();
    const dialog = useDialogStore();
    const generate = useGenerateStore();
    const user = useUserStore();
    const app = useAppStore();
    user.credits = 40;
    vi.spyOn(dialog, 'confirmChainAction').mockResolvedValue(true);
    const generateImage = vi.spyOn(generate, 'generateImage').mockResolvedValue(undefined as never);

    await expect(
      chain.moreLikeThis({ prompt: 'a lantern in fog', modelName: MODELS[0].id }),
    ).resolves.toBe(true);

    expect(generateImage).toHaveBeenCalled();
    expect(app.progressUrl).toContain('jobId=job-test-1');
    expect(showToast).toHaveBeenCalledWith('Generating variations…');
  });

  it('blocks more-like-this without a prompt, while loading, unsigned, or broke', async () => {
    const chain = setupChain();
    const dialog = useDialogStore();
    const generate = useGenerateStore();
    const user = useUserStore();
    vi.spyOn(dialog, 'confirmChainAction').mockResolvedValue(true);
    const showSignup = vi.spyOn(dialog, 'showSignup');
    const showLowCredits = vi.spyOn(dialog, 'showLowCredits');

    await expect(chain.moreLikeThis(null)).resolves.toBe(false);

    await expect(chain.moreLikeThis({ prompt: '   ' })).resolves.toBe(false);
    expect(showToast).toHaveBeenCalledWith('No prompt to vary');

    useAsideStore().typingPrompt = 'ready';
    generate.isLoading = true;
    await expect(chain.moreLikeThis({ prompt: 'ready' })).resolves.toBe(false);
    expect(showToast).toHaveBeenCalledWith('Generation already in progress');

    generate.isLoading = false;
    isSignedIn.value = false;
    await expect(chain.moreLikeThis({ prompt: 'ready' })).resolves.toBe(false);
    expect(showSignup).toHaveBeenCalled();

    isSignedIn.value = true;
    user.credits = 0;
    await expect(chain.moreLikeThis({ prompt: 'ready' })).resolves.toBe(false);
    expect(showLowCredits).toHaveBeenCalled();
  });

  it('skips model pick when the current model already accepts image input', async () => {
    const chain = setupChain();
    const aside = useAsideStore();
    const imageInputModel = MODELS.find((model) =>
      ['NANO_BANANA_2', 'SEEDREAM_4', 'GPT_IMAGE_2', 'GROK_IMAGINE'].includes(model.id),
    );
    if (imageInputModel) aside.mode = imageInputModel;
    const modeId = aside.mode.id;

    await chain.useAsReference('https://cdn.example/ref.jpg', { fileName: 'shot.png' });
    expect(aside.mode.id).toBe(modeId);
  });

  it('uses a fallback extension when the blob type is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob([new Uint8Array([1])], { type: '' }),
      }),
    );
    const chain = setupChain();
    const aside = useAsideStore();
    const setReferenceImage = vi.spyOn(aside, 'setReferenceImage');

    await chain.useAsReference('https://cdn.example/ref.jpg');
    const file = setReferenceImage.mock.calls[0]?.[0] as File;
    expect(file.name).toMatch(/reference\.(jpg|jpeg)$/);
  });

  it('toasts when send-to-feature cannot open the tool', async () => {
    const chain = setupChain();
    const dialog = useDialogStore();
    const aside = useAsideStore();
    vi.spyOn(dialog, 'confirmChainAction').mockResolvedValue(true);
    vi.spyOn(aside, 'sendToFeature').mockResolvedValue(false);

    await expect(chain.sendToUpscale(null)).resolves.toBe(false);
    expect(showToast).toHaveBeenCalledWith('Nothing to send');

    await expect(chain.sendToUpscale('https://cdn.example/ref.jpg')).resolves.toBe(false);
    expect(showToast).toHaveBeenCalledWith('Could not open Upscale');

    await expect(chain.sendToRemoveBg('https://cdn.example/ref.jpg')).resolves.toBe(false);
    expect(showToast).toHaveBeenCalledWith('Could not open Remove background');
  });

  it('sends to remove-bg after confirm', async () => {
    const chain = setupChain();
    const dialog = useDialogStore();
    const aside = useAsideStore();
    vi.spyOn(dialog, 'confirmChainAction').mockResolvedValue(true);
    vi.spyOn(aside, 'sendToFeature').mockResolvedValue(true);

    await expect(chain.sendToRemoveBg('https://cdn.example/ref.jpg')).resolves.toBe(true);
    expect(aside.sendToFeature).toHaveBeenCalledWith(
      'https://cdn.example/ref.jpg',
      FeatureType.REMOVE_BG,
    );
  });

  it('applies aspect from the first image and ignores unknown model names', () => {
    const chain = setupChain();
    const aside = useAsideStore();
    const previousMode = aside.mode.id;

    chain.applyGenerationSettings({
      prompt: '   ',
      modelName: '   ',
      images: [{ aspectRatio: '16:9' } as never],
    });
    expect(aside.typingPrompt).toBe('');
    expect(aside.mode.id).toBe(previousMode);
    expect(aside.aspectRatio.title).toBe('16:9');

    chain.applyGenerationSettings({
      modelName: 'not-a-real-model',
      images: [{ aspectRatio: 'not-a-ratio' } as never],
      imageType: 'unknown-type',
    });
    expect(aside.aspectRatio.title).toBe('16:9');

    chain.applyGenerationSettings({
      modelName: MODELS[0].title,
      imageType: 'horizontal',
    });
    expect(aside.mode.id).toBe(MODELS[0].id);
    expect(aside.aspectRatio.type).toBe('horizontal');
  });

  it('includes output quality only when the selected model supports it', async () => {
    const chain = setupChain();
    const dialog = useDialogStore();
    const generate = useGenerateStore();
    const user = useUserStore();
    user.credits = 40;
    vi.spyOn(dialog, 'confirmChainAction').mockResolvedValue(true);
    const generateImage = vi.spyOn(generate, 'generateImage').mockResolvedValue(undefined as never);

    useAsideStore().outputQuality = 0;
    await chain.moreLikeThis({ prompt: 'quality draft', modelName: MODELS[0].id });
    const first = generateImage.mock.calls.at(-1)?.[0] as { outputQuality?: number };
    if (first.outputQuality !== undefined) {
      expect(first.outputQuality).toBe(70);
    }

    useAsideStore().outputQuality = 100;
    await chain.moreLikeThis({ prompt: 'quality final', modelName: MODELS[0].id });
    const second = generateImage.mock.calls.at(-1)?.[0] as { outputQuality?: number };
    if (second.outputQuality !== undefined) {
      expect(second.outputQuality).toBe(100);
    }

    await expect(chain.confirmChainAction({ action: 'upscale', creditCost: 2 })).resolves.toBe(
      true,
    );
  });
});
