import { z } from 'zod';

import {
  MEDIA_PROMPT_MAX_CHARS,
  SONG_LYRICS_LIMITS,
  SONG_PROMPT_LIMITS,
  STABLE_AUDIO_CFG_SCALE,
  STABLE_AUDIO_STEPS,
} from '../models/media-limits.js';
import { MODEL_REGISTRY } from '../models/registry.js';
import type { MediaModelConfig } from '../models/types.js';

/** Fields every media request carries; cost and userId are never accepted from the client. */
const mediaRequestBase = {
  jobId: z.string().uuid('jobId must be a UUID'),
  modelKey: z.string().min(1, 'modelKey is required'),
};

/** Models the Music studio offers; Minimax 2.6 is served here only as an instrumental. */
export const MUSIC_STUDIO_MODEL_KEYS = ['STABLE_AUDIO_25', 'LYRIA_2', 'MINIMAX_MUSIC_26'] as const;
export type MusicStudioModelKey = (typeof MUSIC_STUDIO_MODEL_KEYS)[number];

type NumericRange = { min: number; max: number };

/** Resolves the documented range of a numeric music field for one model, or undefined if unbounded. */
const MUSIC_FIELD_RANGES: Record<string, (media: MediaModelConfig) => NumericRange | undefined> = {
  durationSec: (media) => media.durationSec,
  steps: () => STABLE_AUDIO_STEPS,
  cfgScale: () => STABLE_AUDIO_CFG_SCALE,
};

function mediaConfigOf(modelKey: string): MediaModelConfig | undefined {
  return Object.hasOwn(MODEL_REGISTRY, modelKey)
    ? MODEL_REGISTRY[modelKey as keyof typeof MODEL_REGISTRY]?.media
    : undefined;
}

/**
 * Model-dependent rules, driven by the registry (no per-model branches). Fields a model does not
 * declare are rejected by the API's validateMediaParams; here only declared fields are bounded.
 * An unknown modelKey is left to the API so its error message stays unchanged.
 */
function refineMusicRequest(
  request: { modelKey: string } & Record<string, unknown>,
  ctx: z.RefinementCtx,
): void {
  const media = mediaConfigOf(request.modelKey);
  if (!media) return;

  for (const [field, rangeOf] of Object.entries(MUSIC_FIELD_RANGES)) {
    const value = request[field];
    const range = rangeOf(media);
    if (typeof value !== 'number' || !range || !Object.hasOwn(media.inputs, field)) continue;
    if (value < range.min || value > range.max) {
      ctx.addIssue({
        code: 'custom',
        path: [field],
        message: `${field} must be between ${range.min} and ${range.max}`,
      });
    }
  }

  // The studio has no lyrics step, so a model with an instrumental switch must have it on.
  if (Object.hasOwn(media.inputs, 'instrumental') && request.instrumental !== true) {
    ctx.addIssue({
      code: 'custom',
      path: ['instrumental'],
      message: 'instrumental must be true for this model in the Music studio',
    });
  }
}

/**
 * Music body. The optional fields are only valid for models whose registry inputs declare them;
 * cost and quantity are never accepted from the client.
 */
export const MusicRequestSchema = z
  .object({
    ...mediaRequestBase,
    prompt: z.string().min(1, 'Prompt is required').max(MEDIA_PROMPT_MAX_CHARS),
    negativePrompt: z.string().max(MEDIA_PROMPT_MAX_CHARS).optional(),
    seed: z.number().int().optional(),
    durationSec: z.number().int().optional(),
    steps: z.number().int().optional(),
    cfgScale: z.number().optional(),
    instrumental: z.boolean().optional(),
  })
  .superRefine(refineMusicRequest);

export type MusicRequest = z.infer<typeof MusicRequestSchema>;

/**
 * Song body: the model, output format and cost are fixed server-side, so none of them is accepted.
 * Unknown keys (such as audioFormat) are stripped by zod and never reach Replicate.
 */
export const SongRequestSchema = z.object({
  jobId: mediaRequestBase.jobId,
  prompt: z
    .string()
    .trim()
    .min(SONG_PROMPT_LIMITS.min, `Style must be at least ${SONG_PROMPT_LIMITS.min} characters`)
    .max(SONG_PROMPT_LIMITS.max, `Style must be at most ${SONG_PROMPT_LIMITS.max} characters`),
  lyrics: z
    .string()
    .min(SONG_LYRICS_LIMITS.min, `Lyrics must be at least ${SONG_LYRICS_LIMITS.min} characters`)
    .max(SONG_LYRICS_LIMITS.max, `Lyrics must be at most ${SONG_LYRICS_LIMITS.max} characters`)
    .refine((lyrics) => lyrics.trim().length > 0, 'Lyrics must contain at least one line'),
});

export type SongRequest = z.infer<typeof SongRequestSchema>;

/** Lyrics assist inputs: a theme is short, section and condense carry user lyrics. */
export const LYRICS_THEME_MAX_CHARS = 300;
/** Condense accepts text over the song limit (that is its purpose), but not unbounded text. */
export const LYRICS_CONDENSE_INPUT_MAX_CHARS = 12000;

export const LYRICS_MODES = ['full', 'section', 'condense'] as const;
export type LyricsMode = (typeof LYRICS_MODES)[number];

const lyricsTheme = z.string().trim().min(1, 'Theme is required').max(LYRICS_THEME_MAX_CHARS);

/** POST /prompt/lyrics body (gap G12: three modes multiplexed on one endpoint). */
export const LyricsRequestSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('full'), theme: lyricsTheme }),
  z.object({
    mode: z.literal('section'),
    /** The tagged section to rewrite, tag line included. */
    section: z.string().trim().min(1, 'Section is required').max(SONG_LYRICS_LIMITS.max),
    theme: lyricsTheme.optional(),
  }),
  z.object({
    mode: z.literal('condense'),
    lyrics: z.string().trim().min(1, 'Lyrics are required').max(LYRICS_CONDENSE_INPUT_MAX_CHARS),
  }),
]);

export type LyricsRequest = z.infer<typeof LyricsRequestSchema>;

export interface LyricsResponse {
  lyrics: string;
}

/** Models the Speech studio offers (R-TTS-1); the voice-clone model is also `tts` but never speaks text. */
export const SPEECH_MODEL_KEYS = [
  'INWORLD_TTS_2',
  'INWORLD_TTS_15_MAX',
  'MINIMAX_SPEECH_28_HD',
  'MINIMAX_SPEECH_28_TURBO',
  'CHATTERBOX_TURBO',
] as const;
export type SpeechModelKey = (typeof SPEECH_MODEL_KEYS)[number];

const SPEECH_SHORT_FIELD_MAX_CHARS = 100;

const speechShortText = z.string().max(SPEECH_SHORT_FIELD_MAX_CHARS);

/** The model's own text limit, from the registry; undefined for an unknown or non-speech key. */
function speechTextLimit(modelKey: string): number | undefined {
  if (!(SPEECH_MODEL_KEYS as readonly string[]).includes(modelKey)) return undefined;
  return mediaConfigOf(modelKey)?.textLimit;
}

function refineSpeechRequest(
  request: { modelKey: string; text: string },
  ctx: z.RefinementCtx,
): void {
  const limit = speechTextLimit(request.modelKey);
  if (limit === undefined) {
    ctx.addIssue({
      code: 'custom',
      path: ['modelKey'],
      message: `modelKey must be one of ${SPEECH_MODEL_KEYS.join(', ')}`,
    });
    return;
  }
  if (request.text.length > limit) {
    ctx.addIssue({
      code: 'custom',
      path: ['text'],
      message: `Text must be at most ${limit} characters for this model`,
    });
  }
}

/**
 * Speech body. `text` is the final serialized text (tags already in the model's native syntax);
 * the billable character count is always recomputed from it server-side, so no count or cost is
 * accepted. Which optional fields a model really takes is enforced by validateMediaParams.
 */
export const SpeechRequestSchema = z
  .object({
    ...mediaRequestBase,
    text: z.string().refine((text) => text.trim().length > 0, 'Text is required'),
    voice: speechShortText.optional(),
    language: speechShortText.optional(),
    temperature: z.number().optional(),
    speakingRate: z.number().optional(),
    textNormalization: speechShortText.optional(),
    audioFormat: speechShortText.optional(),
    sampleRate: z.number().int().optional(),
    emotion: speechShortText.optional(),
    speed: z.number().optional(),
    pitch: z.number().optional(),
    volume: z.number().optional(),
    languageBoost: speechShortText.optional(),
    englishNormalization: z.boolean().optional(),
    channel: speechShortText.optional(),
    bitrate: z.number().int().optional(),
    topP: z.number().optional(),
    topK: z.number().int().optional(),
    repetitionPenalty: z.number().optional(),
    seed: z.number().int().optional(),
  })
  .superRefine(refineSpeechRequest);

export type SpeechRequest = z.infer<typeof SpeechRequestSchema>;
