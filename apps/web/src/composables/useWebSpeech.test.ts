import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getSpeechRecognitionConstructor, useWebSpeech } from '@/composables/useWebSpeech';

type RecognitionHandlers = {
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function installSpeechRecognition() {
  const instances: Array<
    RecognitionHandlers & {
      start: ReturnType<typeof vi.fn>;
      stop: ReturnType<typeof vi.fn>;
      abort: ReturnType<typeof vi.fn>;
    }
  > = [];

  class MockSpeechRecognition implements RecognitionHandlers {
    continuous = false;
    interimResults = false;
    lang = '';
    onresult = null;
    onerror = null;
    onend = null;
    start = vi.fn(() => {
      /* noop */
    });
    stop = vi.fn();
    abort = vi.fn();

    constructor() {
      instances.push(this);
    }
  }

  vi.stubGlobal('SpeechRecognition', MockSpeechRecognition);
  vi.stubGlobal('webkitSpeechRecognition', undefined);

  return {
    get last() {
      return instances.at(-1) ?? null;
    },
  };
}

describe('getSpeechRecognitionConstructor', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns undefined when window is unavailable', () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error simulate non-browser runtime
    delete globalThis.window;
    expect(getSpeechRecognitionConstructor()).toBeUndefined();
    globalThis.window = originalWindow;
  });

  it('returns SpeechRecognition when present on window', () => {
    class C {}
    vi.stubGlobal('SpeechRecognition', C);
    expect(getSpeechRecognitionConstructor()).toBe(C);
  });

  it('falls back to webkitSpeechRecognition', () => {
    vi.stubGlobal('SpeechRecognition', undefined);
    class Webkit {}
    vi.stubGlobal('webkitSpeechRecognition', Webkit);
    expect(getSpeechRecognitionConstructor()).toBe(Webkit);
  });
});

describe('useWebSpeech', () => {
  const onError = vi.fn();
  let prompt = 'seed prompt';

  beforeEach(() => {
    prompt = 'seed prompt';
    onError.mockClear();
    installSpeechRecognition();
    Object.defineProperty(navigator, 'language', {
      configurable: true,
      value: 'en-GB',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function createSpeech() {
    return useWebSpeech({
      getPrompt: () => prompt,
      setPrompt: (value) => {
        prompt = value;
      },
      onError,
    });
  }

  it('blocks concurrent starts and unsupported browsers', () => {
    vi.unstubAllGlobals();
    vi.stubGlobal('SpeechRecognition', undefined);
    vi.stubGlobal('webkitSpeechRecognition', undefined);

    const speech = createSpeech();
    expect(speech.startRecording()).toBe(false);
    expect(onError).toHaveBeenCalledWith('Voice input is not supported in this browser.');

    installSpeechRecognition();
    const supported = createSpeech();
    expect(supported.startRecording()).toBe(true);
    expect(supported.startRecording()).toBe(false);
  });

  it('commits final transcripts and previews interim text without replacing the core prompt', () => {
    const recognition = installSpeechRecognition();
    const speech = createSpeech();
    expect(speech.startRecording()).toBe(true);

    const instance = recognition.last;
    instance?.onresult?.({
      resultIndex: 0,
      results: [{ isFinal: false, 0: { transcript: 'interim bit' } }],
    });
    expect(prompt).toBe('seed prompt interim bit');

    instance?.onresult?.({
      resultIndex: 0,
      results: [{ isFinal: true, 0: { transcript: 'final bit' } }],
    });
    expect(prompt).toBe('seed prompt final bit');
  });

  it('maps speech error codes to STT-8 messages', () => {
    const speech = createSpeech();
    const recognition = installSpeechRecognition();
    speech.startRecording();

    const codes = [
      ['not-allowed', 'Microphone access is blocked. Allow it in your browser settings.'],
      ['service-not-allowed', 'Microphone access is blocked. Allow it in your browser settings.'],
      ['audio-capture', 'No microphone found. Connect a mic and try again.'],
      ['network', 'Network error while transcribing. Check your connection.'],
      ['unknown', 'Voice input is not supported in this browser.'],
    ] as const;

    for (const [code, message] of codes) {
      onError.mockClear();
      recognition.last?.onerror?.({ error: code });
      expect(onError).toHaveBeenCalledWith(message);
    }
  });

  it('clears recording state on end and supports cancel/stop', () => {
    const speech = createSpeech();
    const recognition = installSpeechRecognition();
    speech.startRecording();
    expect(speech.isRecording.value).toBe(true);

    speech.stopRecording();
    expect(recognition.last?.stop).toHaveBeenCalled();

    speech.startRecording();
    speech.cancelRecording();
    expect(recognition.last?.abort).toHaveBeenCalled();
    expect(speech.isRecording.value).toBe(false);

    speech.startRecording();
    recognition.last?.onend?.();
    expect(speech.isRecording.value).toBe(false);
  });

  it('reports unsupported when recognition.start throws', () => {
    class ThrowingRecognition {
      continuous = false;
      interimResults = false;
      lang = '';
      onresult = null;
      onerror = null;
      onend = null;
      start() {
        throw new Error('start failed');
      }
      stop = vi.fn();
      abort = vi.fn();
    }
    vi.stubGlobal('SpeechRecognition', ThrowingRecognition);

    const speech = createSpeech();
    expect(speech.startRecording()).toBe(false);
    expect(onError).toHaveBeenCalledWith('Voice input is not supported in this browser.');
  });
});
