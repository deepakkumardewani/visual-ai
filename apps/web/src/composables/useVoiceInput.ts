import { STT_MAX_CLIP_SECONDS } from '@visual-ai/shared';
import { storeToRefs } from 'pinia';
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  watch,
  type InjectionKey,
} from 'vue';
import { useRoute } from 'vue-router';

import { useAudioLevel } from '@/composables/useAudioLevel';
import { grokErrorMessage, useGrokRecorder } from '@/composables/useGrokRecorder';
import { getSpeechRecognitionConstructor, useWebSpeech } from '@/composables/useWebSpeech';
import { useShareActions } from '@/composables/useShareActions';
import { appendPromptText } from '@/composables/useGrokRecorder';
import { useAsideStore } from '@/stores/aside';
import { useGenerateStore } from '@/stores/generate';

export type VoiceEngine = 'web-speech' | 'grok';

const ENGINE_STORAGE_KEY = 'visual-ai-voice-engine';

export type UseVoiceInputReturn = ReturnType<typeof useVoiceInput>;

export const voiceInputKey: InjectionKey<UseVoiceInputReturn> = Symbol('voiceInput');

function readStoredEngine(): VoiceEngine | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const value = window.localStorage.getItem(ENGINE_STORAGE_KEY);
    if (value === 'web-speech' || value === 'grok') {
      return value;
    }
  } catch {
    // SSR or private mode
  }
  return null;
}

function writeStoredEngine(engine: VoiceEngine) {
  try {
    window.localStorage.setItem(ENGINE_STORAGE_KEY, engine);
  } catch {
    // ignore
  }
}

function defaultEngine(): VoiceEngine {
  return getSpeechRecognitionConstructor() ? 'web-speech' : 'grok';
}

export function useVoiceInput() {
  const asideStore = useAsideStore();
  const generateStore = useGenerateStore();
  const { typingPrompt } = storeToRefs(asideStore);
  const { promptText } = storeToRefs(generateStore);
  const { mode } = storeToRefs(asideStore);
  const route = useRoute();
  const { showToast } = useShareActions();

  const engine = ref<VoiceEngine>(readStoredEngine() ?? defaultEngine());
  const countdownSeconds = ref<number | null>(null);
  const inlineError = ref('');
  const ariaLiveMessage = ref('');

  const webSpeechSupported = Boolean(getSpeechRecognitionConstructor());

  const audioLevel = useAudioLevel();

  function syncPrompt(text: string) {
    typingPrompt.value = text;
    promptText.value = text;
  }

  function appendToPrompt(text: string) {
    syncPrompt(appendPromptText(typingPrompt.value, text));
  }

  function reportError(message: string) {
    inlineError.value = message;
    showToast(message);
  }

  const grok = useGrokRecorder({
    onAppend: appendToPrompt,
    onError: reportError,
    onCountdown: (value) => {
      countdownSeconds.value = value;
    },
  });

  const webSpeech = useWebSpeech({
    getPrompt: () => typingPrompt.value,
    setPrompt: syncPrompt,
    onError: reportError,
  });

  const isRecording = computed(() => grok.isRecording.value || webSpeech.isRecording.value);
  const isTranscribing = computed(() => grok.isTranscribing.value);
  const isBusy = computed(() => isRecording.value || isTranscribing.value);

  const statusLabel = computed(() => {
    if (isTranscribing.value) {
      return 'Transcribing';
    }
    if (isRecording.value) {
      return 'Recording';
    }
    return '';
  });

  watch(statusLabel, (value) => {
    ariaLiveMessage.value = value;
  });

  function setEngine(next: VoiceEngine) {
    if (next === 'web-speech' && !webSpeechSupported) {
      return;
    }
    engine.value = next;
    writeStoredEngine(next);
  }

  async function startAudioLevel(stream?: MediaStream) {
    await audioLevel.start(stream);
  }

  async function startRecording() {
    if (isBusy.value) {
      return;
    }
    inlineError.value = '';

    if (engine.value === 'grok') {
      const started = await grok.startRecording();
      if (started) {
        ariaLiveMessage.value = 'Recording';
        await startAudioLevel(grok.getStream() ?? undefined);
      }
      return;
    }

    const started = webSpeech.startRecording();
    if (started) {
      ariaLiveMessage.value = 'Recording';
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        await startAudioLevel(stream);
      } catch {
        audioLevel.reactiveWaveform.value = false;
        webSpeech.cancelRecording();
        reportError(grokErrorMessage({ code: 'permission_denied' }));
      }
    }
  }

  async function stopRecording() {
    if (engine.value === 'grok') {
      await grok.stopRecording();
    } else {
      webSpeech.stopRecording();
    }
    audioLevel.stop();
    countdownSeconds.value = null;
  }

  function cancelRecording() {
    if (engine.value === 'grok') {
      grok.cancelRecording();
    } else {
      webSpeech.cancelRecording();
    }
    audioLevel.stop();
    countdownSeconds.value = null;
    ariaLiveMessage.value = '';
  }

  function toggleRecording() {
    if (isTranscribing.value) {
      return;
    }
    if (isRecording.value) {
      void stopRecording();
      return;
    }
    void startRecording();
  }

  function onVisibilityChange() {
    if (document.hidden && isRecording.value) {
      cancelRecording();
    }
  }

  onMounted(() => {
    if (!webSpeechSupported && engine.value === 'web-speech') {
      engine.value = 'grok';
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    cancelRecording();
  });

  watch(
    () => [route.fullPath, mode.value.id] as const,
    () => {
      if (isRecording.value) {
        cancelRecording();
      }
    },
  );

  return {
    engine,
    setEngine,
    webSpeechSupported,
    isRecording,
    isTranscribing,
    isBusy,
    countdownSeconds,
    maxClipSeconds: STT_MAX_CLIP_SECONDS,
    inlineError,
    ariaLiveMessage,
    statusLabel,
    audioLevel,
    toggleRecording,
    cancelRecording,
    startRecording,
    stopRecording,
  };
}

export function provideVoiceInput() {
  const voice = useVoiceInput();
  provide(voiceInputKey, voice);
  return voice;
}

export function useVoiceInputContext() {
  const voice = inject(voiceInputKey);
  if (!voice) {
    throw new Error('voice input context missing');
  }
  return voice;
}
