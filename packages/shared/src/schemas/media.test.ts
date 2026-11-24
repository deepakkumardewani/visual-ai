import { describe, expect, it } from 'vitest';
import {
  LYRICS_CONDENSE_INPUT_MAX_CHARS,
  LYRICS_THEME_MAX_CHARS,
  LyricsRequestSchema,
  MUSIC_STUDIO_MODEL_KEYS,
  MusicRequestSchema,
  SongRequestSchema,
  SPEECH_MODEL_KEYS,
  SpeechRequestSchema,
} from './media.js';
import {
  MEDIA_PROMPT_MAX_CHARS,
  SONG_LYRICS_LIMITS,
  SONG_PROMPT_LIMITS,
  STABLE_AUDIO_CFG_SCALE,
  STABLE_AUDIO_DURATION_SEC,
  STABLE_AUDIO_STEPS,
} from '../models/media-limits.js';

const JOB_ID = '3f2b8c1e-5d4a-4e6f-8a9b-1c2d3e4f5a6b';

function music(overrides: Record<string, unknown>) {
  return MusicRequestSchema.safeParse({
    jobId: JOB_ID,
    modelKey: 'STABLE_AUDIO_25',
    prompt: 'calm piano',
    ...overrides,
  });
}

function issuePaths(result: ReturnType<typeof music>): string[] {
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
}

describe('MUSIC_STUDIO_MODEL_KEYS', () => {
  it('lists the three studio models', () => {
    expect([...MUSIC_STUDIO_MODEL_KEYS]).toEqual([
      'STABLE_AUDIO_25',
      'LYRIA_2',
      'MINIMAX_MUSIC_26',
    ]);
  });
});

describe('MusicRequestSchema', () => {
  it('accepts a minimal Stable Audio request', () => {
    expect(music({}).success).toBe(true);
  });

  it('rejects a non-UUID jobId, an empty modelKey and an empty prompt', () => {
    expect(issuePaths(music({ jobId: 'abc' }))).toContain('jobId');
    expect(issuePaths(music({ modelKey: '' }))).toContain('modelKey');
    expect(issuePaths(music({ prompt: '' }))).toContain('prompt');
  });

  it('rejects a prompt over the media prompt limit', () => {
    expect(music({ prompt: 'a'.repeat(MEDIA_PROMPT_MAX_CHARS) }).success).toBe(true);
    expect(issuePaths(music({ prompt: 'a'.repeat(MEDIA_PROMPT_MAX_CHARS + 1) }))).toContain(
      'prompt',
    );
  });

  it('accepts Stable Audio durations at both range boundaries', () => {
    expect(music({ durationSec: STABLE_AUDIO_DURATION_SEC.min }).success).toBe(true);
    expect(music({ durationSec: STABLE_AUDIO_DURATION_SEC.max }).success).toBe(true);
  });

  it('rejects Stable Audio durations just outside the range with a field-level issue', () => {
    const below = music({ durationSec: STABLE_AUDIO_DURATION_SEC.min - 1 });
    const above = music({ durationSec: STABLE_AUDIO_DURATION_SEC.max + 1 });

    expect(issuePaths(below)).toEqual(['durationSec']);
    expect(issuePaths(above)).toEqual(['durationSec']);
    expect(!above.success && above.error.issues[0]?.message).toBe(
      `durationSec must be between ${STABLE_AUDIO_DURATION_SEC.min} and ${STABLE_AUDIO_DURATION_SEC.max}`,
    );
  });

  it('rejects a non-integer duration', () => {
    expect(issuePaths(music({ durationSec: 10.5 }))).toContain('durationSec');
  });

  it('bounds steps and cfgScale to the Stable Audio ranges', () => {
    expect(
      music({ steps: STABLE_AUDIO_STEPS.min, cfgScale: STABLE_AUDIO_CFG_SCALE.max }).success,
    ).toBe(true);
    expect(issuePaths(music({ steps: STABLE_AUDIO_STEPS.max + 1 }))).toEqual(['steps']);
    expect(issuePaths(music({ cfgScale: STABLE_AUDIO_CFG_SCALE.min - 0.5 }))).toEqual(['cfgScale']);
  });

  it('leaves a duration to the API when the model declares none (Lyria)', () => {
    expect(music({ modelKey: 'LYRIA_2', durationSec: 9999 }).success).toBe(true);
  });

  it('leaves an unknown modelKey to the API', () => {
    expect(music({ modelKey: 'NOPE', durationSec: 9999 }).success).toBe(true);
  });

  it('treats a prototype-chain modelKey as unknown', () => {
    expect(music({ modelKey: 'toString', durationSec: 9999 }).success).toBe(true);
  });

  it('requires instrumental true for Minimax 2.6', () => {
    expect(issuePaths(music({ modelKey: 'MINIMAX_MUSIC_26' }))).toEqual(['instrumental']);
    expect(issuePaths(music({ modelKey: 'MINIMAX_MUSIC_26', instrumental: false }))).toEqual([
      'instrumental',
    ]);
    expect(music({ modelKey: 'MINIMAX_MUSIC_26', instrumental: true }).success).toBe(true);
  });

  it('does not require instrumental for models without that switch', () => {
    expect(music({ modelKey: 'LYRIA_2' }).success).toBe(true);
  });

  it('strips cost and quantity the client may send', () => {
    const result = music({ credits: 0, quantity: 99 });

    expect(result.success && result.data).not.toHaveProperty('credits');
    expect(result.success && result.data).not.toHaveProperty('quantity');
  });
});

describe('SongRequestSchema', () => {
  const lyrics = '[Verse]\nHello there';

  it('accepts a valid body and strips model, format and cost fields', () => {
    const result = SongRequestSchema.safeParse({
      jobId: JOB_ID,
      prompt: 'upbeat indie pop',
      lyrics,
      audioFormat: 'wav',
      modelKey: 'LYRIA_2',
    });

    expect(result.success && result.data).toEqual({
      jobId: JOB_ID,
      prompt: 'upbeat indie pop',
      lyrics,
    });
  });

  it('trims the style and enforces its length bounds', () => {
    const body = (prompt: string) => SongRequestSchema.safeParse({ jobId: JOB_ID, prompt, lyrics });

    expect(body(' '.repeat(5) + 'a'.repeat(SONG_PROMPT_LIMITS.min - 1)).success).toBe(false);
    expect(body('a'.repeat(SONG_PROMPT_LIMITS.min)).success).toBe(true);
    expect(body('a'.repeat(SONG_PROMPT_LIMITS.max)).success).toBe(true);
    expect(body('a'.repeat(SONG_PROMPT_LIMITS.max + 1)).success).toBe(false);
  });

  it('enforces the lyrics length bounds', () => {
    const body = (text: string) =>
      SongRequestSchema.safeParse({ jobId: JOB_ID, prompt: 'upbeat indie pop', lyrics: text });

    expect(body('a'.repeat(SONG_LYRICS_LIMITS.min - 1)).success).toBe(false);
    expect(body('a'.repeat(SONG_LYRICS_LIMITS.max)).success).toBe(true);
    expect(body('a'.repeat(SONG_LYRICS_LIMITS.max + 1)).success).toBe(false);
  });

  it('rejects lyrics that are only whitespace', () => {
    const result = SongRequestSchema.safeParse({
      jobId: JOB_ID,
      prompt: 'upbeat indie pop',
      lyrics: ' '.repeat(SONG_LYRICS_LIMITS.min),
    });

    expect(!result.success && result.error.issues[0]?.message).toBe(
      'Lyrics must contain at least one line',
    );
  });
});

describe('LyricsRequestSchema', () => {
  it('accepts full mode with a trimmed theme', () => {
    const result = LyricsRequestSchema.safeParse({ mode: 'full', theme: '  summer road trip ' });

    expect(result.success && result.data).toEqual({ mode: 'full', theme: 'summer road trip' });
  });

  it('rejects an empty or over-long theme', () => {
    expect(LyricsRequestSchema.safeParse({ mode: 'full', theme: '   ' }).success).toBe(false);
    expect(
      LyricsRequestSchema.safeParse({ mode: 'full', theme: 'a'.repeat(LYRICS_THEME_MAX_CHARS + 1) })
        .success,
    ).toBe(false);
  });

  it('accepts section mode with and without a theme', () => {
    expect(
      LyricsRequestSchema.safeParse({ mode: 'section', section: '[Chorus]\nla' }).success,
    ).toBe(true);
    expect(
      LyricsRequestSchema.safeParse({ mode: 'section', section: '[Chorus]\nla', theme: 'joy' })
        .success,
    ).toBe(true);
  });

  it('rejects an empty section', () => {
    expect(LyricsRequestSchema.safeParse({ mode: 'section', section: ' ' }).success).toBe(false);
  });

  it('accepts condense text over the song limit but not over its own cap', () => {
    const over = 'a'.repeat(SONG_LYRICS_LIMITS.max + 1);

    expect(LyricsRequestSchema.safeParse({ mode: 'condense', lyrics: over }).success).toBe(true);
    expect(
      LyricsRequestSchema.safeParse({
        mode: 'condense',
        lyrics: 'a'.repeat(LYRICS_CONDENSE_INPUT_MAX_CHARS + 1),
      }).success,
    ).toBe(false);
    expect(LyricsRequestSchema.safeParse({ mode: 'condense', lyrics: '' }).success).toBe(false);
  });

  it('rejects an unknown mode', () => {
    expect(LyricsRequestSchema.safeParse({ mode: 'poem', theme: 'x' }).success).toBe(false);
  });
});

describe('SpeechRequestSchema', () => {
  const LIMITS = {
    INWORLD_TTS_2: 2000,
    INWORLD_TTS_15_MAX: 2000,
    MINIMAX_SPEECH_28_HD: 10000,
    MINIMAX_SPEECH_28_TURBO: 10000,
    CHATTERBOX_TURBO: 500,
  } as const;

  function speech(overrides: Record<string, unknown>) {
    return SpeechRequestSchema.safeParse({
      jobId: JOB_ID,
      modelKey: 'INWORLD_TTS_2',
      text: 'Hello there',
      ...overrides,
    });
  }

  function firstIssue(result: ReturnType<typeof speech>) {
    return result.success ? undefined : result.error.issues[0];
  }

  it('offers exactly the five speech models and excludes voice cloning', () => {
    expect([...SPEECH_MODEL_KEYS].sort()).toEqual(Object.keys(LIMITS).sort());
    expect(SPEECH_MODEL_KEYS).not.toContain('MINIMAX_VOICE_CLONE');
  });

  it('accepts a minimal valid body', () => {
    expect(speech({}).success).toBe(true);
  });

  it.each(Object.entries(LIMITS))(
    'accepts %s text at its %i-character limit',
    (modelKey, limit) => {
      expect(speech({ modelKey, text: 'a'.repeat(limit) }).success).toBe(true);
    },
  );

  it.each(Object.entries(LIMITS))(
    'rejects %s text one past its %i-character limit on the text field',
    (modelKey, limit) => {
      const issue = firstIssue(speech({ modelKey, text: 'a'.repeat(limit + 1) }));

      expect(issue?.path).toEqual(['text']);
      expect(issue?.message).toBe(`Text must be at most ${limit} characters for this model`);
    },
  );

  it.each([
    ['empty', ''],
    ['whitespace only', ' \n\t '],
  ])('rejects %s text', (_name, text) => {
    const issue = firstIssue(speech({ text }));

    expect(issue?.path).toEqual(['text']);
    expect(issue?.message).toBe('Text is required');
  });

  it.each(['MINIMAX_VOICE_CLONE', 'LYRIA_2', 'NOT_A_MODEL'])(
    'rejects the non-speech model key %s on the modelKey field',
    (modelKey) => {
      expect(firstIssue(speech({ modelKey }))?.path).toEqual(['modelKey']);
    },
  );

  it('rejects an optional short field over 100 characters', () => {
    expect(speech({ voice: 'v'.repeat(101) }).success).toBe(false);
    expect(speech({ voice: 'v'.repeat(100) }).success).toBe(true);
  });

  it('does not carry an unknown client count through to the parsed data', () => {
    const result = speech({ chars: 1, creditCost: 0 });

    expect(result.success && 'chars' in result.data).toBe(false);
    expect(result.success && 'creditCost' in result.data).toBe(false);
  });
});
