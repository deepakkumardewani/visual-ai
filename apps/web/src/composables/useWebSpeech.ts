import { ref } from 'vue';

import { appendPromptText } from '@/composables/useGrokRecorder';

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

export function getSpeechRecognitionConstructor(): (new () => SpeechRecognitionLike) | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function useWebSpeech(options: {
  getPrompt: () => string;
  setPrompt: (value: string) => void;
  onError: (message: string) => void;
}) {
  const isRecording = ref(false);
  const isSupported = ref(Boolean(getSpeechRecognitionConstructor()));

  let recognition: SpeechRecognitionLike | null = null;
  let corePrompt = '';

  function mapSpeechError(code: string): string {
    if (code === 'not-allowed' || code === 'service-not-allowed') {
      return 'Microphone access is blocked. Allow it in your browser settings.';
    }
    if (code === 'audio-capture') {
      return 'No microphone found. Connect a mic and try again.';
    }
    if (code === 'network') {
      return 'Network error while transcribing. Check your connection.';
    }
    return 'Voice input is not supported in this browser.';
  }

  function stopRecording() {
    recognition?.stop();
  }

  function cancelRecording() {
    recognition?.abort();
    recognition = null;
    isRecording.value = false;
  }

  function startRecording(): boolean {
    if (isRecording.value) {
      return false;
    }
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) {
      options.onError('Voice input is not supported in this browser.');
      return false;
    }

    corePrompt = options.getPrompt();
    recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = typeof navigator !== 'undefined' ? navigator.language : 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript ?? '';
        if (result?.isFinal) {
          corePrompt = appendPromptText(corePrompt, transcript);
          options.setPrompt(corePrompt);
        } else {
          interim = transcript;
        }
      }
      if (interim) {
        options.setPrompt(appendPromptText(corePrompt, interim));
      }
    };

    recognition.onerror = (event) => {
      options.onError(mapSpeechError(event.error));
    };

    recognition.onend = () => {
      isRecording.value = false;
      recognition = null;
    };

    try {
      recognition.start();
      isRecording.value = true;
      return true;
    } catch {
      options.onError('Voice input is not supported in this browser.');
      return false;
    }
  }

  return {
    isRecording,
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
