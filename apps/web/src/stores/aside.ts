import { defineStore } from 'pinia';

import type { Model } from '@/types/model';

import { ASPECT_RATIOS, IMAGE_FORMATS } from '@/utils/constants';
import { FLUX_MODES } from '@/utils/models';

export const useAsideStore = defineStore('aside', () => {
  const imageFormat = ref<any>(IMAGE_FORMATS[0]);
  const aspectRatio = ref<any>(ASPECT_RATIOS[0]);
  const outputQuality = ref<number>(0);
  const noOfOutputs = ref<number>(1);
  const mode = ref<Model>(FLUX_MODES[0]);
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
