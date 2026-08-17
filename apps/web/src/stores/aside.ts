import { defineStore } from 'pinia';
import { computed, nextTick, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import type { IImage } from '@/types';
import { FeatureType } from '@/types';
import type { Model } from '@/types/model';

import { MODEL_REGISTRY, type ModelKey } from '@visual-ai/shared';

import { ASPECT_RATIOS, IMAGE_FORMATS } from '@/utils/constants';
import { createFeatureLocation } from '@/utils/dashboardRoutes';
import { getDownloadImageUrl } from '@/utils/helpers';
import { createLogger } from '@/utils/logger';
import { FLUX_MODES, UPSCALER_MODELS } from '@/utils/models';

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
  const referenceImage = ref<ReferenceImage | null>(null);
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

  function clearReferenceImage() {
    if (referenceImage.value?.previewUrl) {
      URL.revokeObjectURL(referenceImage.value.previewUrl);
    }
    referenceImage.value = null;
  }

  function setReferenceImage(file: File) {
    clearReferenceImage();
    referenceImage.value = {
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
    };
  }

  function clearPendingFeatureImage() {
    pendingFeatureImage.value = null;
  }

  function consumePendingFeatureImage(): File | null {
    const file = pendingFeatureImage.value;
    pendingFeatureImage.value = null;
    return file;
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
    const url = typeof image === 'string' ? image : getDownloadImageUrl(image);
    if (!url) {
      log.error('sendToFeature: missing image url', { featureId });
      return false;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image (${response.status})`);
      }
      const blob = await response.blob();
      const ext = blob.type.split('/')[1]?.split('+')[0] || 'jpg';
      const file = new File([blob], `from-result.${ext}`, {
        type: blob.type || 'image/jpeg',
      });

      await router.push(createFeatureLocation(featureId));
      // Wait for the feature aside + ImageUpload to mount before staging the file.
      await nextTick();
      pendingFeatureImage.value = file;
      return true;
    } catch (error) {
      log.error('sendToFeature failed', { featureId, error });
      return false;
    }
  }

  // Drop unused reference when switching to a model that can't consume it
  watch(supportsImageInput, (supported) => {
    if (!supported) clearReferenceImage();
  });

  return {
    imageFormat,
    aspectRatio,
    outputQuality,
    noOfOutputs,
    mode,
    upscaleModel,
    typingPrompt,
    referenceImage,
    pendingFeatureImage,
    supportsImageInput,
    imageInputMax,
    selectedModelFields,
    selectedUpscaleModelFields,
    setReferenceImage,
    clearReferenceImage,
    clearPendingFeatureImage,
    consumePendingFeatureImage,
    sendToFeature,
  };
});
