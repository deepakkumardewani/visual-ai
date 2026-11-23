import { computed, onScopeDispose, ref, shallowRef, type Ref } from 'vue';

import type { MediaAssetDto } from '@visual-ai/shared';

import { useHistoryStore } from '@/stores/history';
import type { PlayerTrack } from '@/stores/player';

import { useFetch } from '@/composables/useFetch';
import { outputDuration, outputSampleCount, type EditState } from '@/utils/audioEditMath';
import { createLogger } from '@/utils/logger';
import { encodeWav, wavByteLength } from '@/utils/wavEncoder';
import type { Mp3EncodeRequest, Mp3WorkerMessage } from '@/workers/mp3-encoder.worker';

const log = createLogger('audio-export');

export type ExportFormat = 'mp3' | 'wav';
export type ExportStatus = 'idle' | 'encoding' | 'done' | 'error';

/** Decoded float32 PCM above this fails fast so a long file cannot exhaust browser memory. */
export const EXPORT_PCM_CAP_BYTES = 200 * 1024 * 1024;
export const EXPORT_TOO_LONG_COPY = 'This audio is too long to export in the browser.';
export const EXPORT_FAILED_COPY = 'We could not export this audio. Try again.';
export const SAVE_FAILED_COPY = 'We could not save this version. Try again.';
export const HISTORY_FULL_COPY = 'Your history is full. Delete something to save a new version.';

export const MP3_BITRATE_KBPS = 192;
const MAX_EXPORT_CHANNELS = 2;
const BYTES_PER_FLOAT = 4;
const BITS_PER_BYTE = 8;
const ESTIMATE_SAMPLE_RATE = 44100;
/** Normalized output peaks here, a little under full scale so lossy encoding cannot clip. */
const NORMALIZE_PEAK = 0.98;
const HTTP_CONFLICT = 409;
const MIME_BY_FORMAT: Record<ExportFormat, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
};
const VERSIONS_PATH = (assetId: string) => `/media/assets/${encodeURIComponent(assetId)}/versions`;

export interface ExportResult {
  blob: Blob;
  format: ExportFormat;
  filename: string;
}

export interface DecodedPcm {
  channels: Float32Array[];
  sampleRate: number;
}

export class ExportError extends Error {}
class ExportCancelled extends Error {}

/** Whether decoding `durationSec` of audio would exceed the cap (float32, stereo, worst case). */
export function exceedsPcmCap(durationSec: number, sampleRate = ESTIMATE_SAMPLE_RATE): boolean {
  return durationSec * sampleRate * MAX_EXPORT_CHANNELS * BYTES_PER_FLOAT > EXPORT_PCM_CAP_BYTES;
}

/** Estimated output size in bytes, from the edited length alone (nothing is decoded yet). */
export function estimateExportBytes(edit: EditState, format: ExportFormat): number {
  if (format === 'wav') {
    return wavByteLength(outputSampleCount(edit, ESTIMATE_SAMPLE_RATE), MAX_EXPORT_CHANNELS);
  }
  return Math.round((outputDuration(edit) * MP3_BITRATE_KBPS * 1000) / BITS_PER_BYTE);
}

function applyFades(out: Float32Array, edit: EditState, sampleRate: number, offsets: number[]) {
  edit.segments.forEach((segment, index) => {
    const segmentStart = Math.round(segment.start * sampleRate);
    for (const fade of edit.fades) {
      if (fade.start < segment.start || fade.end > segment.end) continue;
      const from = Math.round(fade.start * sampleRate);
      const length = Math.round(fade.end * sampleRate) - from;
      for (let i = 0; i < length; i++) {
        const progress = length > 1 ? i / (length - 1) : 1;
        out[offsets[index] + from - segmentStart + i] *=
          fade.kind === 'in' ? progress : 1 - progress;
      }
    }
  });
}

function peakOf(channels: Float32Array[]): number {
  let peak = 0;
  for (const channel of channels)
    for (const sample of channel) peak = Math.max(peak, Math.abs(sample));
  return peak;
}

/** Renders the non-destructive edit model to PCM: kept segments joined, fades applied, then normalized. */
export function renderEdit(source: DecodedPcm, edit: EditState): DecodedPcm {
  const { sampleRate } = source;
  const offsets: number[] = [];
  let total = 0;
  for (const segment of edit.segments) {
    offsets.push(total);
    total += Math.round(segment.end * sampleRate) - Math.round(segment.start * sampleRate);
  }
  const channels = source.channels.slice(0, MAX_EXPORT_CHANNELS).map((channel) => {
    const out = new Float32Array(total);
    edit.segments.forEach((segment, index) => {
      const from = Math.round(segment.start * sampleRate);
      const to = Math.round(segment.end * sampleRate);
      out.set(channel.subarray(from, to), offsets[index]);
    });
    applyFades(out, edit, sampleRate, offsets);
    return out;
  });
  const peak = peakOf(channels);
  if (edit.normalize && peak > 0) {
    const gain = NORMALIZE_PEAK / peak;
    for (const channel of channels) for (let i = 0; i < channel.length; i++) channel[i] *= gain;
  }
  return { channels, sampleRate };
}

async function decodeTrack(src: string): Promise<DecodedPcm> {
  const response = await fetch(src);
  if (!response.ok) throw new ExportError(`Audio request failed with ${response.status}`);
  const context = new AudioContext();
  try {
    const buffer = await context.decodeAudioData(await response.arrayBuffer());
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) =>
      buffer.getChannelData(i),
    );
    return { channels, sampleRate: buffer.sampleRate };
  } finally {
    void context.close();
  }
}

function createMp3Worker(): Worker {
  return new Worker(new URL('../workers/mp3-encoder.worker.ts', import.meta.url), {
    type: 'module',
  });
}

function exportFilename(title: string, format: ExportFormat): string {
  const base =
    title
      .trim()
      .replace(/[^\w\- ]+/g, '')
      .replace(/\s+/g, '-') || 'song';
  return `${base}-edit.${format}`;
}

export interface AudioExportSource {
  track: Ref<PlayerTrack>;
  edit: Ref<EditState>;
  /** Duration of the original file in seconds; lets the cap check run before any download. */
  sourceDuration: Ref<number>;
}

export interface AudioExportOptions {
  /** Replaceable so tests can drive the worker without a browser. */
  createWorker?: () => Worker;
  decode?: (src: string) => Promise<DecodedPcm>;
}

/**
 * Renders the edited track to MP3 or WAV in the browser. MP3 encoding runs in a Web Worker so
 * the page stays responsive; `cancel` terminates it and discards any partial output.
 */
export function useAudioExport(source: AudioExportSource, options: AudioExportOptions = {}) {
  const { track, edit, sourceDuration } = source;
  const { createWorker = createMp3Worker, decode = decodeTrack } = options;
  const history = useHistoryStore();

  const status = ref<ExportStatus>('idle');
  const progress = ref(0);
  const errorMessage = ref<string | null>(null);
  const result = shallowRef<ExportResult | null>(null);
  const isSaving = ref(false);
  const saveError = ref<string | null>(null);
  const savedVersion = shallowRef<MediaAssetDto | null>(null);
  const isEncoding = computed(() => status.value === 'encoding');

  let worker: Worker | null = null;
  /** Bumped by cancel so a render still decoding knows to stop before encoding. */
  let runId = 0;
  let rejectActive: ((reason: Error) => void) | null = null;

  function stopWorker() {
    worker?.terminate();
    worker = null;
  }

  function encodeMp3(pcm: DecodedPcm): Promise<Uint8Array<ArrayBuffer>[]> {
    return new Promise((resolve, reject) => {
      rejectActive = reject;
      worker = createWorker();
      worker.onmessage = (event: MessageEvent<Mp3WorkerMessage>) => {
        const message = event.data;
        if (message.type === 'progress') progress.value = message.ratio;
        else if (message.type === 'done') resolve(message.chunks);
        else reject(new ExportError(message.message));
      };
      worker.onerror = (event) => reject(new ExportError(event.message || 'MP3 worker crashed'));
      const request: Mp3EncodeRequest = {
        ...pcm,
        bitrateKbps: MP3_BITRATE_KBPS,
      };
      worker.postMessage(
        request,
        pcm.channels.map((channel) => channel.buffer),
      );
    });
  }

  async function render(format: ExportFormat, id: number): Promise<ExportResult> {
    if (exceedsPcmCap(sourceDuration.value)) throw new ExportError(EXPORT_TOO_LONG_COPY);
    const decoded = await decode(track.value.src);
    if (id !== runId) throw new ExportCancelled();
    const bytes = decoded.channels.reduce((sum, channel) => sum + channel.byteLength, 0);
    if (bytes > EXPORT_PCM_CAP_BYTES) throw new ExportError(EXPORT_TOO_LONG_COPY);
    const pcm = renderEdit(decoded, edit.value);
    const parts: BlobPart[] =
      format === 'wav' ? [encodeWav(pcm.channels, pcm.sampleRate)] : await encodeMp3(pcm);
    return {
      blob: new Blob(parts, { type: MIME_BY_FORMAT[format] }),
      format,
      filename: exportFilename(track.value.title, format),
    };
  }

  async function start(format: ExportFormat) {
    if (isEncoding.value) return;
    reset();
    status.value = 'encoding';
    const id = ++runId;
    try {
      const rendered = await render(format, id);
      if (id !== runId) return;
      result.value = rendered;
      progress.value = 1;
      status.value = 'done';
    } catch (error) {
      // A cancelled or superseded run must not touch state or the newer run's worker.
      if (error instanceof ExportCancelled || id !== runId) return;
      log.error('export failed', { format, error });
      errorMessage.value = error instanceof ExportError ? error.message : EXPORT_FAILED_COPY;
      status.value = 'error';
    } finally {
      if (id === runId) {
        stopWorker();
        rejectActive = null;
      }
    }
  }

  function cancel() {
    if (!isEncoding.value) return;
    runId += 1;
    rejectActive?.(new ExportCancelled());
    stopWorker();
    reset();
  }

  function reset() {
    status.value = 'idle';
    progress.value = 0;
    errorMessage.value = null;
    result.value = null;
    saveError.value = null;
    savedVersion.value = null;
  }

  /** Uploads the rendered file as a new version of `assetId`; costs no credits. */
  async function saveVersion(assetId: string): Promise<boolean> {
    if (!result.value || isSaving.value) return false;
    isSaving.value = true;
    saveError.value = null;
    const form = new FormData();
    form.append('file', result.value.blob, result.value.filename);
    const { data, error, response } = await useFetch(VERSIONS_PATH(assetId), {
      method: 'POST',
      body: form,
    }).json<MediaAssetDto>();
    isSaving.value = false;
    if (error.value || !data.value) {
      const status = response.value?.status ?? 0;
      log.error('save version failed', { assetId, status });
      saveError.value = status === HTTP_CONFLICT ? HISTORY_FULL_COPY : SAVE_FAILED_COPY;
      return false;
    }
    savedVersion.value = data.value;
    history.addMediaAsset(data.value);
    return true;
  }

  onScopeDispose(stopWorker);

  return {
    status,
    progress,
    errorMessage,
    result,
    isEncoding,
    isSaving,
    saveError,
    savedVersion,
    start,
    cancel,
    reset,
    saveVersion,
  };
}
