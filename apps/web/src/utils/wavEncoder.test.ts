import { describe, expect, it } from 'vitest';

import { encodeWav, floatToInt16, wavByteLength } from '@/utils/wavEncoder';

const ascii = (view: DataView, offset: number, length: number) =>
  String.fromCharCode(...Array.from({ length }, (_, i) => view.getUint8(offset + i)));

describe('floatToInt16', () => {
  it.each([
    [0, 0],
    [1, 32767],
    [-1, -32768],
    [0.5, 16384],
    [-0.5, -16384],
  ])('maps %d to %d', (input, expected) => {
    expect(floatToInt16(input)).toBe(expected);
  });

  it('clips values outside -1..1', () => {
    expect(floatToInt16(3)).toBe(32767);
    expect(floatToInt16(-3)).toBe(-32768);
  });
});

describe('encodeWav', () => {
  const left = new Float32Array([0, 0.5, -1]);
  const right = new Float32Array([1, -0.5, 0]);

  it('writes a valid stereo RIFF/WAVE header', () => {
    const bytes = encodeWav([left, right], 44100);
    const view = new DataView(bytes.buffer);
    expect(ascii(view, 0, 4)).toBe('RIFF');
    expect(ascii(view, 8, 4)).toBe('WAVE');
    expect(ascii(view, 12, 4)).toBe('fmt ');
    expect(ascii(view, 36, 4)).toBe('data');
    expect(view.getUint32(4, true)).toBe(bytes.length - 8);
    expect(view.getUint32(16, true)).toBe(16);
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(2);
    expect(view.getUint32(24, true)).toBe(44100);
    expect(view.getUint32(28, true)).toBe(44100 * 4);
    expect(view.getUint16(32, true)).toBe(4);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(40, true)).toBe(12);
  });

  it('has the expected byte length and interleaves samples frame by frame', () => {
    const bytes = encodeWav([left, right], 48000);
    const view = new DataView(bytes.buffer);
    expect(bytes.length).toBe(44 + 3 * 2 * 2);
    const samples = Array.from({ length: 6 }, (_, i) => view.getInt16(44 + i * 2, true));
    expect(samples).toEqual([0, 32767, 16384, -16384, -32768, 0]);
  });

  it('encodes mono with one channel per frame', () => {
    const bytes = encodeWav([left], 8000);
    const view = new DataView(bytes.buffer);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint16(32, true)).toBe(2);
    expect(bytes.length).toBe(44 + 6);
  });

  it('produces a header-only file for no channels', () => {
    const bytes = encodeWav([], 44100);
    expect(bytes.length).toBe(44);
    expect(new DataView(bytes.buffer).getUint32(40, true)).toBe(0);
  });
});

describe('wavByteLength', () => {
  it('matches the length encodeWav produces', () => {
    const channels = [new Float32Array(100), new Float32Array(100)];
    expect(wavByteLength(100, 2)).toBe(encodeWav(channels, 44100).length);
  });

  it('is just the header for zero frames', () => {
    expect(wavByteLength(0, 2)).toBe(44);
  });
});
