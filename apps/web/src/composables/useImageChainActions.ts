import { MODEL_REGISTRY, type ModelKey } from '@visual-ai/shared';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from 'vue-clerk';

import type { IImage, IImageObject, ImageBody } from '@/types';
import { FeatureType } from '@/types';

import { useAppStore } from '@/stores/app';
import { useAsideStore } from '@/stores/aside';
import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';

import { useShareActions } from '@/composables/useShareActions';
import { ASPECT_RATIOS } from '@/utils/constants';
import { createFeatureLocation } from '@/utils/dashboardRoutes';
import { getDownloadImageUrl } from '@/utils/helpers';
import { createLogger } from '@/utils/logger';
import { MODELS } from '@/utils/models';

const log = createLogger('image-chain');

const REFERENCE_MODEL_KEYS: ModelKey[] = [
  'NANO_BANANA_2',
  'SEEDREAM_4',
  'GPT_IMAGE_2',
  'GROK_IMAGINE',
];

export type ChainImageSource = IImage | string;

export interface GenerationSettingsSource {
  prompt?: string;
  modelName?: string;
  imageType?: string;
  images?: IImage[];
}

export interface ChainNavigateOptions {
  /** Push dashboard Create tab after applying the action (Explore → Create). */
  navigateToDashboard?: boolean;
}

/**
 * Shared image chaining: use-as-reference, Upscale/Remove BG preload, and
 * “More like this” re-generation. Used by results, history, dialog, and explore.
 */
export function useImageChainActions() {
  const router = useRouter();
  const appStore = useAppStore();
  const asideStore = useAsideStore();
  const dialogStore = useDialogStore();
  const generateStore = useGenerateStore();
  const userStore = useUserStore();
  const { isSignedIn } = useUser();
  const { showToast } = useShareActions();

  const { progressUrl } = storeToRefs(appStore);
  const {
    typingPrompt,
    mode,
    aspectRatio,
    noOfOutputs,
    outputQuality,
    imageFormat,
    supportsImageInput,
  } = storeToRefs(asideStore);
  const { isLoading } = storeToRefs(generateStore);

  function resolveImageUrl(source: ChainImageSource | null | undefined): string {
    if (!source) return '';
    if (typeof source === 'string') return source;
    return getDownloadImageUrl(source);
  }

  async function fetchImageFile(url: string, fileName: string): Promise<File> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image (${response.status})`);
    }
    const blob = await response.blob();
    const ext = blob.type.split('/')[1]?.split('+')[0] || 'jpg';
    return new File([blob], fileName.includes('.') ? fileName : `${fileName}.${ext}`, {
      type: blob.type || 'image/jpeg',
    });
  }

  function pickReferenceCapableModel() {
    if (supportsImageInput.value) return;
    for (const key of REFERENCE_MODEL_KEYS) {
      const model = MODELS.find((m) => m.id === key);
      if (model && MODEL_REGISTRY[key]?.fields?.imageInput) {
        mode.value = model;
        return;
      }
    }
    const fallback = MODELS.find((m) => MODEL_REGISTRY[m.id as ModelKey]?.fields?.imageInput);
    if (fallback) mode.value = fallback;
  }

  function goToCreateFeature(_options?: ChainNavigateOptions) {
    void router.push(createFeatureLocation(FeatureType.IMAGE));
  }

  function applyModelFromName(modelName?: string) {
    if (!modelName?.trim()) return;
    const match = MODELS.find(
      (m) => m.title.toLowerCase() === modelName.trim().toLowerCase() || m.id === modelName,
    );
    if (match) mode.value = match;
  }

  function applyAspectFromItem(item: GenerationSettingsSource) {
    const fromImage = item.images?.[0]?.aspectRatio;
    const ratioTitle = fromImage || undefined;
    if (ratioTitle) {
      const match = ASPECT_RATIOS.find((r) => r.title === ratioTitle);
      if (match) {
        aspectRatio.value = match;
        return;
      }
    }
    if (item.imageType) {
      const byType = ASPECT_RATIOS.find((r) => r.type === item.imageType);
      if (byType) aspectRatio.value = byType;
    }
  }

  function applyGenerationSettings(item: GenerationSettingsSource) {
    const prompt = item.prompt?.trim() ?? '';
    if (prompt) typingPrompt.value = prompt;
    applyModelFromName(item.modelName);
    applyAspectFromItem(item);
  }

  async function useAsReference(
    source: ChainImageSource | null | undefined,
    options?: ChainNavigateOptions & { fileName?: string },
  ) {
    const url = resolveImageUrl(source);
    if (!url) {
      showToast('Nothing to use as reference');
      return false;
    }

    try {
      const file = await fetchImageFile(url, options?.fileName ?? 'reference');
      pickReferenceCapableModel();
      asideStore.setReferenceImage(file);
      goToCreateFeature(options);
      showToast('Reference image added');
      return true;
    } catch (error) {
      log.error('use as reference failed', { error });
      showToast('Could not use as reference');
      return false;
    }
  }

  async function sendToUpscale(
    source: ChainImageSource | null | undefined,
    _options?: ChainNavigateOptions,
  ): Promise<boolean> {
    if (!source) {
      showToast('Nothing to send');
      return false;
    }
    const ok = await asideStore.sendToFeature(source, FeatureType.UPSCALE);
    if (!ok) {
      showToast('Could not open Upscale');
      return false;
    }
    return true;
  }

  async function sendToRemoveBg(
    source: ChainImageSource | null | undefined,
    _options?: ChainNavigateOptions,
  ): Promise<boolean> {
    if (!source) {
      showToast('Nothing to send');
      return false;
    }
    const ok = await asideStore.sendToFeature(source, FeatureType.REMOVE_BG);
    if (!ok) {
      showToast('Could not open Remove background');
      return false;
    }
    return true;
  }

  /**
   * Re-run generation with the item’s prompt/model/settings (falling back to
   * current aside values), respecting auth, credits, and in-progress state.
   */
  async function moreLikeThis(
    item: GenerationSettingsSource | IImageObject | null | undefined,
    options?: ChainNavigateOptions,
  ) {
    if (!item) {
      showToast('Nothing to vary');
      return false;
    }

    applyGenerationSettings(item);
    goToCreateFeature(options);

    const prompt = typingPrompt.value.trim();
    if (!prompt) {
      showToast('No prompt to vary');
      return false;
    }

    if (isLoading.value) {
      showToast('Generation already in progress');
      return false;
    }

    if (!isSignedIn.value) {
      dialogStore.showSignup();
      return false;
    }

    if (!userStore.canAffordOutputs(noOfOutputs.value)) {
      dialogStore.showLowCredits();
      return false;
    }

    const jobId = uuidv4();
    const supportsOutputQuality = Boolean(
      MODEL_REGISTRY[mode.value.id as keyof typeof MODEL_REGISTRY]?.fields.outputQuality,
    );
    const input: ImageBody = {
      jobId,
      modelId: mode.value.id,
      imageType: aspectRatio.value.type,
      modelName: mode.value.title,
      prompt,
      noOfOutputs: noOfOutputs.value,
      ...(supportsOutputQuality ? { outputQuality: outputQuality.value === 0 ? 70 : 100 } : {}),
      aspectRatio: aspectRatio.value.title,
      outputFormat: imageFormat.value.title.toLowerCase(),
    };

    void generateStore.generateImage(input);
    progressUrl.value = `${import.meta.env.VITE_API_BASEPATH}/progress?jobId=${jobId}`;
    appStore.imageOpen();
    showToast('Generating variations…');
    return true;
  }

  return {
    resolveImageUrl,
    useAsReference,
    sendToUpscale,
    sendToRemoveBg,
    applyGenerationSettings,
    moreLikeThis,
  };
}
