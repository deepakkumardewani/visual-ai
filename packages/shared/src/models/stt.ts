/** Maximum Grok recording length before auto-stop (seconds). */
export const STT_MAX_CLIP_SECONDS = 60;

/** Per-user STT rate limit (requests per window). */
export const STT_RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 20 } as const;

/** Max upload size for STT audio (5 MB). */
export const STT_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Mean frequency-bin level (0-1) a recording must reach at least once to be sent for
 * transcription; quieter clips are treated as silence and skip the paid /stt call.
 */
export const STT_SILENCE_LEVEL_THRESHOLD = 0.02;
