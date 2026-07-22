import { defineStore } from 'pinia';

import type { Model } from '@/types/model';

import { MODEL_REGISTRY } from '@visual-ai/shared';

import { ASPECT_RATIOS, IMAGE_FORMATS } from '@/utils/constants';
import { FLUX_MODES } from '@/utils/models';

// Default model on first load — sourced from FLUX_MODES which is derived from MODELS catalog.
// Metadata (tier, pricePerImage) is authoritative from MODEL_REGISTRY; FLUX_MODES carries display fields.
const DEFAULT_REGISTRY_ENTRY = MODEL_REGISTRY.FLUX_BASIC;
const DEFAULT_MODE: Model = {
  ...FLUX_MODES[0],
  tier: DEFAULT_REGISTRY_ENTRY.tier,
  pricePerImage: DEFAULT_REGISTRY_ENTRY.pricePerImage,
};

export const useAsideStore = defineStore('aside', () => {
  const imageFormat = ref<any>(IMAGE_FORMATS[0]);
  const aspectRatio = ref<any>(ASPECT_RATIOS[0]);
  const outputQuality = ref<number>(0);
  const noOfOutputs = ref<number>(1);
  const mode = ref<Model>(DEFAULT_MODE);
  const typingPrompt = ref<string>('');
  return {
    imageFormat,
    aspectRatio,
    outputQuality,
    noOfOutputs,
    mode,
    typingPrompt,
  };
});
