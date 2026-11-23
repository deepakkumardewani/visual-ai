import { describe, it, expect } from 'vitest';
import {
  DAILY_CREDITS,
  DAILY_RESET_UTC_HOUR,
  PREMIUM_CREDIT_COST,
  REFERRAL_BONUS,
  MEDIA_CREDITS_PER_USD,
  MIN_JOB_CREDITS,
  SIGNUP_CREDITS,
  getCreditCost,
  getDailyCredits,
  getMediaCreditCost,
  type MediaCostInput,
} from './credits.js';
import { PREMIUM_MODEL_KEYS } from './plans.js';
import type { MediaModelKey, ModelKey } from './types.js';

const COST_TABLE: ReadonlyArray<readonly [ModelKey, number, boolean]> = [
  ['FLUX_QUICK', 1, false],
  ['NANO_BANANA_2', 1, false],
  ['BACKGROUND_REMOVER', 2, false],
  ['UPSCALE_TOPAZ', 4, false],
  ['FLUX_REALISM', 5, true],
  ['FLUX_KONTEXT_PRO', 5, true],
  ['FLUX_KONTEXT_MAX', 5, true],
  ['IMAGEN_4_ULTRA', 5, true],
  ['NANO_BANANA_PRO', 5, true],
  ['GPT_IMAGE_2', 5, true],
  ['FLUX_2_PRO', 5, false],
  ['FLUX_1_1_PRO', 5, false],
  ['FLUX_2_MAX', 5, false],
  ['FLUX_PRO', 5, false],
];

describe('getCreditCost', () => {
  it.each(COST_TABLE)('%s costs %i credits (premium: %s)', (key, cost, isPremium) => {
    expect(getCreditCost(key)).toBe(cost);
    expect(PREMIUM_MODEL_KEYS.includes(key)).toBe(isPremium);
  });

  it('throws for a key missing from the registry', () => {
    expect(() => getCreditCost('NOT_A_MODEL' as ModelKey)).toThrow(
      'Unknown model key: NOT_A_MODEL',
    );
  });

  it('prices every premium model at the premium cost', () => {
    expect(PREMIUM_MODEL_KEYS).toHaveLength(6);
    for (const key of PREMIUM_MODEL_KEYS) {
      expect(getCreditCost(key)).toBe(5);
    }
    expect(PREMIUM_CREDIT_COST).toBe(5);
  });
});

describe('getDailyCredits', () => {
  it('gives pro users 50', () => {
    expect(getDailyCredits(true)).toBe(50);
  });

  it('gives free users 30', () => {
    expect(getDailyCredits(false)).toBe(30);
  });

  it('exposes the per-plan table', () => {
    expect(DAILY_CREDITS).toEqual({ free: 30, pro: 50 });
  });
});

describe('credit constants', () => {
  it('uses 30 signup and referral credits and a midnight UTC reset', () => {
    expect(SIGNUP_CREDITS).toBe(30);
    expect(REFERRAL_BONUS).toBe(30);
    expect(DAILY_RESET_UTC_HOUR).toBe(0);
  });
});

describe('getCreditCost for media keys', () => {
  it('refuses media models, which have no flat cost', () => {
    expect(() => getCreditCost('LYRIA_2')).toThrow('No credit cost defined for model: LYRIA_2');
  });
});

const FILE: MediaCostInput = { kind: 'file' };
const RUN: MediaCostInput = { kind: 'run' };
const chars = (n: number): MediaCostInput => ({ kind: 'chars', chars: n });
const secs = (durationSec: number, resolution: string, draft?: boolean): MediaCostInput => ({
  kind: 'seconds',
  durationSec,
  resolution,
  draft,
});
const blocks = (videoSec: number): MediaCostInput => ({ kind: 'blocks', videoSec });

// Every row of SPEC section 8; credits are literals from the spec, not recomputed.
const SPEC_8_ROWS: ReadonlyArray<readonly [string, MediaModelKey, MediaCostInput, number]> = [
  ['Lyria 2 clip', 'LYRIA_2', FILE, 12],
  ['Minimax Music 2.6', 'MINIMAX_MUSIC_26', FILE, 30],
  ['Minimax Music 1.5', 'MINIMAX_MUSIC_15', FILE, 6],
  ['Stable Audio 2.5', 'STABLE_AUDIO_25', FILE, 40],
  ['Inworld 2, 1000 chars', 'INWORLD_TTS_2', chars(1000), 5],
  ['Inworld 2, 2000 chars', 'INWORLD_TTS_2', chars(2000), 10],
  ['Inworld 1.5 Max, 1000 chars', 'INWORLD_TTS_15_MAX', chars(1000), 7],
  ['Inworld 1.5 Max, 2000 chars', 'INWORLD_TTS_15_MAX', chars(2000), 14],
  ['Minimax HD, 1000 chars', 'MINIMAX_SPEECH_28_HD', chars(1000), 20],
  ['Minimax HD, 10000 chars', 'MINIMAX_SPEECH_28_HD', chars(10000), 200],
  ['Minimax Turbo, 1000 chars', 'MINIMAX_SPEECH_28_TURBO', chars(1000), 12],
  ['Minimax Turbo, 10000 chars', 'MINIMAX_SPEECH_28_TURBO', chars(10000), 120],
  ['Chatterbox, 500 chars', 'CHATTERBOX_TURBO', chars(500), 3],
  ['Voice clone', 'MINIMAX_VOICE_CLONE', RUN, 600],
  ['P-Video 720p 5 s', 'P_VIDEO', secs(5, '720p'), 20],
  ['P-Video 720p 20 s', 'P_VIDEO', secs(20, '720p'), 80],
  ['P-Video 1080p 5 s', 'P_VIDEO', secs(5, '1080p'), 40],
  ['P-Video 1080p 20 s', 'P_VIDEO', secs(20, '1080p'), 160],
  ['P-Video draft 720p 5 s', 'P_VIDEO', secs(5, '720p', true), 5],
  ['P-Video draft 1080p 5 s', 'P_VIDEO', secs(5, '1080p', true), 10],
  ['Wan 3 480p 5 s', 'WAN_3', secs(5, '480p'), 35],
  ['Wan 3 480p 30 s', 'WAN_3', secs(30, '480p'), 210],
  ['Wan 3 720p 5 s', 'WAN_3', secs(5, '720p'), 70],
  ['Wan 3 720p 30 s', 'WAN_3', secs(30, '720p'), 420],
  ['Wan 3 1080p 5 s', 'WAN_3', secs(5, '1080p'), 140],
  ['Wan 3 1080p 30 s', 'WAN_3', secs(30, '1080p'), 840],
  ['Image watermark', 'IMAGE_WATERMARK', RUN, 1],
  ['Video watermark', 'VIDEO_WATERMARK', RUN, 1],
  ['Autocaption 30 s', 'AUTOCAPTION', blocks(30), 11],
  ['Autocaption 60 s', 'AUTOCAPTION', blocks(60), 22],
  ['Autocaption 120 s', 'AUTOCAPTION', blocks(120), 44],
];

describe('getMediaCreditCost', () => {
  it('exposes the owner-set rate and the minimum charge', () => {
    expect(MEDIA_CREDITS_PER_USD).toBe(200);
    expect(MIN_JOB_CREDITS).toBe(1);
  });

  it.each(SPEC_8_ROWS)('%s', (_label, key, input, credits) => {
    expect(getMediaCreditCost(key, input)).toBe(credits);
  });

  describe('TTS character boundaries', () => {
    it.each([
      [0, 1],
      [1, 1],
      [1000, 5],
      [2000, 10],
    ])('Inworld 2 with %i chars costs %i', (n, credits) => {
      expect(getMediaCreditCost('INWORLD_TTS_2', chars(n))).toBe(credits);
    });

    it('charges the minimum for zero characters on the priciest TTS model', () => {
      expect(getMediaCreditCost('MINIMAX_SPEECH_28_HD', chars(0))).toBe(MIN_JOB_CREDITS);
    });

    it('rounds a partial thousand up (1001 chars of Minimax HD is 20.2 credits, so 21)', () => {
      expect(getMediaCreditCost('MINIMAX_SPEECH_28_HD', chars(1001))).toBe(21);
    });

    it('prices Minimax tokens like characters', () => {
      expect(getMediaCreditCost('MINIMAX_SPEECH_28_TURBO', chars(2500))).toBe(30);
    });
  });

  describe('autocaption 30 s blocks', () => {
    it.each([
      [0, 1],
      [1, 11],
      [30, 11],
      [31, 22],
      [60, 22],
      [61, 33],
      [120, 44],
    ])('%i s of video costs %i', (sec, credits) => {
      expect(getMediaCreditCost('AUTOCAPTION', blocks(sec))).toBe(credits);
    });
  });

  describe('float safety', () => {
    it('never rounds 0.025 USD x 200 (5.000000000000001 in floats) up to 6', () => {
      expect(getMediaCreditCost('INWORLD_TTS_2', chars(1000))).toBe(5);
    });

    it('keeps 0.035 USD x 200 at exactly 7', () => {
      expect(getMediaCreditCost('INWORLD_TTS_15_MAX', chars(1000))).toBe(7);
    });

    it('keeps 0.055 x 3 blocks (0.165 USD) at 33', () => {
      expect(getMediaCreditCost('AUTOCAPTION', blocks(90))).toBe(33);
    });
  });

  describe('invalid input', () => {
    it('rejects an image model key', () => {
      expect(() => getMediaCreditCost('FLUX_QUICK' as MediaModelKey, FILE)).toThrow(
        'Not a priced media model: FLUX_QUICK',
      );
    });

    it('rejects an unknown key', () => {
      expect(() => getMediaCreditCost('NOPE' as MediaModelKey, FILE)).toThrow(
        'Not a priced media model: NOPE',
      );
    });

    it.each([
      ['file on a per-second model', 'P_VIDEO', FILE],
      ['file on a TTS model', 'INWORLD_TTS_2', FILE],
      ['run on a per-file model', 'LYRIA_2', RUN],
      ['run on a blocks model', 'AUTOCAPTION', RUN],
      ['chars on a per-file model', 'LYRIA_2', chars(10)],
      ['seconds on a per-file model', 'LYRIA_2', secs(5, '720p')],
      ['blocks on a flat run model', 'VIDEO_WATERMARK', blocks(30)],
      ['blocks on a TTS model', 'INWORLD_TTS_2', blocks(30)],
    ] as const)('rejects %s', (_label, key, input) => {
      expect(() => getMediaCreditCost(key, input)).toThrow(/does not match/);
    });

    it('names the model and unit in the mismatch error', () => {
      expect(() => getMediaCreditCost('P_VIDEO', FILE)).toThrow(
        'Cost input "file" does not match P_VIDEO pricing unit "second"',
      );
    });

    it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('rejects %s chars', (n) => {
      expect(() => getMediaCreditCost('INWORLD_TTS_2', chars(n))).toThrow(/Invalid chars/);
    });

    it('rejects negative or non-finite durations and video lengths', () => {
      expect(() => getMediaCreditCost('P_VIDEO', secs(-5, '720p'))).toThrow(
        'Invalid durationSec: -5',
      );
      expect(() => getMediaCreditCost('AUTOCAPTION', blocks(Number.NaN))).toThrow(
        /Invalid videoSec/,
      );
    });

    it('rejects an unpriced resolution', () => {
      expect(() => getMediaCreditCost('WAN_3', secs(5, '4k'))).toThrow(
        'No price for resolution: 4k',
      );
    });

    it('rejects draft mode on a model with no draft table', () => {
      expect(() => getMediaCreditCost('WAN_3', secs(5, '720p', true))).toThrow(
        'No draft price for resolution: 720p',
      );
    });
  });
});
