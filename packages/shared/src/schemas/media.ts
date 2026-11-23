import { z } from 'zod';

import {
  MEDIA_PROMPT_MAX_CHARS,
  SONG_LYRICS_LIMITS,
  SONG_PROMPT_LIMITS,
} from '../models/media-limits.js';

/** Fields every media request carries; cost and userId are never accepted from the client. */
const mediaRequestBase = {
  jobId: z.string().uuid('jobId must be a UUID'),
  modelKey: z.string().min(1, 'modelKey is required'),
};

export const MusicRequestSchema = z.object({
  ...mediaRequestBase,
  prompt: z.string().min(1, 'Prompt is required').max(MEDIA_PROMPT_MAX_CHARS),
  negativePrompt: z.string().max(MEDIA_PROMPT_MAX_CHARS).optional(),
  seed: z.number().int().optional(),
});

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
