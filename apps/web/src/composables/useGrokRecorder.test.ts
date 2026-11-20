import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createMockStream,
  installGetUserMedia,
  installMediaRecorder,
} from '@/test/voiceMediaMocks';

const getToken = vi.hoisted(() => vi.fn().mockResolvedValue('test-token'));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ getToken }),
}));

import {
  appendPromptText,
  grokErrorMessage,
  STT_SILENCE_MESSAGE,
  useGrokRecorder,
} from '@/composables/useGrokRecorder';

describe('grokErrorMessage', () => {
  it('maps every STT-8 error code to a user-facing message', () => {
    expect(grokErrorMessage({ code: 'permission_denied' })).toBe(
      'Microphone access is blocked. Allow it in your browser settings.',
    );
    expect(grokErrorMessage({ code: 'no_device' })).toBe(
      'No microphone found. Connect a mic and try again.',
    );
    expect(grokErrorMessage({ code: 'empty_text' })).toBe(
      "Couldn't make out any words. Try again.",
    );
    expect(grokErrorMessage({ code: 'rate_limit', retryAfterMinutes: 3 })).toBe(
      'Too many voice requests. Try again in 3 minutes.',
    );
    expect(grokErrorMessage({ code: 'upstream' })).toBe('Transcription failed, try again.');
    expect(grokErrorMessage({ code: 'network' })).toBe(
      'Network error while transcribing. Check your connection.',
    );
    expect(grokErrorMessage({ code: 'unsupported' })).toBe(
      'Voice input is not supported in this browser.',
    );
  });

  it('defaults rate-limit minutes when retryAfterMinutes is omitted', () => {
    expect(grokErrorMessage({ code: 'rate_limit' })).toContain('10 minutes');
  });
});

describe('appendPromptText re-export', () => {
  it('appends with a space without replacing existing prompt text', () => {
    expect(appendPromptText('hello', 'world')).toBe('hello world');
    expect(appendPromptText('hello ', '  world  ')).toBe('hello world');
    expect(appendPromptText('', 'solo')).toBe('solo');
    expect(appendPromptText('keep', '')).toBe('keep');
  });
});

describe('useGrokRecorder', () => {
  const onAppend = vi.fn();
  const onError = vi.fn();
  const onCountdown = vi.fn();
  const onNotice = vi.fn();
  const hasSpeech = vi.fn(() => true);
  let media: ReturnType<typeof installMediaRecorder>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.stubEnv('VITE_API_BASEPATH', 'https://api.test');
    installGetUserMedia();
    media = installMediaRecorder({ webmSupported: true, mp4Supported: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  function createRecorder() {
    return useGrokRecorder({ onAppend, onError, onCountdown, onNotice, hasSpeech });
  }

  it('blocks concurrent start while recording or transcribing', async () => {
    const recorder = createRecorder();
    const first = await recorder.startRecording();
    expect(first).toBe(true);

    expect(await recorder.startRecording()).toBe(false);

    recorder.isTranscribing.value = true;
    recorder.cancelRecording();
    recorder.isTranscribing.value = true;
    expect(await recorder.startRecording()).toBe(false);
  });

  it('returns early when stop is called without an active recorder', async () => {
    const recorder = createRecorder();
    await expect(recorder.stopRecording()).resolves.toBeUndefined();
  });

  it('reports unsupported when MediaRecorder is missing', async () => {
    vi.unstubAllGlobals();
    installGetUserMedia();
    vi.stubGlobal('MediaRecorder', undefined);

    const recorder = createRecorder();
    expect(await recorder.startRecording()).toBe(false);
    expect(onError).toHaveBeenCalledWith('Voice input is not supported in this browser.');
  });

  it('maps non-429/non-5xx HTTP failures to network errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 400 })));
    const recorder = createRecorder();
    await stopWithBlob(recorder, media);
    expect(onError).toHaveBeenCalledWith(
      'Network error while transcribing. Check your connection.',
    );
  });

  it('reports unsupported when no mime type is available', async () => {
    vi.unstubAllGlobals();
    installGetUserMedia();
    installMediaRecorder({ webmSupported: false, mp4Supported: false });

    const recorder = createRecorder();
    expect(await recorder.startRecording()).toBe(false);
    expect(onError).toHaveBeenCalledWith('Voice input is not supported in this browser.');
  });

  it('uses mp4 mime when webm is not supported', async () => {
    vi.unstubAllGlobals();
    installGetUserMedia();
    const media = installMediaRecorder({ webmSupported: false, mp4Supported: true });

    const recorder = createRecorder();
    expect(await recorder.startRecording()).toBe(true);
    expect(media.last?.mimeType).toBe('audio/mp4');
  });

  it('maps getUserMedia permission and device errors', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi
          .fn()
          .mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'))
          .mockRejectedValueOnce(new DOMException('missing', 'NotFoundError'))
          .mockRejectedValueOnce(new Error('other')),
      },
    });

    const recorder = createRecorder();
    await recorder.startRecording();
    await recorder.startRecording();
    await recorder.startRecording();

    expect(onError).toHaveBeenNthCalledWith(
      1,
      'Microphone access is blocked. Allow it in your browser settings.',
    );
    expect(onError).toHaveBeenNthCalledWith(2, 'No microphone found. Connect a mic and try again.');
    expect(onError).toHaveBeenNthCalledWith(3, 'Voice input is not supported in this browser.');
  });

  it('uploads on stop and appends trimmed transcript text', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ text: '  hello grok  ' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const recorder = createRecorder();
    expect(await recorder.startRecording()).toBe(true);

    media.last?.emitData(new Blob(['audio'], { type: 'audio/webm' }));
    await recorder.stopRecording();
    await vi.runAllTimersAsync();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/stt',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(onAppend).toHaveBeenCalledWith('hello grok');
    expect(recorder.isTranscribing.value).toBe(false);
  });

  async function stopWithBlob(
    recorder: ReturnType<typeof useGrokRecorder>,
    media: ReturnType<typeof installMediaRecorder>,
  ) {
    expect(await recorder.startRecording()).toBe(true);
    media.last?.emitData(new Blob(['x'], { type: 'audio/webm' }));
    await recorder.stopRecording();
    await vi.runAllTimersAsync();
  }

  it('surfaces empty transcript responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ text: '   ' }), { status: 200 })),
    );
    const recorder = createRecorder();
    await stopWithBlob(recorder, media);
    expect(onNotice).toHaveBeenCalledWith("Couldn't make out any words. Try again.");
    expect(onError).not.toHaveBeenCalled();
    expect(onAppend).not.toHaveBeenCalled();
  });

  it('skips the /stt request and notifies when no speech was heard', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    hasSpeech.mockReturnValueOnce(false);
    const recorder = createRecorder();
    await stopWithBlob(recorder, media);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onNotice).toHaveBeenCalledWith(STT_SILENCE_MESSAGE);
    expect(onAppend).not.toHaveBeenCalled();
    expect(recorder.isTranscribing.value).toBe(false);
  });

  it('surfaces rate limit, upstream, and network failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'Retry-After': '120' } }))
        .mockResolvedValueOnce(new Response('', { status: 502 }))
        .mockRejectedValueOnce(new Error('offline')),
    );
    const recorder = createRecorder();
    await stopWithBlob(recorder, media);
    expect(onError).toHaveBeenCalledWith('Too many voice requests. Try again in 2 minutes.');

    onError.mockClear();
    await stopWithBlob(recorder, media);
    expect(onError).toHaveBeenCalledWith('Transcription failed, try again.');

    onError.mockClear();
    await stopWithBlob(recorder, media);
    expect(onError).toHaveBeenCalledWith(
      'Network error while transcribing. Check your connection.',
    );
  });

  it('auto-stops at 60s and emits countdown from 10 seconds remaining', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ text: 'ok' }), { status: 200 })),
    );

    const recorder = createRecorder();
    expect(await recorder.startRecording()).toBe(true);
    media.last?.emitData(new Blob(['x'], { type: 'audio/webm' }));

    vi.advanceTimersByTime(49_000);
    expect(onCountdown.mock.calls.filter(([value]) => value !== null)).toHaveLength(0);

    vi.advanceTimersByTime(5_000);
    expect(onCountdown).toHaveBeenCalled();

    vi.advanceTimersByTime(5_250);
    await vi.runAllTimersAsync();
    expect(recorder.isRecording.value).toBe(false);
  });

  it('cancel clears timers, stream, and skips upload for empty blob', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const stream = createMockStream();
    installGetUserMedia(stream);
    const recorder = createRecorder();
    expect(await recorder.startRecording()).toBe(true);

    recorder.cancelRecording();
    media.last?.emitStop();

    expect(onCountdown).toHaveBeenCalledWith(null);
    expect(recorder.isRecording.value).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(stream.getTracks()[0]?.stop).toHaveBeenCalled();
  });
});
