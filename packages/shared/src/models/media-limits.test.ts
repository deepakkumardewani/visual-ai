import { describe, expect, it } from 'vitest';
import * as limits from './media-limits.js';

const MB = 1024 * 1024;

describe('media limits', () => {
  it('sets the confirmation threshold and voice cap from the spec', () => {
    expect(limits.EXPENSIVE_JOB_CREDITS).toBe(150);
    expect(limits.MAX_VOICES_PER_USER).toBe(10);
  });

  it('bounds the voice sample by length, size and mime type', () => {
    expect(limits.VOICE_SAMPLE_MIN_SEC).toBe(10);
    expect(limits.VOICE_SAMPLE_MAX_SEC).toBe(300);
    expect(limits.VOICE_SAMPLE_MAX_BYTES).toBe(20 * MB);
    expect([...limits.VOICE_SAMPLE_MIME_TYPES].sort()).toEqual(
      ['audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/x-wav'].sort(),
    );
  });

  it('keeps per-model text limits in the documented order', () => {
    expect(limits.INWORLD_TEXT_LIMIT).toBe(2000);
    expect(limits.MINIMAX_SPEECH_TEXT_LIMIT).toBe(10000);
    expect(limits.CHATTERBOX_TEXT_LIMIT).toBe(500);
    expect(limits.TTS_BILLING_UNIT_CHARS).toBe(1000);
  });

  it('defines music prompt and lyrics ranges', () => {
    expect(limits.MUSIC_26_LYRICS).toEqual({ min: 1, max: 3500 });
    expect(limits.MUSIC_26_PROMPT).toEqual({ min: 0, max: 2000 });
    expect(limits.MUSIC_15_LYRICS).toEqual({ min: 10, max: 600 });
    expect(limits.MUSIC_15_PROMPT).toEqual({ min: 10, max: 300 });
    expect(limits.LYRIA_CLIP_SEC).toBe(30);
  });

  it.each([
    ['STABLE_AUDIO_DURATION_SEC', limits.STABLE_AUDIO_DURATION_SEC, 1, 190, 30],
    ['STABLE_AUDIO_STEPS', limits.STABLE_AUDIO_STEPS, 4, 8, 8],
    ['STABLE_AUDIO_CFG_SCALE', limits.STABLE_AUDIO_CFG_SCALE, 1, 25, 1],
    ['VIDEO_WATERMARK_SIZE', limits.VIDEO_WATERMARK_SIZE, 1, 500, 40],
  ])('%s has min, max and an in-range default', (_name, range, min, max, def) => {
    expect(range).toEqual({ min, max, default: def });
    expect(range.default).toBeGreaterThanOrEqual(range.min);
    expect(range.default).toBeLessThanOrEqual(range.max);
  });

  it('defines video duration ranges with defaults inside them', () => {
    expect([limits.P_VIDEO_MIN_SEC, limits.P_VIDEO_DEFAULT_SEC, limits.P_VIDEO_MAX_SEC]).toEqual([
      1, 5, 20,
    ]);
    expect([limits.WAN_MIN_SEC, limits.WAN_DEFAULT_SEC, limits.WAN_MAX_SEC]).toEqual([2, 5, 30]);
    expect(limits.WAN_MAX_SEED).toBe(2 ** 31 - 1);
  });

  it('caps uploads and tool inputs in bytes and seconds', () => {
    expect(limits.MAX_VIDEO_AUDIO_BYTES).toBe(20 * MB);
    expect(limits.WAN_FIRST_FRAME_MAX_BYTES).toBe(10 * MB);
    expect(limits.MAX_TOOL_VIDEO_SECONDS).toBe(120);
    expect(limits.MAX_TOOL_VIDEO_BYTES).toBe(100 * MB);
    expect(limits.IMAGE_WATERMARK_TEXT_LIMIT).toBe(500);
  });

  it('caps editor export memory and waveform resolution', () => {
    expect(limits.EXPORT_PCM_CAP_BYTES).toBe(256 * MB);
    expect(limits.EDITOR_PEAK_BUCKETS).toBe(1000);
  });
});
