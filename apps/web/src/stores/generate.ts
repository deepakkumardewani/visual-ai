import { isEmpty } from 'lodash-es';
import { defineStore, storeToRefs } from 'pinia';

import type { IGenerateResponse, IImage, IImageObject, ImageBody } from '@/types';

import { useUserStore } from '@/stores/user';

import { useLocal } from '@/composables/local';
import { useFetch } from '@/composables/useFetch';

import { MODEL_REGISTRY } from '@visual-ai/shared';
import { createLogger } from '@/utils/logger';

import { useAppStore } from './app';

const log = createLogger('generate');

export const useGenerateStore = defineStore('generate', () => {
  const promptText = ref<string>('');
  /** Prompt of the generation currently in flight — drives the pending row caption. */
  const activePrompt = ref<string>('');
  const isLoading = ref(false);
  const isDeleting = ref(false);
  const isFavoriting = ref(false);
  const images = ref<IImage[]>([]);
  const imageData = ref<IImageObject | null>(null);
  const errMsg = ref<string>('');
  const deletingImageIds = ref<string[]>([]);
  const upscaleInProgress = ref<boolean>(false);
  const colorizeInProgress = ref<boolean>(false);
  const reviveInProgress = ref<boolean>(false);
  const removeBgInProgress = ref<boolean>(false);
  const userStore = useUserStore();
  const appStore = useAppStore();
  const { userId } = storeToRefs(userStore);
  const { setLocal } = useLocal();

  async function generateImage(imgData?: ImageBody) {
    appStore.sendSignal('generate_image');
    isLoading.value = true;
    errMsg.value = '';
    activePrompt.value = imgData?.prompt ?? '';
    images.value = [];

    const url = `/generate/image`;

    const { error } = await useFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        mode: 'cors',
      },
      body: JSON.stringify({
        jobId: imgData?.jobId,
        userId: userId.value,
        // Default model is sourced from MODEL_REGISTRY to keep metadata in sync with the registry
        modelId: imgData?.modelId ?? MODEL_REGISTRY.FLUX_BASIC.replicateId,
        imageType: imgData?.imageType ?? 'horizontal',
        modelName: imgData?.modelName ?? 'Flux Lightning',
        prompt: imgData?.prompt ?? '',
        numOfOutputs: imgData?.noOfOutputs ?? 1,
        outputQuality: imgData?.outputQuality ?? 70,
        aspectRatio: imgData?.aspectRatio ?? '16:9',
        outputFormat: imgData?.outputFormat ?? 'jpg',
      }),
    }).json<IGenerateResponse>();
    if (error.value) {
      log.error('generateImage failed', { error: error.value, jobId: imgData?.jobId });
      isLoading.value = false;
      appStore.closeEventSource('image');
      errMsg.value = 'Sorry, there was an error processing your request. Please try again.';
    }
  }

  async function upscaleImage(imgData: any) {
    appStore.sendSignal('upscale_image');
    images.value = [];

    const url = `/generate/upscale/image`;
    const { prompt, image, format, creativity, scale, negativePrompt, jobId, outputFormat } =
      imgData;
    const formData = new FormData();
    formData.append('feature', 'upscale');
    formData.append('prompt', prompt);
    formData.append('negativePrompt', negativePrompt);
    formData.append('userId', userId.value);
    formData.append('creativity', creativity);
    formData.append('scale', scale);
    formData.append('format', format);
    formData.append('image', image);
    formData.append('jobId', jobId);
    formData.append('outputFormat', outputFormat);
    const { error } = await useFetch(url, {
      method: 'POST',
      body: formData,
    }).json();

    if (error.value) {
      log.error('upscaleImage failed', { error: error.value, jobId });
      if (typeof error.value === 'object' && !isEmpty(error.value)) {
        setLocal('upscaleInProgress', false);
        upscaleInProgress.value = false;
        isLoading.value = false;
        errMsg.value = 'Sorry, there was an error processing your request. Please try again.';
      }
      return;
    }
  }

  async function colorizeImage(data: any) {
    appStore.sendSignal('colorize_image');
    images.value = [];

    const url = `/generate/colorize/image`;
    const { image, modelId, jobId } = data;
    const formData = new FormData();
    formData.append('feature', 'colorize');
    formData.append('userId', userId.value);
    formData.append('modelId', modelId);
    formData.append('image', image);
    if (jobId) formData.append('jobId', jobId);
    const { error } = await useFetch(url, {
      method: 'POST',
      body: formData,
    }).json();

    if (error.value) {
      log.error('colorizeImage failed', { error: error.value, modelId });
      if (typeof error.value === 'object' && !isEmpty(error.value)) {
        setLocal('colorizeInProgress', false);
        colorizeInProgress.value = false;
        isLoading.value = false;
        errMsg.value = 'Sorry, there was an error processing your request. Please try again.';
      }
      return;
    }
  }

  async function removeBgImage(data: { image: File; jobId: string }) {
    appStore.sendSignal('remove_bg_image');
    images.value = [];

    const url = `/generate/remove-bg/image`;
    const formData = new FormData();
    formData.append('feature', 'remove_bg');
    formData.append('userId', userId.value);
    formData.append('image', data.image);
    formData.append('jobId', data.jobId);
    const { error } = await useFetch(url, {
      method: 'POST',
      body: formData,
    }).json();

    if (error.value) {
      log.error('removeBgImage failed', { error: error.value, jobId: data.jobId });
      if (typeof error.value === 'object' && !isEmpty(error.value)) {
        setLocal('removeBgInProgress', false);
        removeBgInProgress.value = false;
        isLoading.value = false;
        errMsg.value = 'Sorry, there was an error processing your request. Please try again.';
      }
      return;
    }
  }

  async function reviveOldImage(data: any) {
    appStore.sendSignal('revive_image');
    images.value = [];

    const { image } = data;
    const formData = new FormData();
    formData.append('userId', userId.value);
    formData.append('feature', 'revive');
    formData.append('image', image);
    const url = `/generate/revive/image`;
    const { error } = await useFetch(url, {
      method: 'POST',
      body: formData,
    }).json();
    if (error.value) {
      log.error('reviveOldImage failed', { error: error.value });
      if (typeof error.value === 'object' && !isEmpty(error.value)) {
        setLocal('reviveInProgress', false);
        reviveInProgress.value = false;
        isLoading.value = false;
        errMsg.value = 'Sorry, there was an error processing your request. Please try again.';
      }
      return;
    }
  }

  watch(isLoading, (newVal) => {
    if (newVal) {
      images.value = [];
    }
  });

  return {
    generateImage,
    upscaleImage,
    colorizeImage,
    removeBgImage,
    reviveOldImage,
    promptText,
    activePrompt,
    isLoading,
    deletingImageIds,
    isDeleting,
    isFavoriting,
    images,
    imageData,
    upscaleInProgress,
    colorizeInProgress,
    reviveInProgress,
    removeBgInProgress,
    errMsg,
  };
});
