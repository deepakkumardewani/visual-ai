/**
 * Single home of every media (audio, speech, video, tool) limit.
 * Source: agent_docs/media-studio/SPEC.md sections 4, 5 and 11.
 * Import these from API schemas and web UI; never redeclare a limit elsewhere.
 */

const BYTES_PER_MB = 1024 * 1024;
const SECONDS_PER_MINUTE = 60;

// ── Credits UX ───────────────────────────────────────────────────────────────

/** Jobs at or above this credit cost need an explicit confirmation dialog (R-VID-4). */
export const EXPENSIVE_JOB_CREDITS = 150;

// ── Prompts and exports ──────────────────────────────────────────────────────

/** Upper bound on free-text prompts for models whose registry entry sets no `prompt.max`. */
export const MEDIA_PROMPT_MAX_CHARS = 2000;
/** Largest edited audio/video file accepted when saving a new version. */
export const MAX_VERSION_FILE_BYTES = 50 * BYTES_PER_MB;

// ── Voices ───────────────────────────────────────────────────────────────────

/** Cloned voices one user may hold (gap G5). */
export const MAX_VOICES_PER_USER = 10;
export const VOICE_SAMPLE_MIN_SEC = 10;
export const VOICE_SAMPLE_MAX_SEC = 5 * SECONDS_PER_MINUTE;
/** Voice sample must be strictly smaller than this. */
export const VOICE_SAMPLE_MAX_BYTES = 20 * BYTES_PER_MB;
export const VOICE_SAMPLE_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/x-wav',
] as const;

// ── Music and song ───────────────────────────────────────────────────────────

/** Lyria 2 always returns a fixed-length clip. */
export const LYRIA_CLIP_SEC = 30;

export const MUSIC_26_LYRICS = { min: 1, max: 3500 } as const;
export const MUSIC_26_PROMPT = { min: 0, max: 2000 } as const;
export const MUSIC_15_LYRICS = { min: 10, max: 600 } as const;
export const MUSIC_15_PROMPT = { min: 10, max: 300 } as const;

/** Song studio request limits (SPEC R-SONG-1, R-SONG-2): style description and lyrics. */
export const SONG_PROMPT_LIMITS = { min: 10, max: 300 } as const;
export const SONG_LYRICS_LIMITS = { min: 10, max: 3000 } as const;

export const STABLE_AUDIO_DURATION_SEC = { min: 1, max: 190, default: 30 } as const;
export const STABLE_AUDIO_STEPS = { min: 4, max: 8, default: 8 } as const;
export const STABLE_AUDIO_CFG_SCALE = { min: 1, max: 25, default: 1 } as const;

// ── Speech ───────────────────────────────────────────────────────────────────

export const INWORLD_TEXT_LIMIT = 2000;
export const MINIMAX_SPEECH_TEXT_LIMIT = 10000;
export const CHATTERBOX_TEXT_LIMIT = 500;

/** Credit pricing is per 1,000 billed characters or tokens. */
export const TTS_BILLING_UNIT_CHARS = 1000;

// ── Video ────────────────────────────────────────────────────────────────────

export const P_VIDEO_MIN_SEC = 1;
export const P_VIDEO_MAX_SEC = 20;
export const P_VIDEO_DEFAULT_SEC = 5;
/** Cap for the P-Video audio-track upload (R-INF-2; SPEC names the constant, not the size). */
export const MAX_VIDEO_AUDIO_BYTES = 20 * BYTES_PER_MB;

export const WAN_MIN_SEC = 2;
export const WAN_MAX_SEC = 30;
export const WAN_DEFAULT_SEC = 5;
export const WAN_MAX_SEED = 2147483647;
/** Wan 3 first-frame image cap. */
export const WAN_FIRST_FRAME_MAX_BYTES = 10 * BYTES_PER_MB;

// ── Tools ────────────────────────────────────────────────────────────────────

export const MAX_TOOL_VIDEO_SECONDS = 120;
export const MAX_TOOL_VIDEO_BYTES = 100 * BYTES_PER_MB;
export const IMAGE_WATERMARK_TEXT_LIMIT = 500;
export const VIDEO_WATERMARK_SIZE = { min: 1, max: 500, default: 40 } as const;

// ── Editor and export ────────────────────────────────────────────────────────

/** Offline-render memory cap: a 6-minute stereo 48 kHz Float32 render is about 138 MB. */
export const EXPORT_PCM_CAP_BYTES = 256 * BYTES_PER_MB;
/** Waveform peak buckets stored and rendered per asset. */
export const EDITOR_PEAK_BUCKETS = 1000;
