import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import {
  installAudioContext,
  installGetUserMedia,
  installMediaRecorder,
} from '@/test/voiceMediaMocks';

const showToast = vi.hoisted(() => vi.fn());
const getToken = vi.hoisted(() => vi.fn().mockResolvedValue('token'));
const route = vi.hoisted(() => ({ fullPath: '/create/image' }));

vi.mock('@/composables/useShareActions', () => ({
  useShareActions: () => ({ showToast }),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ getToken }),
}));

vi.mock('vue-router', () => ({
  useRoute: () => route,
}));

import {
  useVoiceInput,
  useVoiceInputContext,
  provideVoiceInput,
} from '@/composables/useVoiceInput';
import { useAsideStore } from '@/stores/aside';
import { useGenerateStore } from '@/stores/generate';

function mountVoiceInput() {
  let voice!: ReturnType<typeof useVoiceInput>;
  const wrapper = mount({
    setup() {
      voice = useVoiceInput();
      return {};
    },
    template: '<div />',
  });
  return { voice, wrapper };
}

describe('useVoiceInput', () => {
  let media: ReturnType<typeof installMediaRecorder>;

  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.stubEnv('VITE_API_BASEPATH', 'https://api.test');
    route.fullPath = '/create/image';
    installGetUserMedia();
    media = installMediaRecorder({ webmSupported: true, mp4Supported: true });
    installAudioContext();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('appends grok transcript without replacing existing prompt text', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ text: 'added line' }), { status: 200 })),
    );
    const { voice, wrapper } = mountVoiceInput();
    const aside = useAsideStore();
    const generate = useGenerateStore();
    aside.typingPrompt = 'existing';
    generate.promptText = 'existing';

    await voice.startRecording();
    media.last?.emitData(new Blob(['audio'], { type: 'audio/webm' }));
    await voice.stopRecording();
    await vi.runAllTimersAsync();

    expect(aside.typingPrompt).toBe('existing added line');
    expect(generate.promptText).toBe('existing added line');
    wrapper.unmount();
  });

  it('does not toggle while transcribing and updates aria-live status labels', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () => resolve(new Response(JSON.stringify({ text: 'late' }), { status: 200 })),
              5000,
            );
          }),
      ),
    );

    const { voice, wrapper } = mountVoiceInput();
    await voice.startRecording();
    media.last?.emitData(new Blob(['audio'], { type: 'audio/webm' }));
    void voice.stopRecording();

    expect(voice.isTranscribing.value).toBe(true);
    expect(voice.statusLabel.value).toBe('Transcribing');
    voice.toggleRecording();
    expect(voice.isRecording.value).toBe(false);

    vi.advanceTimersByTime(5000);
    await vi.runAllTimersAsync();
    wrapper.unmount();
  });

  it('cancels on tab hidden and route changes while recording', async () => {
    const { voice, wrapper } = mountVoiceInput();
    await voice.startRecording();
    expect(voice.isRecording.value).toBe(true);

    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(voice.isRecording.value).toBe(false);
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });

    await voice.startRecording();
    useAsideStore().mode = { ...useAsideStore().mode, id: 'changed-mode' };
    await nextTick();
    expect(voice.isRecording.value).toBe(false);

    wrapper.unmount();
  });

  it('provideVoiceInput supplies context for injectors', () => {
    let injected: ReturnType<typeof useVoiceInputContext> | undefined;
    mount({
      components: {
        VoiceConsumer: {
          setup() {
            injected = useVoiceInputContext();
            return {};
          },
          template: '<div />',
        },
      },
      setup() {
        provideVoiceInput();
      },
      template: '<VoiceConsumer />',
    });
    expect(injected?.isRecording).toBeDefined();
  });

  it('throws when voice input context is missing', () => {
    expect(() => useVoiceInputContext()).toThrow('voice input context missing');
  });

  it('toggle stops an active recording via stopRecording', async () => {
    const { voice, wrapper } = mountVoiceInput();
    await voice.startRecording();
    expect(voice.isRecording.value).toBe(true);

    voice.toggleRecording();
    await vi.runAllTimersAsync();
    expect(voice.isRecording.value).toBe(false);
    wrapper.unmount();
  });

  it('cancelRecording stops an active session', async () => {
    const { voice, wrapper } = mountVoiceInput();
    await voice.startRecording();
    voice.cancelRecording();
    expect(voice.isRecording.value).toBe(false);
    wrapper.unmount();
  });

  it('startRecording marks the session as recording when idle', async () => {
    const { voice, wrapper } = mountVoiceInput();
    await voice.startRecording();
    expect(voice.isRecording.value).toBe(true);
    wrapper.unmount();
  });

  it('skips recording UI when grok fails to start', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')),
      },
    });
    const { voice, wrapper } = mountVoiceInput();
    await voice.startRecording();
    expect(voice.ariaLiveMessage.value).not.toBe('Recording');
    wrapper.unmount();
  });

  it('blocks startRecording while busy', async () => {
    const { voice, wrapper } = mountVoiceInput();
    await voice.startRecording();
    await voice.startRecording();
    expect(voice.isRecording.value).toBe(true);
    wrapper.unmount();
  });
});
