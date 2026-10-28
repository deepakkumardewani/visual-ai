import { vi } from 'vitest';

/** Spec STT-3/STT-4 append-not-replace (space between segments). */
export function appendPromptTextForTests(existing: string, addition: string): string {
  const add = addition.trim();
  if (!add) {
    return existing;
  }
  const base = existing.trimEnd();
  if (!base) {
    return add;
  }
  return `${base} ${add}`;
}

export type MockMediaRecorderInstance = {
  stream: MediaStream;
  mimeType: string;
  state: 'inactive' | 'recording';
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  emitData: (blob: Blob) => void;
  emitStop: () => void;
};

export function createMockStream(): MediaStream {
  const track = { stop: vi.fn() };
  return { getTracks: () => [track] } as unknown as MediaStream;
}

export function installMediaRecorder(
  options: {
    webmSupported?: boolean;
    mp4Supported?: boolean;
  } = {},
) {
  const webmSupported = options.webmSupported ?? true;
  const mp4Supported = options.mp4Supported ?? false;
  const instances: MockMediaRecorderInstance[] = [];

  class MockMediaRecorder {
    stream: MediaStream;
    mimeType: string;
    state: 'inactive' | 'recording' = 'inactive';
    private listeners = new Map<string, Set<(event?: unknown) => void>>();

    start = vi.fn(() => {
      this.state = 'recording';
    });

    stop = vi.fn(() => {
      this.state = 'inactive';
      this.listeners.get('stop')?.forEach((fn) => fn());
    });

    addEventListener = vi.fn((type: string, listener: (event?: unknown) => void) => {
      if (!this.listeners.has(type)) {
        this.listeners.set(type, new Set());
      }
      this.listeners.get(type)!.add(listener);
    });

    constructor(stream: MediaStream, opts?: { mimeType?: string }) {
      this.stream = stream;
      this.mimeType = opts?.mimeType ?? 'audio/webm;codecs=opus';
      const handle: MockMediaRecorderInstance = {
        stream,
        mimeType: this.mimeType,
        state: this.state,
        start: this.start,
        stop: this.stop,
        addEventListener: this.addEventListener,
        emitData: (blob: Blob) => {
          this.listeners.get('dataavailable')?.forEach((fn) => fn({ data: blob }));
        },
        emitStop: () => {
          this.stop();
        },
      };
      instances.push(handle);
    }

    static isTypeSupported(type: string) {
      if (type.includes('webm')) {
        return webmSupported;
      }
      if (type.includes('mp4')) {
        return mp4Supported;
      }
      return false;
    }
  }

  vi.stubGlobal('MediaRecorder', MockMediaRecorder as unknown as typeof MediaRecorder);

  return {
    get last() {
      return instances.at(-1) ?? null;
    },
    instances,
  };
}

export function installGetUserMedia(stream: MediaStream = createMockStream()) {
  const getUserMedia = vi.fn().mockResolvedValue(stream);
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  });
  return getUserMedia;
}

export function installAudioContext() {
  const close = vi.fn().mockResolvedValue(undefined);
  const analyser = {
    fftSize: 256,
    frequencyBinCount: 4,
    getByteFrequencyData: vi.fn((arr: Uint8Array) => {
      arr[0] = 128;
      arr[1] = 64;
    }),
  };
  const audioContext = {
    state: 'running' as const,
    close,
    createAnalyser: vi.fn(() => analyser),
    createMediaStreamSource: vi.fn(() => ({ connect: vi.fn() })),
  };
  class MockAudioContext {
    state = audioContext.state;
    close = close;
    createAnalyser = audioContext.createAnalyser;
    createMediaStreamSource = audioContext.createMediaStreamSource;
  }
  vi.stubGlobal('AudioContext', MockAudioContext as unknown as typeof AudioContext);
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1),
  );
  return { audioContext, analyser };
}
