import TelemetryDeck from '@telemetrydeck/sdk';
import { useEventSource, useStorage } from '@vueuse/core';
import { defineStore, storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';

import type { JobStatus } from '@/types';
import { FeatureType } from '@/types';

import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';
import { createLogger } from '@/utils/logger';

const log = createLogger('app');

export interface Feature {
  title: string;
  available: boolean;
  tooltip?: string;
}

export interface Plan {
  title: string;
  price: string;
  description: string;
  features: Feature[];
  isFree: boolean;
}
export const useAppStore = defineStore('app', () => {
  const generateStore = useGenerateStore();
  const userStore = useUserStore();
  const { history, userId } = storeToRefs(userStore);
  const {
    isLoading,
    upscaleInProgress,
    colorizeInProgress,
    reviveInProgress,
    removeBgInProgress,
    images,
    imageData,
  } = storeToRefs(generateStore);
  const feature = ref<string>('');
  const tab = ref(1);
  const isDark = useStorage('visual-ai-theme', true);
  const snackbar = ref(false);
  const snackbarTimeout = ref(2000);
  const snackbarText = ref('');
  const progressUrl = ref('');

  const td = new TelemetryDeck({
    appID: import.meta.env.VITE_TELEMETRYDECK_APP_ID,
    clientUser: '',
  });

  const eventSourceOptions = computed(() => ({
    immediate: false,
    autoReconnect: false,
  }));

  const {
    open: imageOpen,
    close: imageClose,
    data: imgData,
    error: imgError,
  } = useEventSource(progressUrl, [], eventSourceOptions.value);

  const {
    open: upscaleOpen,
    close: upscaleClose,
    data: upscaleData,
    error: upscaleError,
  } = useEventSource(progressUrl, [], eventSourceOptions.value);

  const {
    open: colorizeOpen,
    close: colorizeClose,
    data: colorizeData,
    error: colorizeError,
  } = useEventSource(progressUrl, [], eventSourceOptions.value);

  const {
    open: reviveOpen,
    close: reviveClose,
    data: reviveData,
    error: reviveError,
  } = useEventSource(progressUrl, [], eventSourceOptions.value);

  const {
    open: removeBgOpen,
    close: removeBgClose,
    data: removeBgData,
    error: removeBgError,
  } = useEventSource(progressUrl, [], eventSourceOptions.value);

  function handleEventSourceData(feature: string, data: JobStatus) {
    generateStore.updateJobProgress(data);

    if (data.status === 'processing') {
      localStorage.setItem(`${feature}InProgress`, 'true');
      if (feature === 'upscale') upscaleInProgress.value = true;
      if (feature === 'colorize') colorizeInProgress.value = true;
      if (feature === 'revive') reviveInProgress.value = true;
      if (feature === FeatureType.REMOVE_BG) removeBgInProgress.value = true;

      if (data.image) {
        localStorage.setItem(`${feature}InProgress`, 'false');
        if (feature === FeatureType.IMAGE) isLoading.value = false;
        if (feature === FeatureType.UPSCALE) upscaleInProgress.value = false;
        if (feature === FeatureType.COLORIZE) colorizeInProgress.value = false;
        if (feature === FeatureType.REVIVE) reviveInProgress.value = false;
        if (feature === FeatureType.REMOVE_BG) removeBgInProgress.value = false;
        generateStore.clearJobProgress();

        images.value = data.image.images;
        imageData.value = data.image;
        history.value.push(data.image);
        if (data.userCreditsRemaining !== null && data.userCreditsRemaining !== undefined) {
          userStore.setCredits(data.userCreditsRemaining);
        }
      }
    }

    if (data.status === 'completed') {
      closeEventSource(feature);
      generateStore.clearJobProgress();

      if (data.image) {
        const historyIndex = history.value.findIndex((img) => img._id === data.image?._id);
        if (historyIndex !== -1) {
          history.value[historyIndex] = data.image;
        } else {
          history.value.push(data.image);
        }
        if (feature === FeatureType.IMAGE) {
          images.value = data.image.images;
          imageData.value = data.image;
          isLoading.value = false;
        }
      }
    }

    if (data.status === 'error') {
      closeEventSource(feature);
      localStorage.setItem(`${feature}InProgress`, 'false');
      if (feature === FeatureType.IMAGE) isLoading.value = false;
      if (feature === FeatureType.UPSCALE) upscaleInProgress.value = false;
      if (feature === FeatureType.COLORIZE) colorizeInProgress.value = false;
      if (feature === FeatureType.REVIVE) reviveInProgress.value = false;
      if (feature === FeatureType.REMOVE_BG) removeBgInProgress.value = false;
      generateStore.setFeatureError(
        feature,
        data.message ?? 'Sorry, there was an error processing your request. Please try again.',
      );
    }
  }

  function closeEventSource(feature: string) {
    switch (feature) {
      case FeatureType.IMAGE:
        imageClose();
        break;
      case FeatureType.UPSCALE:
        upscaleClose();
        break;
      case FeatureType.COLORIZE:
        colorizeClose();
        break;
      case FeatureType.REVIVE:
        reviveClose();
        break;
      case FeatureType.REMOVE_BG:
        removeBgClose();
        break;
    }
  }

  function handleEventSourceError(feature: string, error: any) {
    log.error('event source error', { feature, error });
    localStorage.setItem(`${feature}InProgress`, 'false');
    if (feature === FeatureType.IMAGE) {
      isLoading.value = false;
      imageClose();
    }
    if (feature === FeatureType.UPSCALE) {
      upscaleInProgress.value = false;
      upscaleClose();
    }
    if (feature === FeatureType.COLORIZE) {
      colorizeInProgress.value = false;
      colorizeClose();
    }
    if (feature === FeatureType.REVIVE) {
      reviveInProgress.value = false;
      reviveClose();
    }
    if (feature === FeatureType.REMOVE_BG) {
      removeBgInProgress.value = false;
      removeBgClose();
    }
  }

  function setFeature(id: string) {
    feature.value = id;
  }
  function toggleTheme() {
    isDark.value = !isDark.value;
  }

  function sendSignal(signal: string) {
    if (import.meta.env.VITE_TELEMETRYDECK_DEBUG === 'true') {
      void td.signal(`test_${signal}`, { testMode: true });
      return;
    }

    void td.signal(signal);
  }

  watch(userId, async (newUserId) => {
    td.clientUser = newUserId;
    sendSignal('page_view');
  });

  watch(imgData, (newVal) => {
    handleEventSourceData('image', JSON.parse(newVal as string));
  });

  watch(upscaleData, (newVal) => {
    handleEventSourceData('upscale', JSON.parse(newVal as string));
  });

  watch(colorizeData, (newVal) => {
    handleEventSourceData('colorize', JSON.parse(newVal as string));
  });

  watch(reviveData, (newVal) => {
    handleEventSourceData('revive', JSON.parse(newVal as string));
  });

  watch(removeBgData, (newVal) => {
    handleEventSourceData(FeatureType.REMOVE_BG, JSON.parse(newVal as string));
  });

  watch(
    [imgError, upscaleError, colorizeError, reviveError, removeBgError],
    ([imgErr, upErr, colErr, revErr, remErr]) => {
      if (imgErr) handleEventSourceError(FeatureType.IMAGE, imgErr);
      if (upErr) handleEventSourceError(FeatureType.UPSCALE, upErr);
      if (colErr) handleEventSourceError(FeatureType.COLORIZE, colErr);
      if (revErr) handleEventSourceError(FeatureType.REVIVE, revErr);
      if (remErr) handleEventSourceError(FeatureType.REMOVE_BG, remErr);
    },
  );

  watch(
    isDark,
    (newVal) => {
      document.documentElement.classList.toggle('tw-dark', newVal);
    },
    { immediate: true },
  );
  return {
    setFeature,
    toggleTheme,
    closeEventSource,
    upscaleOpen,
    upscaleClose,
    colorizeOpen,
    colorizeClose,
    reviveOpen,
    reviveClose,
    removeBgOpen,
    removeBgClose,
    sendSignal,
    imageOpen,
    imageClose,
    progressUrl,
    isDark,
    tab,
    snackbar,
    snackbarTimeout,
    snackbarText,
    feature,
  };
});
