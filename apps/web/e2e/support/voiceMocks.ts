import type { Page } from '@playwright/test';

export type VoiceMockMode = {
  getUserMedia?: 'grant' | 'deny';
};

export type VoiceAnalyserMode = 'audible' | 'silent';

export type SttFetchMode = '200' | '429' | '503' | 'empty';

const RECORDING_MOCK_SOURCE = String.raw`
(() => {
  const voiceApi = window.__e2eVoice ?? {
    getUserMediaMode: 'grant',
    analyserMode: 'audible',
    mediaInstances: [],
    setGetUserMediaMode(next) {
      this.getUserMediaMode = next;
    },
  };
  window.__e2eVoice = voiceApi;

  const track = { stop: () => undefined };
  const mockStream = { getTracks: () => [track] };

  if (!navigator.mediaDevices) {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {},
    });
  }
  navigator.mediaDevices.getUserMedia = async () => {
    if (voiceApi.getUserMediaMode === 'deny') {
      throw new DOMException('Permission denied', 'NotAllowedError');
    }
    return mockStream;
  };

  class E2EMediaRecorder {
    constructor(stream, options) {
      this.stream = stream;
      this.mimeType = options?.mimeType ?? 'audio/webm;codecs=opus';
      this.state = 'inactive';
      this.listeners = new Map();
      voiceApi.mediaInstances.push({
        emitData: (blob) => {
          this.listeners.get('dataavailable')?.forEach((fn) => fn({ data: blob }));
        },
        stopRecording: () => {
          if (this.state === 'inactive') return;
          this.state = 'inactive';
          this.listeners.get('stop')?.forEach((fn) => fn());
        },
      });
    }
    addEventListener(type, listener) {
      if (!this.listeners.has(type)) this.listeners.set(type, new Set());
      this.listeners.get(type).add(listener);
    }
    start() {
      this.state = 'recording';
    }
    stop() {
      if (this.state === 'inactive') return;
      this.state = 'inactive';
      this.listeners.get('stop')?.forEach((fn) => fn());
    }
    static isTypeSupported(type) {
      return type.includes('webm') || type.includes('mp4');
    }
  }
  window.MediaRecorder = E2EMediaRecorder;

  class E2EAudioContext {
    constructor() {
      this.state = 'running';
    }
    close = async () => undefined;
    createAnalyser = () => ({
      fftSize: 256,
      frequencyBinCount: 4,
      getByteFrequencyData: (arr) => {
        arr[0] = voiceApi.analyserMode === 'silent' ? 0 : 128;
      },
    });
    createMediaStreamSource = () => ({ connect: () => undefined });
  }
  window.AudioContext = E2EAudioContext;
  // Sample once per start: a synchronous callback that re-schedules itself would recurse until the
  // stack overflows, which the app reads as "no analyser" and then never reports silence.
  let inFrame = false;
  window.requestAnimationFrame = (cb) => {
    if (inFrame) return 1;
    inFrame = true;
    try {
      cb(0);
    } finally {
      inFrame = false;
    }
    return 1;
  };
  window.cancelAnimationFrame = () => undefined;
})();
`;

export async function installVoiceBrowserMocks(
  page: Page,
  mode: VoiceMockMode = { getUserMedia: 'grant' },
) {
  await page.addInitScript((opts) => {
    const voiceApi = {
      getUserMediaMode: opts.getUserMedia ?? 'grant',
      sttMode: '200' as SttFetchMode,
      mediaInstances: [] as Array<{
        emitData: (blob: Blob) => void;
        stopRecording: () => void;
      }>,
      setGetUserMediaMode(next: 'grant' | 'deny') {
        voiceApi.getUserMediaMode = next;
      },
    };
    (window as Window & { __e2eVoice?: typeof voiceApi }).__e2eVoice = voiceApi;
  }, mode);
}

export async function installVoiceRecordingMocks(page: Page) {
  await page.evaluate(RECORDING_MOCK_SOURCE);
}

/** Silent mode makes the mocked analyser report zero level; the default stays audible so clips reach `/stt`. */
export async function setAnalyserMode(page: Page, mode: VoiceAnalyserMode) {
  await page.evaluate((next) => {
    if (window.__e2eVoice) {
      window.__e2eVoice.analyserMode = next;
    }
  }, mode);
}

export async function setGetUserMediaMode(page: Page, mode: 'grant' | 'deny') {
  await page.evaluate((next) => {
    window.__e2eVoice?.setGetUserMediaMode(next);
  }, mode);
}

export async function finishGrokRecording(page: Page) {
  await page.evaluate(() => {
    const inst = window.__e2eVoice?.mediaInstances.at(-1);
    if (!inst) {
      throw new Error('No MediaRecorder mock instance');
    }
    inst.emitData(new Blob(['audio-bytes'], { type: 'audio/webm' }));
    inst.stopRecording();
  });
}

/** In-page fetch stub for `/stt` error paths — avoids browser network console errors from routed 4xx/5xx. */
export async function installSttFetchMock(page: Page) {
  await page.addInitScript(() => {
    const realFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (!url.endsWith('/stt') || (init?.method ?? 'GET').toUpperCase() !== 'POST') {
        return realFetch(input, init);
      }

      const mode = window.__e2eVoice?.sttMode ?? '200';
      if (mode === '429') {
        return new Response(JSON.stringify({ error: 'rate limited' }), {
          status: 429,
          headers: { 'Retry-After': '180', 'Content-Type': 'application/json' },
        });
      }
      if (mode === '503') {
        return new Response('upstream', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }
      if (mode === 'empty') {
        return new Response(JSON.stringify({ text: '   ' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return realFetch(input, init);
    };
  });
}

export async function setSttFetchMode(page: Page, mode: SttFetchMode) {
  await page.evaluate((next) => {
    if (window.__e2eVoice) {
      window.__e2eVoice.sttMode = next;
    }
  }, mode);
}

export async function hideDocument(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

declare global {
  interface Window {
    __e2eVoice?: {
      getUserMediaMode: 'grant' | 'deny';
      mediaInstances: Array<{
        emitData: (blob: Blob) => void;
        stopRecording: () => void;
      }>;
      setGetUserMediaMode: (next: 'grant' | 'deny') => void;
      sttMode?: SttFetchMode;
      analyserMode?: VoiceAnalyserMode;
    };
  }
}
