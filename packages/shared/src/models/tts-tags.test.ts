import { describe, expect, it } from 'vitest';
import {
  convertTtsTags,
  findUnsupportedTags,
  parseTtsText,
  serializeTts,
  TTS_DEFAULT_VOICE,
  TTS_PAUSE_MAX_SEC,
  TTS_PAUSE_MIN_SEC,
  TTS_SEMANTIC_MAP,
  TTS_TAG_IDS,
  TTS_TAGS,
  TTS_VOICES,
  type TtsDoc,
  type TtsTagId,
} from './tts-tags.js';
import type { SpeechModelKey } from '../schemas/media.js';

const MODELS: SpeechModelKey[] = [
  'INWORLD_TTS_2',
  'INWORLD_TTS_15_MAX',
  'MINIMAX_SPEECH_28_HD',
  'MINIMAX_SPEECH_28_TURBO',
  'CHATTERBOX_TURBO',
];
const MINIMAX_HD: SpeechModelKey = 'MINIMAX_SPEECH_28_HD';
const INWORLD_2: SpeechModelKey = 'INWORLD_TTS_2';
const INWORLD_15: SpeechModelKey = 'INWORLD_TTS_15_MAX';
const CHATTERBOX: SpeechModelKey = 'CHATTERBOX_TURBO';

const text = (value: string) => ({ type: 'text' as const, text: value });
const pause = (seconds: number) => ({ type: 'pause' as const, seconds });
const tag = (id: TtsTagId) => ({ type: 'tag' as const, id });

describe('TTS_TAGS catalogue', () => {
  it('lists every semantic id plus pause and direction', () => {
    expect(TTS_TAGS).toHaveLength(TTS_TAG_IDS.length + 2);
    expect(TTS_TAGS.find((t) => t.id === 'clear-throat')?.label).toBe('clear throat');
    expect(TTS_TAGS.find((t) => t.id === 'pause')?.kind).toBe('pause');
    expect(TTS_TAGS.find((t) => t.id === 'direction')?.kind).toBe('direction');
  });
});

describe('serializeTts', () => {
  it.each([
    [INWORLD_15, 0.1, '<break time="100ms" />'],
    [INWORLD_15, 10, '<break time="10s" />'],
    [MINIMAX_HD, 0.1, '<#0.1#>'],
    [MINIMAX_HD, 10, '<#10#>'],
  ] as const)('emits the native pause for %s at %s seconds', (model, seconds, expected) => {
    const doc: TtsDoc = [text('a'), pause(seconds), text('b')];
    expect(serializeTts(doc, model)).toBe(`a${expected}b`);
  });

  it.each([0.09, 10.1, Number.NaN])('rejects a pause of %s seconds', (seconds) => {
    expect(() => serializeTts([text('a'), pause(seconds), text('b')], INWORLD_15)).toThrow(
      RangeError,
    );
  });

  it('exposes the pause bounds', () => {
    expect([TTS_PAUSE_MIN_SEC, TTS_PAUSE_MAX_SEC]).toEqual([0.1, 10]);
  });

  it('drops Minimax pauses that are first or last but keeps inner ones', () => {
    const doc: TtsDoc = [pause(1), text('a'), pause(2), text('b'), pause(3)];
    expect(serializeTts(doc, MINIMAX_HD)).toBe('a<#2#>b');
  });

  it('keeps edge pauses on Inworld 1.5', () => {
    expect(serializeTts([pause(1), text('a')], INWORLD_15)).toBe('<break time="1s" />a');
  });

  it('omits pauses on a model without pause syntax', () => {
    expect(serializeTts([text('a'), pause(1), text('b')], CHATTERBOX)).toBe('ab');
  });

  it('serializes direction cues on Inworld 2 only and trims them', () => {
    const doc: TtsDoc = [{ type: 'direction', text: '  say excitedly ' }, text('Hi')];
    expect(serializeTts(doc, INWORLD_2)).toBe('[say excitedly]Hi');
    expect(serializeTts(doc, INWORLD_15)).toBe('Hi');
  });

  it('omits a blank direction cue', () => {
    expect(serializeTts([{ type: 'direction', text: '   ' }, text('Hi')], INWORLD_2)).toBe('Hi');
  });

  it('serializes simple tags per model and drops unsupported ones', () => {
    expect(serializeTts([tag('laugh')], MINIMAX_HD)).toBe('(laughs)');
    expect(serializeTts([tag('clear-throat')], INWORLD_15)).toBe('[clear_throat]');
    expect(serializeTts([tag('happy')], CHATTERBOX)).toBe('');
  });
});

describe('findUnsupportedTags', () => {
  it('returns the tags a model cannot express', () => {
    const doc: TtsDoc = [text('x'), tag('happy'), tag('laugh'), pause(1)];
    expect(findUnsupportedTags(doc, CHATTERBOX)).toEqual([tag('happy'), pause(1)]);
  });

  it('returns an empty list when everything is supported', () => {
    expect(findUnsupportedTags([text('x'), tag('laugh'), pause(1)], INWORLD_15)).toEqual([]);
  });

  it('flags direction chips on every model except Inworld 2', () => {
    const doc: TtsDoc = [{ type: 'direction', text: 'x' }];
    expect(findUnsupportedTags(doc, INWORLD_2)).toEqual([]);
    expect(findUnsupportedTags(doc, MINIMAX_HD)).toHaveLength(1);
  });
});

describe('convertTtsTags', () => {
  it('keeps supported chips and reports dropped ones', () => {
    const result = convertTtsTags([text('a'), tag('happy'), tag('laugh')], CHATTERBOX);

    expect(result.doc).toEqual([text('a'), tag('laugh')]);
    expect(result.dropped).toEqual([tag('happy')]);
    expect(result.approximated).toEqual([]);
    expect(result.suggestedEmotion).toBeUndefined();
    expect(result.text).toBe('a[laugh]');
  });

  it('turns the first emotion into a Minimax emotion suggestion and drops later ones', () => {
    const result = convertTtsTags([text('a'), tag('sad'), tag('angry')], MINIMAX_HD);

    expect(result.suggestedEmotion).toBe('sad');
    expect(result.approximated).toEqual([tag('sad')]);
    expect(result.dropped).toEqual([tag('angry')]);
    expect(result.text).toBe('a');
  });

  it('drops emotions outright on non-Minimax models and non-emotion tags on Minimax', () => {
    expect(convertTtsTags([tag('happy')], CHATTERBOX).approximated).toEqual([]);
    expect(convertTtsTags([tag('breathe')], MINIMAX_HD).dropped).toEqual([tag('breathe')]);
  });

  it('drops pause and direction chips the target cannot express', () => {
    const doc: TtsDoc = [pause(1), { type: 'direction', text: 'x' }];
    expect(convertTtsTags(doc, CHATTERBOX).dropped).toEqual(doc);
  });
});

describe('parseTtsText', () => {
  it('returns plain text unchanged', () => {
    expect(parseTtsText('hello', INWORLD_2)).toEqual([text('hello')]);
    expect(parseTtsText('', INWORLD_2)).toEqual([]);
  });

  it('parses pauses, converting milliseconds', () => {
    expect(parseTtsText('a<break time="500ms" />b<break time="2s" />', INWORLD_15)).toEqual([
      text('a'),
      pause(0.5),
      text('b'),
      pause(2),
    ]);
    expect(parseTtsText('a<#1.5#>b', MINIMAX_HD)).toEqual([text('a'), pause(1.5), text('b')]);
  });

  it('keeps an out-of-range pause as literal text', () => {
    expect(parseTtsText('a<#99#>b', MINIMAX_HD)).toEqual([text('a<#99#>b')]);
  });

  it('parses direction cues only on Inworld 2', () => {
    expect(parseTtsText('[say excitedly]Hi', INWORLD_2)).toEqual([
      { type: 'direction', text: 'say excitedly' },
      text('Hi'),
    ]);
    expect(parseTtsText('[say excitedly]Hi', CHATTERBOX)).toEqual([text('[say excitedly]Hi')]);
  });

  it('prefers a known tag over a direction cue', () => {
    expect(parseTtsText('[laugh]', INWORLD_2)).toEqual([tag('laugh')]);
  });

  it('leaves unknown bracket text literal on a model with only simple tags', () => {
    expect(parseTtsText('[nope] (laughs)', CHATTERBOX)).toEqual([text('[nope] (laughs)')]);
  });

  it('prefers the longer native tag on a shared prefix', () => {
    expect(parseTtsText('[clear throat]', CHATTERBOX)).toEqual([tag('clear-throat')]);
  });
});

describe('round trip', () => {
  const cases = MODELS.flatMap((model) =>
    TTS_TAG_IDS.filter((id) => TTS_SEMANTIC_MAP[id][model] !== undefined).map(
      (id) => [model, id] as const,
    ),
  );

  it.each(cases)('parse(serialize(tag)) restores %s %s', (model, id) => {
    const doc: TtsDoc = [text('a '), tag(id), text(' b')];
    expect(parseTtsText(serializeTts(doc, model), model)).toEqual(doc);
  });

  it.each(
    MODELS.filter((m) => m !== INWORLD_2 && m !== CHATTERBOX).flatMap((m) =>
      [0.1, 2.5, 10].map((s) => [m, s] as const),
    ),
  )('restores a pause on %s at %s seconds', (model, seconds) => {
    const doc: TtsDoc = [text('a'), pause(seconds), text('b')];
    expect(parseTtsText(serializeTts(doc, model), model)).toEqual(doc);
  });
});

describe('voices', () => {
  it('defaults each catalog to one of its own voices', () => {
    for (const [catalog, voices] of Object.entries(TTS_VOICES)) {
      const ids = voices.map((v) => v.id);
      expect(ids).toContain(TTS_DEFAULT_VOICE[catalog as keyof typeof TTS_VOICES]);
      expect(voices.every((v) => v.description.length > 0)).toBe(true);
    }
  });
});
