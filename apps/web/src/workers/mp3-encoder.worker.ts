/// <reference lib="webworker" />
import { Mp3Encoder } from '@breezystack/lamejs';

import { floatToInt16 } from '@/utils/wavEncoder';

/** A multiple of the MP3 frame size (1152); small enough that progress ticks stay frequent. */
const FRAMES_PER_CHUNK = 1152 * 32;

export interface Mp3EncodeRequest {
  channels: Float32Array[];
  sampleRate: number;
  bitrateKbps: number;
}

export type Mp3WorkerMessage =
  | { type: 'progress'; ratio: number }
  | { type: 'done'; chunks: Uint8Array<ArrayBuffer>[] }
  | { type: 'error'; message: string };

function toInt16(source: Float32Array, from: number, to: number): Int16Array {
  const out = new Int16Array(to - from);
  for (let i = from; i < to; i++) out[i - from] = floatToInt16(source[i]);
  return out;
}

function encode({ channels, sampleRate, bitrateKbps }: Mp3EncodeRequest) {
  const encoder = new Mp3Encoder(channels.length, sampleRate, bitrateKbps);
  const frames = channels[0]?.length ?? 0;
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  for (let from = 0; from < frames; from += FRAMES_PER_CHUNK) {
    const to = Math.min(from + FRAMES_PER_CHUNK, frames);
    const [left, right] = channels.map((channel) => toInt16(channel, from, to));
    const chunk = encoder.encodeBuffer(left, right);
    if (chunk.length > 0) chunks.push(new Uint8Array(chunk));
    post({ type: 'progress', ratio: to / frames });
  }
  const tail = encoder.flush();
  if (tail.length > 0) chunks.push(new Uint8Array(tail));
  post({ type: 'done', chunks });
}

function post(message: Mp3WorkerMessage) {
  self.postMessage(message);
}

self.onmessage = (event: MessageEvent<Mp3EncodeRequest>) => {
  try {
    encode(event.data);
  } catch (error) {
    post({
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
