/** Writes 16-bit PCM WAV files; also holds the float to int16 conversion the MP3 worker shares. */

const WAV_HEADER_BYTES = 44;
const BYTES_PER_SAMPLE = 2;
const PCM_FORMAT = 1;
const BITS_PER_SAMPLE = 16;
const FMT_CHUNK_BYTES = 16;
const INT16_MAX = 0x7fff;
const INT16_MIN_MAGNITUDE = 0x8000;

/** Converts one float sample (-1..1) to int16, clipping anything outside the range. */
export function floatToInt16(sample: number): number {
  const clipped = Math.max(-1, Math.min(1, sample));
  return clipped < 0 ? Math.round(clipped * INT16_MIN_MAGNITUDE) : Math.round(clipped * INT16_MAX);
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
}

function writeHeader(
  view: DataView,
  options: { channels: number; sampleRate: number; dataBytes: number },
) {
  const { channels, sampleRate, dataBytes } = options;
  const blockAlign = channels * BYTES_PER_SAMPLE;
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, WAV_HEADER_BYTES - 8 + dataBytes, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, FMT_CHUNK_BYTES, true);
  view.setUint16(20, PCM_FORMAT, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, BITS_PER_SAMPLE, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataBytes, true);
}

/** Interleaves `channels` (equal length, -1..1 floats) into a 16-bit PCM WAV file. */
export function encodeWav(
  channels: readonly Float32Array[],
  sampleRate: number,
): Uint8Array<ArrayBuffer> {
  const frames = channels[0]?.length ?? 0;
  const dataBytes = frames * channels.length * BYTES_PER_SAMPLE;
  const bytes = new Uint8Array(WAV_HEADER_BYTES + dataBytes);
  const view = new DataView(bytes.buffer);
  writeHeader(view, { channels: channels.length, sampleRate, dataBytes });
  let offset = WAV_HEADER_BYTES;
  for (let frame = 0; frame < frames; frame++) {
    for (const channel of channels) {
      view.setInt16(offset, floatToInt16(channel[frame]), true);
      offset += BYTES_PER_SAMPLE;
    }
  }
  return bytes;
}

/** Exact byte length encodeWav produces, for size estimates. */
export function wavByteLength(frames: number, channels: number): number {
  return WAV_HEADER_BYTES + frames * channels * BYTES_PER_SAMPLE;
}
