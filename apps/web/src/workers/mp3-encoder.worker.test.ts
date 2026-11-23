import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Mp3EncodeRequest, Mp3WorkerMessage } from '@/workers/mp3-encoder.worker';

const SAMPLE_RATE = 44100;

let posted: Mp3WorkerMessage[];

function sine(frames: number): Float32Array {
  return Float32Array.from({ length: frames }, (_, i) =>
    Math.sin((2 * Math.PI * 440 * i) / SAMPLE_RATE),
  );
}

async function loadWorker() {
  vi.resetModules();
  await import('@/workers/mp3-encoder.worker');
  return (request: Mp3EncodeRequest) =>
    (self.onmessage as (event: MessageEvent<Mp3EncodeRequest>) => void)({
      data: request,
    } as MessageEvent<Mp3EncodeRequest>);
}

beforeEach(() => {
  posted = [];
  vi.spyOn(self, 'postMessage').mockImplementation((message: unknown) => {
    posted.push(message as Mp3WorkerMessage);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.doUnmock('@breezystack/lamejs');
});

describe('mp3 encoder worker', () => {
  it('encodes stereo PCM into MP3 chunks and reports increasing progress ending at 1', async () => {
    const send = await loadWorker();
    const frames = 1152 * 32 * 2 + 500;
    send({ channels: [sine(frames), sine(frames)], sampleRate: SAMPLE_RATE, bitrateKbps: 128 });

    const progress = posted.filter((m) => m.type === 'progress').map((m) => m.ratio);
    expect(progress).toHaveLength(3);
    expect(progress).toEqual([...progress].sort((a, b) => a - b));
    expect(progress.at(-1)).toBe(1);

    const done = posted.at(-1);
    expect(done?.type).toBe('done');
    if (done?.type !== 'done') throw new Error('expected done');
    const bytes = done.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    // 73,228 frames is ~1.66 s; at 128 kbps that is ~26.6 KB, give or take encoder framing.
    expect(bytes).toBeGreaterThan(24_000);
    expect(bytes).toBeLessThan(30_000);
    const first = done.chunks[0];
    expect(first[0]).toBe(0xff);
    expect(first[1] & 0xe0).toBe(0xe0);
  });

  it('encodes a mono request', async () => {
    const send = await loadWorker();
    send({ channels: [sine(SAMPLE_RATE)], sampleRate: SAMPLE_RATE, bitrateKbps: 64 });
    const done = posted.at(-1);
    expect(done?.type).toBe('done');
  });

  it('posts an error message when encoding throws an Error', async () => {
    const send = await loadWorker();
    send(undefined as unknown as Mp3EncodeRequest);
    expect(posted).toHaveLength(1);
    expect(posted[0].type).toBe('error');
  });

  it('stringifies non-Error failures', async () => {
    vi.doMock('@breezystack/lamejs', () => ({
      Mp3Encoder: class {
        encodeBuffer() {
          throw 'boom';
        }
        flush() {
          return new Int8Array();
        }
      },
    }));
    const send = await loadWorker();
    send({ channels: [sine(10)], sampleRate: SAMPLE_RATE, bitrateKbps: 128 });
    expect(posted).toEqual([{ type: 'error', message: 'boom' }]);
  });

  it('finishes with no chunks when the request carries no channels', async () => {
    vi.doMock('@breezystack/lamejs', () => ({
      Mp3Encoder: class {
        flush() {
          return new Int8Array();
        }
      },
    }));
    const send = await loadWorker();
    send({ channels: [], sampleRate: SAMPLE_RATE, bitrateKbps: 128 });
    expect(posted).toEqual([{ type: 'done', chunks: [] }]);
  });

  it('skips empty chunks and tail from the encoder', async () => {
    vi.doMock('@breezystack/lamejs', () => ({
      Mp3Encoder: class {
        encodeBuffer() {
          return new Int8Array();
        }
        flush() {
          return new Int8Array();
        }
      },
    }));
    const send = await loadWorker();
    send({ channels: [sine(100)], sampleRate: SAMPLE_RATE, bitrateKbps: 128 });
    expect(posted.at(-1)).toEqual({ type: 'done', chunks: [] });
  });
});
