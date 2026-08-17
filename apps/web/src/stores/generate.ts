import { isEmpty } from 'lodash-es';
import { defineStore, storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useStorage } from '@vueuse/core';

import type { IGenerateResponse, IImage, IImageObject, ImageBody } from '@/types';
import { FeatureType } from '@/types';

import { useUserStore } from '@/stores/user';

import { useLocal } from '@/composables/local';
import { useFetch } from '@/composables/useFetch';

import { MODEL_REGISTRY, type StyleId, type EnhanceMode } from '@visual-ai/shared';
import { createLogger } from '@/utils/logger';

import { useAppStore } from './app';

const log = createLogger('generate');

const GENERIC_ERROR = 'Sorry, there was an error processing your request. Please try again.';

type RetryAction = 'generate' | 'upscale' | 'colorize' | 'remove_bg' | 'revive';

interface RetryEntry {
  action: RetryAction;
  payload: unknown;
}

export const useGenerateStore = defineStore('generate', () => {
  const promptText = ref<string>('');
  /** Prompt of the generation currently in flight — drives the pending row caption. */
  const activePrompt = ref<string>('');
  const isLoading = ref(false);
  const isDeleting = ref(false);
  const isFavoriting = ref(false);
  const images = ref<IImage[]>([]);
  const imageData = ref<IImageObject | null>(null);
  /** Per-feature error messages (replaces a single global errMsg string). */
  const errMsg = ref<Partial<Record<string, string>>>({});
  /** Last request params keyed by feature — used by Retry. */
  const retryByFeature = ref<Partial<Record<string, RetryEntry>>>({});
  /** Real SSE job status string when available (e.g. "processing"). */
  const jobStatus = ref<string | null>(null);
  /** Real SSE progress percent when the API provides it. */
  const jobProgress = ref<number | null>(null);
  const deletingImageIds = ref<string[]>([]);
  const upscaleInProgress = ref<boolean>(false);
  const colorizeInProgress = ref<boolean>(false);
  const reviveInProgress = ref<boolean>(false);
  /** Style preset id (persisted) — t2i only */
  const styleId = useStorage<StyleId>('visual-ai-style-id', 'dynamic');
  /** Enhancement mode (persisted) — t2i only */
  const enhanceMode = useStorage<EnhanceMode>('visual-ai-enhance-mode', 'auto');
  const removeBgInProgress = ref<boolean>(false);
  const userStore = useUserStore();
  const appStore = useAppStore();
  const { userId } = storeToRefs(userStore);
  const { setLocal } = useLocal();

  const hasAnyError = computed(() => Object.keys(errMsg.value).length > 0);

  function clearFeatureError(feature: string) {
    if (!(feature in errMsg.value)) return;
    const next = { ...errMsg.value };
    delete next[feature];
    errMsg.value = next;
  }

  function setFeatureError(feature: string, message: string) {
    errMsg.value = { ...errMsg.value, [feature]: message };
    clearJobProgress();
  }

  function rememberRetry(feature: string, action: RetryAction, payload: unknown) {
    retryByFeature.value = {
      ...retryByFeature.value,
      [feature]: { action, payload },
    };
  }

  function clearJobProgress() {
    jobStatus.value = null;
    jobProgress.value = null;
  }

  function updateJobProgress(data: { status?: string; progress?: number }) {
    if (typeof data.status === 'string' && data.status.length > 0) {
      jobStatus.value = data.status;
    }
    if (typeof data.progress === 'number' && Number.isFinite(data.progress)) {
      jobProgress.value = data.progress;
    }
  }

  async function retryFailed(feature: string) {
    const entry = retryByFeature.value[feature];
    if (!entry) {
      log.error('retryFailed: no retry payload', { feature });
      return;
    }
    clearFeatureError(feature);
    switch (entry.action) {
      case 'generate':
        await generateImage(entry.payload as ImageBody);
        break;
      case 'upscale':
        await upscaleImage(entry.payload);
        break;
      case 'colorize':
        await colorizeImage(entry.payload);
        break;
      case 'remove_bg':
        await removeBgImage(entry.payload as { image: File; jobId: string });
        break;
      case 'revive':
        await reviveOldImage(entry.payload);
        break;
      default:
        log.error('retryFailed: unknown action', { feature, action: entry.action });
    }
  }

  async function generateImage(imgData?: ImageBody) {
    appStore.sendSignal('generate_image');
    isLoading.value = true;
    clearFeatureError(FeatureType.IMAGE);
    clearJobProgress();
    if (imgData) rememberRetry(FeatureType.IMAGE, 'generate', imgData);
    activePrompt.value = imgData?.prompt ?? '';
    images.value = [];

    const url = `/generate/image`;
    const modelId = imgData?.modelId ?? MODEL_REGISTRY.FLUX_BASIC.key;
    const supportsOutputQuality = Boolean(
      MODEL_REGISTRY[modelId as keyof typeof MODEL_REGISTRY]?.fields.outputQuality,
    );

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
        modelId,
        imageType: imgData?.imageType ?? 'horizontal',
        modelName: imgData?.modelName ?? 'Flux Lightning',
        prompt: imgData?.prompt ?? '',
        numOfOutputs: imgData?.noOfOutputs ?? 1,
        ...(supportsOutputQuality ? { outputQuality: imgData?.outputQuality ?? 70 } : {}),
        aspectRatio: imgData?.aspectRatio ?? '16:9',
        outputFormat: imgData?.outputFormat ?? 'jpg',
        styleId: styleId.value,
        enhanceMode: enhanceMode.value,
      }),
    }).json<IGenerateResponse>();
    if (error.value) {
      log.error('generateImage failed', { error: error.value, jobId: imgData?.jobId });
      isLoading.value = false;
      appStore.closeEventSource('image');
      setFeatureError(FeatureType.IMAGE, GENERIC_ERROR);
    }
  }

  async function upscaleImage(imgData: any) {
    appStore.sendSignal('upscale_image');
    images.value = [];
    clearFeatureError(FeatureType.UPSCALE);
    clearJobProgress();
    if (imgData) rememberRetry(FeatureType.UPSCALE, 'upscale', imgData);

    const url = `/generate/upscale/image`;
    const { image, format, scale, jobId, outputFormat, model } = imgData;
    const formData = new FormData();
    formData.append('feature', 'upscale');
    formData.append('userId', userId.value);
    formData.append('scale', scale);
    formData.append('format', format);
    formData.append('image', image);
    formData.append('jobId', jobId);
    formData.append('outputFormat', outputFormat);
    if (model) {
      formData.append('model', model);
    }
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
        setFeatureError(FeatureType.UPSCALE, GENERIC_ERROR);
      }
      return;
    }
  }

  async function colorizeImage(data: any) {
    appStore.sendSignal('colorize_image');
    images.value = [];
    clearFeatureError(FeatureType.COLORIZE);
    clearJobProgress();
    if (data) rememberRetry(FeatureType.COLORIZE, 'colorize', data);

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
        setFeatureError(FeatureType.COLORIZE, GENERIC_ERROR);
      }
      return;
    }
  }

  async function removeBgImage(data: { image: File; jobId: string }) {
    appStore.sendSignal('remove_bg_image');
    images.value = [];
    clearFeatureError(FeatureType.REMOVE_BG);
    clearJobProgress();
    if (data) rememberRetry(FeatureType.REMOVE_BG, 'remove_bg', data);

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
        setFeatureError(FeatureType.REMOVE_BG, GENERIC_ERROR);
      }
      return;
    }
  }

  async function reviveOldImage(data: any) {
    appStore.sendSignal('revive_image');
    images.value = [];
    clearFeatureError(FeatureType.REVIVE);
    clearJobProgress();
    if (data) rememberRetry(FeatureType.REVIVE, 'revive', data);

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
        setFeatureError(FeatureType.REVIVE, GENERIC_ERROR);
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
    clearFeatureError,
    setFeatureError,
    retryFailed,
    updateJobProgress,
    clearJobProgress,
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
    retryByFeature,
    jobStatus,
    jobProgress,
    hasAnyError,
    styleId,
    enhanceMode,
  };
});
