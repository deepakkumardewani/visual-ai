import { defineStore } from 'pinia';
import { computed, nextTick, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { v4 as uuidv4 } from 'uuid';

import type { IImage } from '@/types';
import { FeatureType } from '@/types';
import type { Model } from '@/types/model';

import { MODEL_REGISTRY, type ModelKey } from '@visual-ai/shared';

import { ASPECT_RATIOS, IMAGE_FORMATS } from '@/utils/constants';
import { createFeatureLocation } from '@/utils/dashboardRoutes';
import { getDownloadImageUrl } from '@/utils/helpers';
import { createLogger } from '@/utils/logger';
import { FLUX_MODES, UPSCALER_MODELS } from '@/utils/models';

import { useAppStore } from '@/stores/app';

const log = createLogger('aside');

/** Features that consume a local ImageUpload file as primary input. */
const IMAGE_INPUT_FEATURES = new Set<string>([FeatureType.UPSCALE, FeatureType.REMOVE_BG]);

const DEFAULT_REGISTRY_ENTRY = MODEL_REGISTRY.FLUX_BASIC;
const DEFAULT_MODE: Model = {
  ...FLUX_MODES[0],
  tier: DEFAULT_REGISTRY_ENTRY.tier,
  pricePerImage: DEFAULT_REGISTRY_ENTRY.pricePerImage,
};

const DEFAULT_UPSCALE_MODEL: Model = UPSCALER_MODELS.find(
  (m) => m.id === MODEL_REGISTRY.UPSCALE_IMAGE.key,
) as Model;

export interface ReferenceImage {
  localId: string;
  file: File;
  previewUrl: string;
  name: string;
}

export const useAsideStore = defineStore('aside', () => {
  const imageFormat = ref<(typeof IMAGE_FORMATS)[number]>(IMAGE_FORMATS[0]);
  const aspectRatio = ref<(typeof ASPECT_RATIOS)[number]>(ASPECT_RATIOS[0]);
  const outputQuality = ref<number>(0);
  const noOfOutputs = ref<number>(1);
  const mode = ref<Model>(DEFAULT_MODE);
  const upscaleModel = ref<Model>(DEFAULT_UPSCALE_MODEL);
  const typingPrompt = ref<string>('');
  const referenceImages = ref<ReferenceImage[]>([]);
  /** Pending file for ImageUpload after sendToFeature switches tools. */
  const pendingFeatureImage = ref<File | null>(null);

  const selectedModelFields = computed(() => {
    const entry = MODEL_REGISTRY[mode.value.id as ModelKey];
    return entry?.fields ?? null;
  });

  const selectedUpscaleModelFields = computed(() => {
    const entry = MODEL_REGISTRY[upscaleModel.value.id as ModelKey];
    return entry?.fields ?? null;
  });

  /** True when the active generate model accepts a reference / edit image. */
  const supportsImageInput = computed(() => Boolean(selectedModelFields.value?.imageInput));

  const imageInputMax = computed(() => selectedModelFields.value?.imageInput?.max ?? 1);

  /** First reference image — kept for PromptBar until multi-thumbnail UI lands in T1.8. */
  const referenceImage = computed(() => referenceImages.value[0] ?? null);

  function revokeReferencePreview(item: ReferenceImage) {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  }

  function clearReferenceImages() {
    for (const item of referenceImages.value) {
      revokeReferencePreview(item);
    }
    referenceImages.value = [];
  }

  function clearReferenceImage() {
    clearReferenceImages();
  }

  function showReferenceToast(message: string) {
    const appStore = useAppStore();
    appStore.snackbarText = message;
    appStore.snackbar = true;
  }

  function removeReferenceImageAt(index: number) {
    const [removed] = referenceImages.value.splice(index, 1);
    if (removed) revokeReferencePreview(removed);
  }

  function addReferenceImage(file: File) {
    referenceImages.value.push({
      localId: uuidv4(),
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
    });
  }

  function setReferenceImage(file: File) {
    clearReferenceImages();
    addReferenceImage(file);
  }

  function trimReferenceImagesForModel(newModelKey: ModelKey) {
    const entry = MODEL_REGISTRY[newModelKey];
    const fields = entry?.fields;
    const count = referenceImages.value.length;
    if (!count) return;

    if (!fields?.imageInput) {
      clearReferenceImages();
      showReferenceToast('Reference images were removed because this model does not support them.');
      return;
    }

    const max = fields.imageInput.max ?? 1;
    if (max < count) {
      const removed = referenceImages.value.splice(max);
      for (const item of removed) revokeReferencePreview(item);
      showReferenceToast(
        `Removed ${removed.length} reference image${removed.length === 1 ? '' : 's'} — this model accepts up to ${max}.`,
      );
    }
  }

  function clearPendingFeatureImage() {
    pendingFeatureImage.value = null;
  }

  function consumePendingFeatureImage(): File | null {
    const file = pendingFeatureImage.value;
    pendingFeatureImage.value = null;
    return file;
  }

  function resolveFeatureImageUrl(image: IImage | string): string {
    if (typeof image === 'string') return image;
    return (
      image.aiImageUrl ??
      getDownloadImageUrl(image as IImage) ??
      image.enhancedImageUrl ??
      image.originalImageUrl ??
      ''
    );
  }

  /** Fetch a result/history image URL and stage it for ImageUpload on the current feature. */
  async function stagePendingFeatureImageFromUrl(url: string): Promise<boolean> {
    if (!url) return false;

    try {
      const fetchUrl = url.startsWith('/') ? `${window.location.origin}${url}` : url;
      const response = await fetch(fetchUrl, { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) {
        throw new Error(`Failed to fetch image (${response.status})`);
      }
      const blob = await response.blob();
      const ext = blob.type.split('/')[1]?.split('+')[0] || 'jpg';
      pendingFeatureImage.value = new File([blob], `from-result.${ext}`, {
        type: blob.type || 'image/jpeg',
      });
      await nextTick();
      return true;
    } catch (error) {
      log.error('stagePendingFeatureImageFromUrl failed', { error, url });
      return false;
    }
  }

  /**
   * Switch to Upscale / Remove BG and preload the generated image into ImageUpload.
   * ImageUpload consumes `pendingFeatureImage` on mount / watch.
   */
  async function sendToFeature(
    image: IImage | string,
    featureId: typeof FeatureType.UPSCALE | typeof FeatureType.REMOVE_BG,
  ): Promise<boolean> {
    if (!IMAGE_INPUT_FEATURES.has(featureId)) {
      log.error('sendToFeature: unsupported feature', { featureId });
      return false;
    }

    const router = useRouter();
    const url = resolveFeatureImageUrl(image);
    if (!url) {
      log.error('sendToFeature: missing image url', { featureId });
      return false;
    }

    await router.push(createFeatureLocation(featureId));
    await nextTick();
    return stagePendingFeatureImageFromUrl(url);
  }

  watch(
    () => mode.value.id,
    (newId, oldId) => {
      if (!oldId || newId === oldId) return;
      trimReferenceImagesForModel(newId as ModelKey);
    },
  );

  return {
    imageFormat,
    aspectRatio,
    outputQuality,
    noOfOutputs,
    mode,
    upscaleModel,
    typingPrompt,
    referenceImages,
    referenceImage,
    pendingFeatureImage,
    supportsImageInput,
    imageInputMax,
    selectedModelFields,
    selectedUpscaleModelFields,
    addReferenceImage,
    removeReferenceImageAt,
    setReferenceImage,
    clearReferenceImage,
    clearReferenceImages,
    clearPendingFeatureImage,
    consumePendingFeatureImage,
    sendToFeature,
    stagePendingFeatureImageFromUrl,
    resolveFeatureImageUrl,
  };
});
