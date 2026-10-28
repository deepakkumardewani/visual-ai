import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

import MicButton from '@/components/Dashboard/Composer/VoiceInput/MicButton.vue';
import { provideVoiceInput, type UseVoiceInputReturn } from '@/composables/useVoiceInput';

const stubs = { 'font-awesome-icon': true };

function installSpeechRecognition() {
  class MockSpeechRecognition {
    continuous = false;
    interimResults = false;
    lang = '';
    onresult: ((event: unknown) => void) | null = null;
    onerror: ((event: { error: string }) => void) | null = null;
    onend: (() => void) | null = null;
    start = vi.fn();
    stop = vi.fn(() => {
      this.onend?.();
    });
    abort = vi.fn(() => {
      this.onend?.();
    });
  }
  vi.stubGlobal('SpeechRecognition', MockSpeechRecognition);
  vi.stubGlobal('webkitSpeechRecognition', undefined);
}

function mountMic() {
  let voice!: UseVoiceInputReturn;
  const wrapper = mount(
    {
      components: { MicButton },
      setup() {
        voice = provideVoiceInput();
        return {};
      },
      template: '<MicButton />',
    },
    { global: { stubs } },
  );
  return { wrapper, voice };
}

describe('MicButton', () => {
  let media: ReturnType<typeof installMediaRecorder>;

  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.stubEnv('VITE_API_BASEPATH', 'https://api.test');
    route.fullPath = '/create/image';
    installSpeechRecognition();
    installGetUserMedia();
    media = installMediaRecorder({ webmSupported: true, mp4Supported: true });
    installAudioContext();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('shows the waveform while recording', async () => {
    const { wrapper, voice } = mountMic();
    voice.setEngine('web-speech');
    await voice.startRecording();
    expect(voice.isRecording.value).toBe(true);
    expect(wrapper.find('[data-testid="voice-waveform"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('sets aria-pressed while recording', async () => {
    const { wrapper, voice } = mountMic();
    voice.setEngine('web-speech');
    await voice.startRecording();
    expect(wrapper.get('[data-testid="voice-mic-button"]').attributes('aria-pressed')).toBe('true');
    wrapper.unmount();
  });

  it('uses Voice input aria-label when not transcribing', async () => {
    const { wrapper, voice } = mountMic();
    voice.setEngine('web-speech');
    await voice.startRecording();
    expect(wrapper.get('[data-testid="voice-mic-button"]').attributes('aria-label')).toBe(
      'Voice input',
    );
    wrapper.unmount();
  });

  it('uses transcribing aria-label and disables the mic while transcribing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () => resolve(new Response(JSON.stringify({ text: 'done' }), { status: 200 })),
              5000,
            );
          }),
      ),
    );

    const { wrapper, voice } = mountMic();
    voice.setEngine('grok');
    await voice.startRecording();
    media.last?.emitData(new Blob(['audio'], { type: 'audio/webm' }));
    await voice.stopRecording();
    await flushPromises();

    const mic = wrapper.get('[data-testid="voice-mic-button"]');
    expect(mic.attributes('aria-label')).toBe('Transcribing voice input');
    expect(mic.attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('Transcribing');
    wrapper.unmount();
  });

  it('wires the mic button click to toggleRecording', async () => {
    const { wrapper, voice } = mountMic();
    const mic = wrapper.get('[data-testid="voice-mic-button"]');
    mic.element.removeAttribute('disabled');
    await mic.trigger('click');
    expect(voice.isRecording.value).toBe(true);
    wrapper.unmount();
  });

  it('shows inline errors in an alert region', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')),
      },
    });

    const { wrapper, voice } = mountMic();
    voice.setEngine('web-speech');
    await voice.startRecording();

    const alert = wrapper.get('[data-testid="voice-inline-error"]');
    expect(alert.attributes('role')).toBe('alert');
    expect(alert.text()).toContain('Microphone access is blocked');
    wrapper.unmount();
  });

  it('disables the engine menu while recording', async () => {
    const { wrapper, voice } = mountMic();
    voice.setEngine('web-speech');
    await voice.startRecording();
    const trigger = wrapper.get('[data-testid="voice-engine-menu-trigger"]');
    expect(trigger.attributes('disabled')).toBeDefined();
    wrapper.unmount();
  });

  it('cancels recording on Escape while recording', async () => {
    const { wrapper, voice } = mountMic();
    voice.setEngine('web-speech');
    await voice.startRecording();

    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    const prevented = !window.dispatchEvent(event);
    expect(prevented).toBe(true);
    expect(voice.isRecording.value).toBe(false);
    wrapper.unmount();
  });

  it('ignores Escape when not recording', async () => {
    const { wrapper, voice } = mountMic();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(voice.isRecording.value).toBe(false);
    wrapper.unmount();
  });

  it('forwards engine updates from the menu', async () => {
    const { wrapper, voice } = mountMic();
    await wrapper.get('[data-testid="voice-engine-menu-trigger"]').trigger('click');
    await wrapper.get('[data-testid="voice-engine-grok"]').trigger('click');
    expect(voice.engine.value).toBe('grok');
    wrapper.unmount();
  });

  it('renders aria-live status text from the voice context', async () => {
    const { wrapper, voice } = mountMic();
    voice.setEngine('web-speech');
    await voice.startRecording();
    expect(wrapper.find('[aria-live="polite"]').text().length).toBeGreaterThan(0);
    wrapper.unmount();
  });

  it('shows countdown seconds while recording', async () => {
    const { wrapper, voice } = mountMic();
    voice.setEngine('grok');
    await voice.startRecording();
    vi.advanceTimersByTime(49_000);
    expect(wrapper.find('[data-testid="voice-countdown"]').exists()).toBe(false);
    vi.advanceTimersByTime(5_000);
    await flushPromises();
    expect(wrapper.find('[data-testid="voice-countdown"]').exists()).toBe(true);
    voice.cancelRecording();
    wrapper.unmount();
  });

  it('keeps mic idle affordances when not recording or transcribing', () => {
    const { wrapper } = mountMic();
    const mic = wrapper.get('[data-testid="voice-mic-button"]');
    expect(mic.attributes('aria-label')).toBe('Voice input');
    expect(mic.attributes('aria-pressed')).toBe('false');
    expect(mic.attributes('disabled')).toBeUndefined();
    expect(wrapper.find('[data-testid="voice-waveform"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="voice-inline-error"]').exists()).toBe(false);
    wrapper.unmount();
  });
});
