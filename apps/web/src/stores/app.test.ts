import { flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const tdSignal = vi.hoisted(() => vi.fn());

const eventSources = vi.hoisted(() => {
  const make = () => ({
    open: vi.fn(),
    close: vi.fn(),
    data: { value: null as string | null },
    error: { value: null as unknown },
  });
  return {
    image: make(),
    upscale: make(),
    colorize: make(),
    revive: make(),
    removeBg: make(),
    call: 0,
  };
});

vi.mock('@telemetrydeck/sdk', () => ({
  default: class TelemetryDeck {
    clientUser = '';
    signal = tdSignal;
  },
}));

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>();
  return {
    ...actual,
    useEventSource: () => {
      const keys = ['image', 'upscale', 'colorize', 'revive', 'removeBg'] as const;
      const key = keys[eventSources.call % 5];
      eventSources.call += 1;
      return eventSources[key];
    },
  };
});

vi.mock('vue-clerk', () => ({
  useUser: () => ({ isLoaded: { value: true }, isSignedIn: { value: true } }),
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue('tok') }),
}));

vi.mock('@/composables/useFetch', () => ({
  useFetch: vi.fn().mockReturnValue({
    json: async () => ({ data: { value: {} }, error: { value: null } }),
  }),
}));

import { useAppStore } from '@/stores/app';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';
import { FeatureType } from '@/types';

const resultImage = {
  _id: 'img_1',
  userId: 'user_1',
  images: [
    {
      name: 'out.png',
      resolution: '1k',
      aspectRatio: '1:1',
      width: 1,
      height: 1,
      format: 'png',
      bytes: 1,
    },
  ],
};

function resetEventSources() {
  eventSources.call = 0;
  for (const key of ['image', 'upscale', 'colorize', 'revive', 'removeBg'] as const) {
    eventSources[key].data = ref<string | null>(null);
    eventSources[key].error = ref<unknown>(null);
    eventSources[key].close.mockClear();
    eventSources[key].open.mockClear();
  }
}

describe('useAppStore', () => {
  beforeEach(() => {
    resetEventSources();
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.classList.remove('tw-dark');
  });

  it('has correct initial UI state', () => {
    const store = useAppStore();
    expect(store.feature).toBe('');
    expect(store.tab).toBe(1);
    expect(store.snackbar).toBe(false);
    expect(store.snackbarTimeout).toBe(2000);
    expect(store.snackbarText).toBe('');
    expect(store.progressUrl).toBe('');
    expect(store.isDark).toBe(true);
  });

  it('setFeature and toggleTheme update state', () => {
    const store = useAppStore();
    store.setFeature('upscale');
    expect(store.feature).toBe('upscale');
    const previous = store.isDark;
    store.toggleTheme();
    expect(store.isDark).toBe(!previous);
  });

  it('applies the dark class when isDark is true', async () => {
    const store = useAppStore();
    store.isDark = true;
    await flushPromises();
    expect(document.documentElement.classList.contains('tw-dark')).toBe(true);
    store.isDark = false;
    await flushPromises();
    expect(document.documentElement.classList.contains('tw-dark')).toBe(false);
  });

  it('sendSignal uses the debug prefix when telemetry debug is on', () => {
    vi.stubEnv('VITE_TELEMETRYDECK_DEBUG', 'true');
    const store = useAppStore();
    store.sendSignal('page_view');
    expect(tdSignal).toHaveBeenCalledWith('test_page_view', { testMode: true });
    vi.unstubAllEnvs();
  });

  it('sendSignal emits the raw name in production mode', () => {
    vi.stubEnv('VITE_TELEMETRYDECK_DEBUG', 'false');
    const store = useAppStore();
    store.sendSignal('generate_image');
    expect(tdSignal).toHaveBeenCalledWith('generate_image');
    vi.unstubAllEnvs();
  });

  it('sends page_view when userId changes', async () => {
    vi.stubEnv('VITE_TELEMETRYDECK_DEBUG', 'false');
    useAppStore();
    const userStore = useUserStore();
    userStore.userId = 'user_99';
    await flushPromises();
    expect(tdSignal).toHaveBeenCalledWith('page_view');
    vi.unstubAllEnvs();
  });

  it('closeEventSource closes the matching stream', () => {
    const store = useAppStore();
    store.closeEventSource(FeatureType.IMAGE);
    store.closeEventSource(FeatureType.UPSCALE);
    store.closeEventSource(FeatureType.COLORIZE);
    store.closeEventSource(FeatureType.REVIVE);
    store.closeEventSource(FeatureType.REMOVE_BG);
    store.closeEventSource('unknown');
    expect(eventSources.image.close).toHaveBeenCalled();
    expect(eventSources.upscale.close).toHaveBeenCalled();
    expect(eventSources.colorize.close).toHaveBeenCalled();
    expect(eventSources.revive.close).toHaveBeenCalled();
    expect(eventSources.removeBg.close).toHaveBeenCalled();
  });

  it('marks transform features in progress while processing without an image', async () => {
    useAppStore();
    const generateStore = useGenerateStore();
    const payload = JSON.stringify({ status: 'processing' });
    eventSources.upscale.data.value = payload;
    eventSources.colorize.data.value = payload;
    eventSources.revive.data.value = payload;
    eventSources.removeBg.data.value = payload;
    await flushPromises();
    expect(generateStore.upscaleInProgress).toBe(true);
    expect(generateStore.colorizeInProgress).toBe(true);
    expect(generateStore.reviveInProgress).toBe(true);
    expect(generateStore.removeBgInProgress).toBe(true);
    expect(localStorage.getItem('upscaleInProgress')).toBe('true');
  });

  it('applies a processing payload that already includes an image', async () => {
    useAppStore();
    const generateStore = useGenerateStore();
    const userStore = useUserStore();
    generateStore.isLoading = true;
    eventSources.image.data.value = JSON.stringify({
      status: 'processing',
      image: resultImage,
      userCreditsRemaining: 9,
    });
    await flushPromises();
    expect(generateStore.isLoading).toBe(false);
    expect(generateStore.images).toEqual(resultImage.images);
    expect(generateStore.imageData).toEqual(resultImage);
    expect(userStore.history).toEqual([resultImage]);
    expect(userStore.credits).toBe(9);
    expect(generateStore.jobStatus).toBeNull();
    expect(localStorage.getItem('imageInProgress')).toBe('false');
  });

  it('does not update credits when remaining is null', async () => {
    useAppStore();
    const userStore = useUserStore();
    userStore.setCredits(4);
    eventSources.image.data.value = JSON.stringify({
      status: 'processing',
      image: resultImage,
      userCreditsRemaining: null,
    });
    await flushPromises();
    expect(userStore.credits).toBe(4);
  });

  it('completes a job by replacing an existing history item', async () => {
    useAppStore();
    const generateStore = useGenerateStore();
    const userStore = useUserStore();
    userStore.history = [{ ...resultImage, images: [] }];
    generateStore.isLoading = true;
    eventSources.image.data.value = JSON.stringify({
      status: 'completed',
      image: resultImage,
    });
    await flushPromises();
    expect(userStore.history).toHaveLength(1);
    expect(userStore.history[0]).toEqual(resultImage);
    expect(generateStore.images).toEqual(resultImage.images);
    expect(generateStore.isLoading).toBe(false);
    expect(eventSources.image.close).toHaveBeenCalled();
  });

  it('completes a job by appending a new history item', async () => {
    useAppStore();
    const userStore = useUserStore();
    eventSources.upscale.data.value = JSON.stringify({
      status: 'completed',
      image: { ...resultImage, _id: 'img_2' },
    });
    await flushPromises();
    expect(userStore.history).toHaveLength(1);
    expect(userStore.history[0]._id).toBe('img_2');
  });

  it('completed payloads without an image still close the stream', async () => {
    useAppStore();
    eventSources.colorize.data.value = JSON.stringify({ status: 'completed' });
    await flushPromises();
    expect(eventSources.colorize.close).toHaveBeenCalled();
  });

  it('error payloads clear progress flags and set feature errors', async () => {
    useAppStore();
    const generateStore = useGenerateStore();
    generateStore.isLoading = true;
    generateStore.upscaleInProgress = true;
    generateStore.colorizeInProgress = true;
    generateStore.reviveInProgress = true;
    generateStore.removeBgInProgress = true;

    eventSources.image.data.value = JSON.stringify({ status: 'error', message: 'bad image' });
    eventSources.upscale.data.value = JSON.stringify({ status: 'error' });
    eventSources.colorize.data.value = JSON.stringify({ status: 'error' });
    eventSources.revive.data.value = JSON.stringify({ status: 'error' });
    eventSources.removeBg.data.value = JSON.stringify({ status: 'error' });
    await flushPromises();

    expect(generateStore.isLoading).toBe(false);
    expect(generateStore.upscaleInProgress).toBe(false);
    expect(generateStore.colorizeInProgress).toBe(false);
    expect(generateStore.reviveInProgress).toBe(false);
    expect(generateStore.removeBgInProgress).toBe(false);
    expect(generateStore.errMsg.image).toBe('bad image');
    expect(generateStore.errMsg.upscale).toContain('Sorry, there was an error');
    expect(localStorage.getItem('imageInProgress')).toBe('false');
  });

  it('event source errors close streams and clear in-progress flags', async () => {
    useAppStore();
    const generateStore = useGenerateStore();
    generateStore.isLoading = true;
    generateStore.upscaleInProgress = true;
    generateStore.colorizeInProgress = true;
    generateStore.reviveInProgress = true;
    generateStore.removeBgInProgress = true;

    eventSources.image.error.value = new Error('img');
    eventSources.upscale.error.value = new Error('up');
    eventSources.colorize.error.value = new Error('col');
    eventSources.revive.error.value = new Error('rev');
    eventSources.removeBg.error.value = new Error('rem');
    await flushPromises();

    expect(generateStore.isLoading).toBe(false);
    expect(generateStore.upscaleInProgress).toBe(false);
    expect(generateStore.colorizeInProgress).toBe(false);
    expect(generateStore.reviveInProgress).toBe(false);
    expect(generateStore.removeBgInProgress).toBe(false);
    expect(eventSources.image.close).toHaveBeenCalled();
    expect(eventSources.upscale.close).toHaveBeenCalled();
    expect(eventSources.colorize.close).toHaveBeenCalled();
    expect(eventSources.revive.close).toHaveBeenCalled();
    expect(eventSources.removeBg.close).toHaveBeenCalled();
  });

  it('clears transform flags when processing already includes an image', async () => {
    useAppStore();
    const generateStore = useGenerateStore();
    for (const [source, feature] of [
      [eventSources.upscale, FeatureType.UPSCALE],
      [eventSources.colorize, FeatureType.COLORIZE],
      [eventSources.revive, FeatureType.REVIVE],
      [eventSources.removeBg, FeatureType.REMOVE_BG],
    ] as const) {
      generateStore.upscaleInProgress = false;
      source.data.value = JSON.stringify({
        status: 'processing',
        image: { ...resultImage, _id: feature },
      });
      await flushPromises();
      expect(localStorage.getItem(`${feature}InProgress`)).toBe('false');
    }
    expect(generateStore.upscaleInProgress).toBe(false);
    expect(generateStore.colorizeInProgress).toBe(false);
    expect(generateStore.reviveInProgress).toBe(false);
    expect(generateStore.removeBgInProgress).toBe(false);
  });
});
