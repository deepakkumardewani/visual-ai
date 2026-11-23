import { flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, ref } from 'vue';

import type { MediaAssetDto } from '@visual-ai/shared';

import {
  EXPORT_FAILED_COPY,
  EXPORT_PCM_CAP_BYTES,
  EXPORT_TOO_LONG_COPY,
  HISTORY_FULL_COPY,
  MP3_BITRATE_KBPS,
  SAVE_FAILED_COPY,
  estimateExportBytes,
  exceedsPcmCap,
  renderEdit,
  useAudioExport,
  type DecodedPcm,
} from '@/composables/useAudioExport';
import { useHistoryStore } from '@/stores/history';
import type { PlayerTrack } from '@/stores/player';
import { createEditState, cut, addFade, setNormalize, type EditState } from '@/utils/audioEditMath';
import type { Mp3EncodeRequest, Mp3WorkerMessage } from '@/workers/mp3-encoder.worker';

vi.mock('@/composables/useFetch', () => ({ useFetch: vi.fn() }));
vi.mock('@/utils/logger', () => ({
  createLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }),
}));

import { useFetch } from '@/composables/useFetch';

const TRACK: PlayerTrack = { id: 't1', title: 'Night Drive!', src: 'https://cdn.test/a.mp3' };
const RATE = 10;

class FakeWorker {
  onmessage: ((event: MessageEvent<Mp3WorkerMessage>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  requests: Mp3EncodeRequest[] = [];
  terminate = vi.fn();
  postMessage = vi.fn((request: Mp3EncodeRequest) => {
    this.requests.push(request);
  });
  emit(message: Mp3WorkerMessage) {
    this.onmessage?.({ data: message } as MessageEvent<Mp3WorkerMessage>);
  }
}

function pcm(values: number[], channels = 1): DecodedPcm {
  return {
    channels: Array.from({ length: channels }, () => Float32Array.from(values)),
    sampleRate: RATE,
  };
}

interface Harness {
  exporter: ReturnType<typeof useAudioExport>;
  workers: FakeWorker[];
  decode: ReturnType<typeof vi.fn>;
  edit: ReturnType<typeof ref<EditState>>;
  duration: ReturnType<typeof ref<number>>;
}

function setup(decoded: DecodedPcm = pcm([0.5, 0.5, 0.5, 0.5])): Harness {
  const workers: FakeWorker[] = [];
  const decode = vi.fn(() => Promise.resolve(decoded));
  const edit = ref(createEditState(decoded.channels[0].length / RATE));
  const duration = ref(decoded.channels[0].length / RATE);
  const exporter = effectScope().run(() =>
    useAudioExport(
      { track: ref(TRACK), edit, sourceDuration: duration },
      {
        decode,
        createWorker: () => {
          const worker = new FakeWorker();
          workers.push(worker);
          return worker as unknown as Worker;
        },
      },
    ),
  )!;
  return { exporter, workers, decode, edit: edit as Harness['edit'], duration };
}

const ASSET = { id: 'v1', title: 'Night Drive' } as unknown as MediaAssetDto;

function mockSave(result: { data?: MediaAssetDto | null; error?: unknown; status?: number }) {
  const call = vi.fn();
  vi.mocked(useFetch).mockImplementation(((...args: unknown[]) => {
    call(...args);
    return {
      json: () => ({
        data: ref(result.data ?? null),
        error: ref(result.error ?? null),
        response: ref(result.status === undefined ? null : { status: result.status }),
      }),
    };
  }) as unknown as typeof useFetch);
  return call;
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.mocked(useFetch).mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('exceedsPcmCap', () => {
  it('is false for a short clip and true for one past the 200MB stereo float budget', () => {
    expect(exceedsPcmCap(60)).toBe(false);
    // 200MB / (44100 * 2 * 4) is about 594 s
    expect(exceedsPcmCap(594)).toBe(false);
    expect(exceedsPcmCap(600)).toBe(true);
  });

  it('honours an explicit sample rate', () => {
    expect(exceedsPcmCap(300, 96000)).toBe(true);
    expect(exceedsPcmCap(300, 8000)).toBe(false);
  });
});

describe('estimateExportBytes', () => {
  it('estimates WAV as header plus 16-bit stereo at 44.1kHz', () => {
    expect(estimateExportBytes(createEditState(2), 'wav')).toBe(44 + 2 * 44100 * 2 * 2);
  });

  it('estimates MP3 from bitrate and edited duration', () => {
    expect(estimateExportBytes(createEditState(10), 'mp3')).toBe(
      (10 * MP3_BITRATE_KBPS * 1000) / 8,
    );
  });

  it('shrinks when a segment is cut out', () => {
    const edit = cut(createEditState(10), { start: 0, end: 5 });
    expect(estimateExportBytes(edit, 'mp3')).toBe((5 * MP3_BITRATE_KBPS * 1000) / 8);
  });
});

describe('renderEdit', () => {
  it('joins kept segments in order', () => {
    const source = pcm([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => n / 10));
    // keep [0,0.3) and [0.7,1.0): samples 0..2 and 7..9
    const edit = cut(createEditState(1), { start: 0.3, end: 0.7 });
    const out = renderEdit(source, edit);
    expect(Array.from(out.channels[0], (n) => Math.round(n * 10))).toEqual([0, 1, 2, 7, 8, 9]);
    expect(out.sampleRate).toBe(RATE);
  });

  it('applies a fade in from silence to unity and a fade out back to silence', () => {
    const source = pcm(Array(10).fill(1));
    const fadedIn = renderEdit(source, addFade(createEditState(1), 'in', { start: 0, end: 1 }));
    expect(fadedIn.channels[0][0]).toBe(0);
    expect(fadedIn.channels[0][9]).toBeCloseTo(1);
    expect(fadedIn.channels[0][4]).toBeCloseTo(4 / 9);
    const fadedOut = renderEdit(source, addFade(createEditState(1), 'out', { start: 0, end: 1 }));
    expect(fadedOut.channels[0][0]).toBeCloseTo(1);
    expect(fadedOut.channels[0][9]).toBe(0);
  });

  it('ignores a fade that does not sit inside a kept segment', () => {
    const source = pcm(Array(10).fill(1));
    const edit: EditState = {
      segments: [{ start: 0, end: 0.5 }],
      fades: [{ kind: 'in', start: 0.2, end: 0.8 }],
      normalize: false,
    };
    expect(Array.from(renderEdit(source, edit).channels[0])).toEqual(Array(5).fill(1));
  });

  it('treats a one-sample fade as full gain for a fade in', () => {
    const source = pcm(Array(10).fill(1));
    const edit: EditState = {
      segments: [{ start: 0, end: 1 }],
      fades: [{ kind: 'in', start: 0.5, end: 0.6 }],
      normalize: false,
    };
    expect(renderEdit(source, edit).channels[0][5]).toBe(1);
  });

  it('normalizes so the loudest sample sits just under full scale across both channels', () => {
    const source: DecodedPcm = {
      channels: [Float32Array.from([0.1, 0.2]), Float32Array.from([0.4, -0.1])],
      sampleRate: RATE,
    };
    const out = renderEdit(source, setNormalize(createEditState(0.2), true));
    expect(out.channels[1][0]).toBeCloseTo(0.98);
    expect(out.channels[0][1]).toBeCloseTo(0.49);
  });

  it('leaves silence alone when normalizing', () => {
    const out = renderEdit(pcm([0, 0]), setNormalize(createEditState(0.2), true));
    expect(Array.from(out.channels[0])).toEqual([0, 0]);
  });

  it('keeps at most two channels', () => {
    const out = renderEdit(pcm([0.1, 0.1], 3), createEditState(0.2));
    expect(out.channels).toHaveLength(2);
  });
});

describe('useAudioExport: WAV', () => {
  it('renders a WAV blob with the right mime type, filename and size, and starts no worker', async () => {
    const { exporter, workers } = setup();
    await exporter.start('wav');
    expect(exporter.status.value).toBe('done');
    expect(exporter.progress.value).toBe(1);
    expect(workers).toHaveLength(0);
    const result = exporter.result.value!;
    expect(result.format).toBe('wav');
    expect(result.filename).toBe('Night-Drive-edit.wav');
    expect(result.blob.type).toBe('audio/wav');
    expect(result.blob.size).toBe(44 + 4 * 2);
  });

  it('falls back to a generic filename when the title has no usable characters', async () => {
    const exporter = useAudioExport(
      {
        track: ref({ ...TRACK, title: '***' }),
        edit: ref(createEditState(0.4)),
        sourceDuration: ref(0.4),
      },
      { decode: () => Promise.resolve(pcm([0.1, 0.1, 0.1, 0.1])) },
    );
    await exporter.start('wav');
    expect(exporter.result.value?.filename).toBe('song-edit.wav');
  });
});

describe('useAudioExport: MP3', () => {
  it('sends PCM and bitrate to the worker, tracks progress, and builds an MP3 blob', async () => {
    const { exporter, workers, decode } = setup(pcm([0.5, 0.5, 0.5, 0.5], 2));
    const run = exporter.start('mp3');
    expect(exporter.status.value).toBe('encoding');
    expect(exporter.isEncoding.value).toBe(true);
    await flushPromises();
    expect(decode).toHaveBeenCalledWith(TRACK.src);
    const [worker] = workers;
    expect(worker.requests[0].bitrateKbps).toBe(MP3_BITRATE_KBPS);
    expect(worker.requests[0].sampleRate).toBe(RATE);
    expect(worker.requests[0].channels).toHaveLength(2);

    worker.emit({ type: 'progress', ratio: 0.4 });
    expect(exporter.progress.value).toBe(0.4);
    worker.emit({ type: 'done', chunks: [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5])] });
    await run;

    expect(exporter.status.value).toBe('done');
    expect(exporter.progress.value).toBe(1);
    expect(exporter.result.value?.blob.type).toBe('audio/mpeg');
    expect(exporter.result.value?.blob.size).toBe(5);
    expect(exporter.result.value?.filename).toBe('Night-Drive-edit.mp3');
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });

  it('surfaces a worker error message and stops the worker', async () => {
    const { exporter, workers } = setup();
    const run = exporter.start('mp3');
    await flushPromises();
    workers[0].emit({ type: 'error', message: 'lame blew up' });
    await run;
    expect(exporter.status.value).toBe('error');
    expect(exporter.errorMessage.value).toBe('lame blew up');
    expect(exporter.result.value).toBeNull();
    expect(workers[0].terminate).toHaveBeenCalled();
  });

  it('reports a worker crash with the browser message, or a default when it has none', async () => {
    const first = setup();
    const run = first.exporter.start('mp3');
    await flushPromises();
    first.workers[0].onerror?.({ message: 'script error' } as ErrorEvent);
    await run;
    expect(first.exporter.errorMessage.value).toBe('script error');

    const second = setup();
    const run2 = second.exporter.start('mp3');
    await flushPromises();
    second.workers[0].onerror?.({ message: '' } as ErrorEvent);
    await run2;
    expect(second.exporter.errorMessage.value).toBe('MP3 worker crashed');
  });

  it('ignores a second start while encoding', async () => {
    const { exporter, workers, decode } = setup();
    const run = exporter.start('mp3');
    await exporter.start('mp3');
    await flushPromises();
    expect(decode).toHaveBeenCalledTimes(1);
    expect(workers).toHaveLength(1);
    workers[0].emit({ type: 'done', chunks: [] });
    await run;
  });

  it('uses the real Worker constructor with a module worker when none is injected', async () => {
    const created: { url: URL; options: WorkerOptions }[] = [];
    class StubWorker extends FakeWorker {
      constructor(url: URL, options: WorkerOptions) {
        super();
        created.push({ url, options });
        queueMicrotask(() => this.emit({ type: 'done', chunks: [new Uint8Array([9])] }));
      }
    }
    vi.stubGlobal('Worker', StubWorker);
    const exporter = useAudioExport(
      { track: ref(TRACK), edit: ref(createEditState(0.4)), sourceDuration: ref(0.4) },
      { decode: () => Promise.resolve(pcm([0.1, 0.1, 0.1, 0.1])) },
    );
    await exporter.start('mp3');
    expect(created).toHaveLength(1);
    expect(created[0].url.pathname).toMatch(/mp3-encoder\.worker\.ts$/);
    expect(created[0].options).toEqual({ type: 'module' });
    expect(exporter.status.value).toBe('done');
  });
});

describe('useAudioExport: cap and failures', () => {
  it('fails fast with the exact copy when the source duration exceeds the cap, without decoding or starting a worker', async () => {
    const { exporter, workers, decode, duration } = setup();
    duration.value = 10_000;
    await exporter.start('mp3');
    expect(exporter.status.value).toBe('error');
    expect(exporter.errorMessage.value).toBe(EXPORT_TOO_LONG_COPY);
    expect(EXPORT_TOO_LONG_COPY).toBe('This audio is too long to export in the browser.');
    expect(decode).not.toHaveBeenCalled();
    expect(workers).toHaveLength(0);
  });

  it('fails with the same copy when decoded PCM turns out larger than the cap, with no worker', async () => {
    const huge = {
      channels: [{ byteLength: EXPORT_PCM_CAP_BYTES + 1 } as unknown as Float32Array],
      sampleRate: RATE,
    };
    const exporter2 = useAudioExport(
      { track: ref(TRACK), edit: ref(createEditState(1)), sourceDuration: ref(1) },
      {
        decode: () => Promise.resolve(huge),
        createWorker: () => {
          throw new Error('worker must not start');
        },
      },
    );
    await exporter2.start('mp3');
    expect(exporter2.errorMessage.value).toBe(EXPORT_TOO_LONG_COPY);
    expect(exporter2.status.value).toBe('error');
  });

  it('shows the generic copy for an unexpected decode failure', async () => {
    const exporter = useAudioExport(
      { track: ref(TRACK), edit: ref(createEditState(1)), sourceDuration: ref(1) },
      { decode: () => Promise.reject(new TypeError('bad audio')) },
    );
    await exporter.start('wav');
    expect(exporter.status.value).toBe('error');
    expect(exporter.errorMessage.value).toBe(EXPORT_FAILED_COPY);
  });

  it('lets the user retry after an error', async () => {
    let fail = true;
    const exporter = useAudioExport(
      { track: ref(TRACK), edit: ref(createEditState(0.4)), sourceDuration: ref(0.4) },
      {
        decode: () =>
          fail ? Promise.reject(new Error('x')) : Promise.resolve(pcm([0.1, 0.1, 0.1, 0.1])),
      },
    );
    await exporter.start('wav');
    expect(exporter.status.value).toBe('error');
    fail = false;
    await exporter.start('wav');
    expect(exporter.status.value).toBe('done');
    expect(exporter.errorMessage.value).toBeNull();
  });
});

describe('useAudioExport: default decoder', () => {
  it('fetches the track, decodes it with an AudioContext and closes the context', async () => {
    const close = vi.fn(() => Promise.resolve());
    const data = Float32Array.from([0.1, 0.2, 0.3, 0.4]);
    class FakeContext {
      decodeAudioData = vi.fn(() =>
        Promise.resolve({
          numberOfChannels: 1,
          sampleRate: RATE,
          getChannelData: () => data,
        }),
      );
      close = close;
    }
    const fetchMock = vi.fn(() =>
      Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)) }),
    );
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('AudioContext', FakeContext);
    const exporter = useAudioExport({
      track: ref(TRACK),
      edit: ref(createEditState(0.4)),
      sourceDuration: ref(0.4),
    });
    await exporter.start('wav');
    expect(fetchMock).toHaveBeenCalledWith(TRACK.src);
    expect(exporter.status.value).toBe('done');
    expect(exporter.result.value?.blob.size).toBe(44 + 4 * 2);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('reports the HTTP status when the audio request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, status: 503 })),
    );
    const exporter = useAudioExport({
      track: ref(TRACK),
      edit: ref(createEditState(1)),
      sourceDuration: ref(1),
    });
    await exporter.start('wav');
    expect(exporter.status.value).toBe('error');
    expect(exporter.errorMessage.value).toBe('Audio request failed with 503');
  });
});

describe('useAudioExport: cancel', () => {
  it('terminates the worker mid-encode, resets state and leaves no result', async () => {
    const { exporter, workers } = setup();
    const run = exporter.start('mp3');
    await flushPromises();
    workers[0].emit({ type: 'progress', ratio: 0.5 });
    exporter.cancel();
    await run;
    expect(workers[0].terminate).toHaveBeenCalled();
    expect(exporter.status.value).toBe('idle');
    expect(exporter.progress.value).toBe(0);
    expect(exporter.result.value).toBeNull();
    expect(exporter.errorMessage.value).toBeNull();
  });

  it('stops before encoding when cancelled during decode, starting no worker', async () => {
    let release!: (value: DecodedPcm) => void;
    const workers: FakeWorker[] = [];
    const exporter = useAudioExport(
      { track: ref(TRACK), edit: ref(createEditState(0.4)), sourceDuration: ref(0.4) },
      {
        decode: () => new Promise<DecodedPcm>((resolve) => (release = resolve)),
        createWorker: () => {
          const worker = new FakeWorker();
          workers.push(worker);
          return worker as unknown as Worker;
        },
      },
    );
    const run = exporter.start('mp3');
    exporter.cancel();
    release(pcm([0.1, 0.1, 0.1, 0.1]));
    await run;
    expect(workers).toHaveLength(0);
    expect(exporter.status.value).toBe('idle');
    expect(exporter.result.value).toBeNull();
  });

  it('does not terminate or reject a newer export when a cancelled run finishes late', async () => {
    const releases: Array<(value: DecodedPcm) => void> = [];
    const workers: FakeWorker[] = [];
    const exporter = useAudioExport(
      { track: ref(TRACK), edit: ref(createEditState(0.4)), sourceDuration: ref(0.4) },
      {
        decode: () => new Promise<DecodedPcm>((resolve) => releases.push(resolve)),
        createWorker: () => {
          const worker = new FakeWorker();
          workers.push(worker);
          return worker as unknown as Worker;
        },
      },
    );
    const first = exporter.start('mp3');
    exporter.cancel();
    const second = exporter.start('mp3');
    releases[1](pcm([0.1, 0.1, 0.1, 0.1]));
    await flushPromises();
    expect(workers).toHaveLength(1);

    releases[0](pcm([0.1, 0.1, 0.1, 0.1]));
    await first;

    expect(workers[0].terminate).not.toHaveBeenCalled();
    expect(exporter.status.value).toBe('encoding');
    workers[0].emit({ type: 'done', chunks: [new Uint8Array([1, 2])] });
    await second;
    expect(exporter.status.value).toBe('done');
    expect(exporter.result.value?.format).toBe('mp3');
  });

  it('is a no-op when nothing is encoding', () => {
    const { exporter, workers } = setup();
    exporter.cancel();
    expect(exporter.status.value).toBe('idle');
    expect(workers).toHaveLength(0);
  });

  it('terminates a running worker when the owning scope is disposed', async () => {
    const scope = effectScope();
    const workers: FakeWorker[] = [];
    const exporter = scope.run(() =>
      useAudioExport(
        { track: ref(TRACK), edit: ref(createEditState(0.4)), sourceDuration: ref(0.4) },
        {
          decode: () => Promise.resolve(pcm([0.1, 0.1, 0.1, 0.1])),
          createWorker: () => {
            const worker = new FakeWorker();
            workers.push(worker);
            return worker as unknown as Worker;
          },
        },
      ),
    )!;
    void exporter.start('mp3');
    await flushPromises();
    scope.stop();
    expect(workers[0].terminate).toHaveBeenCalled();
  });
});

describe('useAudioExport: saveVersion', () => {
  async function renderedWav() {
    const harness = setup();
    await harness.exporter.start('wav');
    return harness.exporter;
  }

  it('returns false without a rendered result and sends nothing', async () => {
    const call = mockSave({ data: ASSET });
    const { exporter } = setup();
    expect(await exporter.saveVersion('a1')).toBe(false);
    expect(call).not.toHaveBeenCalled();
  });

  it('uploads the file as multipart to the encoded versions path and adds the asset to history', async () => {
    const call = mockSave({ data: ASSET });
    const append = vi.spyOn(FormData.prototype, 'append');
    const exporter = await renderedWav();
    expect(await exporter.saveVersion('a/1')).toBe(true);
    const [path, init] = call.mock.calls[0] as [string, { method: string; body: FormData }];
    expect(path).toBe('/media/assets/a%2F1/versions');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    const [field, blob, filename] = append.mock.calls[0] as [string, Blob, string];
    expect(field).toBe('file');
    expect(blob.type).toBe('audio/wav');
    expect(filename).toBe('Night-Drive-edit.wav');
    append.mockRestore();
    expect(exporter.savedVersion.value).toEqual(ASSET);
    expect(exporter.saveError.value).toBeNull();
    expect(exporter.isSaving.value).toBe(false);
    expect(useHistoryStore().mediaAssets[0]).toEqual(ASSET);
  });

  it('shows the history-full copy on a 409', async () => {
    mockSave({ error: new Error('conflict'), status: 409 });
    const exporter = await renderedWav();
    expect(await exporter.saveVersion('a1')).toBe(false);
    expect(exporter.saveError.value).toBe(HISTORY_FULL_COPY);
    expect(exporter.savedVersion.value).toBeNull();
    expect(useHistoryStore().mediaAssets).toHaveLength(0);
  });

  it('shows the generic save copy on other failures, including no response at all', async () => {
    mockSave({ error: new Error('boom'), status: 500 });
    const exporter = await renderedWav();
    expect(await exporter.saveVersion('a1')).toBe(false);
    expect(exporter.saveError.value).toBe(SAVE_FAILED_COPY);

    mockSave({ error: new Error('offline') });
    expect(await exporter.saveVersion('a1')).toBe(false);
    expect(exporter.saveError.value).toBe(SAVE_FAILED_COPY);
  });

  it('treats an empty success body as a failure', async () => {
    mockSave({ data: null, status: 200 });
    const exporter = await renderedWav();
    expect(await exporter.saveVersion('a1')).toBe(false);
    expect(exporter.saveError.value).toBe(SAVE_FAILED_COPY);
  });

  it('ignores a second save while one is in flight', async () => {
    const call = mockSave({ data: ASSET });
    const exporter = await renderedWav();
    const first = exporter.saveVersion('a1');
    expect(exporter.isSaving.value).toBe(true);
    expect(await exporter.saveVersion('a1')).toBe(false);
    await first;
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('clears a previous save error and saved version when reset', async () => {
    mockSave({ data: ASSET });
    const exporter = await renderedWav();
    await exporter.saveVersion('a1');
    exporter.reset();
    expect(exporter.savedVersion.value).toBeNull();
    expect(exporter.result.value).toBeNull();
  });
});
