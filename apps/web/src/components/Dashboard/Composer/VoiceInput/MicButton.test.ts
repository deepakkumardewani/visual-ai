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
import {
  VOICE_INPUT_DISCLOSURE_BODY,
  VOICE_INPUT_DISCLOSURE_STORAGE_KEY,
  VOICE_INPUT_DISCLOSURE_TITLE,
} from '@/composables/voiceInputDisclosure';

const stubs = {
  AppModal: {
    props: ['open'],
    template:
      '<div v-if="open" data-testid="app-modal"><slot name="title" /><slot /><slot name="actions" /></div>',
  },
  'font-awesome-icon': true,
};

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

function acceptDisclosure() {
  localStorage.setItem(VOICE_INPUT_DISCLOSURE_STORAGE_KEY, '1');
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
    installGetUserMedia();
    media = installMediaRecorder({ webmSupported: true, mp4Supported: true });
    installAudioContext();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('shows blocking disclosure on first mic use', async () => {
    const { wrapper } = mountMic();
    await wrapper.get('[data-testid="voice-mic-button"]').trigger('click');
    expect(wrapper.find('[data-testid="voice-disclosure-accept"]').exists()).toBe(true);
    expect(wrapper.text()).toContain(VOICE_INPUT_DISCLOSURE_TITLE);
    expect(wrapper.text()).toContain(VOICE_INPUT_DISCLOSURE_BODY);
    expect(wrapper.find('[data-testid="voice-waveform"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('starts recording after disclosure is accepted', async () => {
    const { wrapper, voice } = mountMic();
    await wrapper.get('[data-testid="voice-mic-button"]').trigger('click');
    await wrapper.get('[data-testid="voice-disclosure-accept"]').trigger('click');
    await flushPromises();
    expect(localStorage.getItem(VOICE_INPUT_DISCLOSURE_STORAGE_KEY)).toBe('1');
    expect(voice.isRecording.value).toBe(true);
    wrapper.unmount();
  });

  it('shows the waveform while recording', async () => {
    acceptDisclosure();
    const { wrapper, voice } = mountMic();
    await voice.startRecording();
    expect(voice.isRecording.value).toBe(true);
    expect(wrapper.find('[data-testid="voice-waveform"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('shows accept and cancel controls while recording', async () => {
    acceptDisclosure();
    const { wrapper, voice } = mountMic();
    await voice.startRecording();
    expect(wrapper.find('[data-testid="voice-mic-button"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="voice-accept-button"]').attributes('aria-label')).toBe(
      'Stop recording and transcribe',
    );
    expect(wrapper.get('[data-testid="voice-cancel-button"]').attributes('aria-label')).toBe(
      'Cancel voice recording',
    );
    wrapper.unmount();
  });

  it('uses Voice input aria-label when idle', async () => {
    acceptDisclosure();
    const { wrapper } = mountMic();
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

    acceptDisclosure();
    const { wrapper, voice } = mountMic();
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

  it('starts recording from the mic when disclosure accepted', async () => {
    acceptDisclosure();
    const { wrapper, voice } = mountMic();
    const mic = wrapper.get('[data-testid="voice-mic-button"]');
    mic.element.removeAttribute('disabled');
    await mic.trigger('click');
    expect(voice.isRecording.value).toBe(true);
    wrapper.unmount();
  });

  it('accept stops recording and cancel discards without transcribing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ text: 'hello' }), { status: 200 })),
    );

    acceptDisclosure();
    const { wrapper, voice } = mountMic();
    await voice.startRecording();
    media.last?.emitData(new Blob(['audio'], { type: 'audio/webm' }));
    await wrapper.get('[data-testid="voice-accept-button"]').trigger('click');
    await flushPromises();
    expect(voice.isRecording.value).toBe(false);
    expect(fetch).toHaveBeenCalled();

    await voice.startRecording();
    await wrapper.get('[data-testid="voice-cancel-button"]').trigger('click');
    expect(voice.isRecording.value).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('shows inline errors in an alert region', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')),
      },
    });

    acceptDisclosure();
    const { wrapper, voice } = mountMic();
    await voice.startRecording();

    const alert = wrapper.get('[data-testid="voice-inline-error"]');
    expect(alert.attributes('role')).toBe('alert');
    expect(alert.text()).toContain('Microphone access is blocked');
    wrapper.unmount();
  });

  it('cancels recording on Escape while recording', async () => {
    acceptDisclosure();
    const { wrapper, voice } = mountMic();
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

  it('renders aria-live status text from the voice context', async () => {
    acceptDisclosure();
    const { wrapper, voice } = mountMic();
    await voice.startRecording();
    expect(wrapper.find('[aria-live="polite"]').text().length).toBeGreaterThan(0);
    wrapper.unmount();
  });

  it('shows countdown seconds while recording', async () => {
    acceptDisclosure();
    const { wrapper, voice } = mountMic();
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
