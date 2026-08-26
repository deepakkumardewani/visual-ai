import { storeToRefs } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { computed, ref, watch, type Ref } from 'vue';
import { useUser } from 'vue-clerk';

import type { ExploreFeedItem } from '@/types';
import { FeatureType } from '@/types';

import { useAppStore } from '@/stores/app';
import { useDialogStore } from '@/stores/dialog';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';

import { MODEL_IDS } from '@/utils/constants';
import { createLogger } from '@/utils/logger';

/** Credit cost for viewer transform actions (utility models) */
const TRANSFORM_CREDIT_COST = 2;

export type ViewerTransformAction = 'upscale' | 'colorize' | 'remove_bg';

const ACTION_LABELS: Record<ViewerTransformAction, string> = {
  upscale: 'Upscaling',
  colorize: 'Colorizing',
  remove_bg: 'Removing background',
};

const log = createLogger('viewer-transform');

const VIEWER_UPSCALE_DEFAULTS = {
  scale: 2,
  creativity: 0.1,
  prompt: '',
  negativePrompt: '',
  outputFormat: 'jpg',
} as const;

export function useViewerTransform(item: Ref<ExploreFeedItem>) {
  const userStore = useUserStore();
  const dialogStore = useDialogStore();
  const appStore = useAppStore();
  const generateStore = useGenerateStore();
  const { isSignedIn } = useUser();

  const { credits } = storeToRefs(userStore);
  const { progressUrl } = storeToRefs(appStore);
  const { imageData, errMsg, upscaleInProgress, colorizeInProgress, removeBgInProgress } =
    storeToRefs(generateStore);

  const processingAction = ref<ViewerTransformAction | null>(null);
  const originalUrl = ref<string | null>(null);
  const resultUrl = ref<string | null>(null);
  const resultIsTransparent = ref(false);

  const creditCost = TRANSFORM_CREDIT_COST;
  const isProcessing = computed(() => processingAction.value !== null);
  const processingLabel = computed(() =>
    processingAction.value ? `${ACTION_LABELS[processingAction.value]}…` : '',
  );
  const hasResult = computed(() => Boolean(originalUrl.value && resultUrl.value));

  function resetResult() {
    originalUrl.value = null;
    resultUrl.value = null;
    resultIsTransparent.value = false;
  }

  function guardCredits(): boolean {
    if (!isSignedIn.value) {
      dialogStore.showSignup();
      return false;
    }
    if (credits.value < creditCost) {
      dialogStore.showLowCredits();
      return false;
    }
    return true;
  }

  async function fetchItemFile(): Promise<File> {
    const response = await fetch(item.value.imageUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const extension = blob.type.split('/')[1] || 'png';
    return new File([blob], `explore-transform-${item.value.id}.${extension}`, {
      type: blob.type || 'image/png',
    });
  }

  function openProgress(jobId: string, action: ViewerTransformAction) {
    progressUrl.value = `${import.meta.env.VITE_API_BASEPATH}/progress?jobId=${jobId}`;
    if (action === 'upscale') appStore.upscaleOpen();
    if (action === 'colorize') appStore.colorizeOpen();
    if (action === 'remove_bg') appStore.removeBgOpen();
  }

  function featureForAction(action: ViewerTransformAction): string {
    if (action === 'upscale') return FeatureType.UPSCALE;
    if (action === 'colorize') return FeatureType.COLORIZE;
    return FeatureType.REMOVE_BG;
  }

  async function startAction(action: ViewerTransformAction) {
    if (isProcessing.value) return;
    if (!guardCredits()) return;

    processingAction.value = action;
    resetResult();
    originalUrl.value = item.value.imageUrl;

    try {
      const file = await fetchItemFile();
      const jobId = uuidv4();
      openProgress(jobId, action);

      if (action === 'upscale') {
        localStorage.setItem('upscaleInProgress', 'true');
        upscaleInProgress.value = true;
        await generateStore.upscaleImage({
          jobId,
          prompt: VIEWER_UPSCALE_DEFAULTS.prompt,
          negativePrompt: VIEWER_UPSCALE_DEFAULTS.negativePrompt,
          image: file,
          format: file.name.split('.').pop() || 'png',
          creativity: VIEWER_UPSCALE_DEFAULTS.creativity,
          scale: VIEWER_UPSCALE_DEFAULTS.scale,
          outputFormat: VIEWER_UPSCALE_DEFAULTS.outputFormat,
        });
      } else if (action === 'colorize') {
        localStorage.setItem('colorizeInProgress', 'true');
        colorizeInProgress.value = true;
        await generateStore.colorizeImage({
          image: file,
          modelId: MODEL_IDS.COLORIZE_ADVANCED,
          jobId,
        });
      } else {
        localStorage.setItem('remove_bgInProgress', 'true');
        removeBgInProgress.value = true;
        await generateStore.removeBgImage({ image: file, jobId });
      }
    } catch (error) {
      log.error('viewer transform failed to start', { action, error });
      processingAction.value = null;
      resetResult();
      generateStore.setFeatureError(
        featureForAction(action),
        'Sorry, there was an error processing your request. Please try again.',
      );
    }
  }

  watch(imageData, (data) => {
    if (!processingAction.value || !data?.images?.[0]) return;
    const expectedType =
      processingAction.value === 'upscale'
        ? FeatureType.UPSCALE
        : processingAction.value === 'colorize'
          ? FeatureType.COLORIZE
          : FeatureType.REMOVE_BG;
    if (data.featureType && data.featureType !== expectedType) return;
    const enhanced = data.images[0].enhancedImageUrl || data.images[0].aiImageUrl || null;
    if (!enhanced) return;
    resultUrl.value = enhanced;
    resultIsTransparent.value = processingAction.value === 'remove_bg';
    processingAction.value = null;
  });

  watch(
    errMsg,
    (errors) => {
      if (!processingAction.value) return;
      if (errors[featureForAction(processingAction.value)]) {
        processingAction.value = null;
      }
    },
    { deep: true },
  );

  // Clear staged result when browsing to another explore item.
  watch(
    () => item.value.id,
    () => {
      resetResult();
      processingAction.value = null;
    },
  );

  return {
    creditCost,
    isProcessing,
    processingAction,
    processingLabel,
    originalUrl,
    resultUrl,
    hasResult,
    resultIsTransparent,
    startAction,
    resetResult,
  };
}
