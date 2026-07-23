import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import type { Model } from '@/types/model';

import { MODEL_REGISTRY, type ModelKey } from '@visual-ai/shared';

import { ASPECT_RATIOS, IMAGE_FORMATS } from '@/utils/constants';
import { FLUX_MODES } from '@/utils/models';

const DEFAULT_REGISTRY_ENTRY = MODEL_REGISTRY.FLUX_BASIC;
const DEFAULT_MODE: Model = {
  ...FLUX_MODES[0],
  tier: DEFAULT_REGISTRY_ENTRY.tier,
  pricePerImage: DEFAULT_REGISTRY_ENTRY.pricePerImage,
};

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
  const typingPrompt = ref<string>('');
  const referenceImage = ref<ReferenceImage | null>(null);

  const selectedModelFields = computed(() => {
    const entry = MODEL_REGISTRY[mode.value.id as ModelKey];
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
    typingPrompt,
    referenceImage,
    supportsImageInput,
    imageInputMax,
    selectedModelFields,
    setReferenceImage,
    clearReferenceImage,
  };
});
