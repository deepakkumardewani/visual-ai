import { getModelDefinition, type ModelKey } from '@visual-ai/shared';
import { nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  mapDraftToModel,
  resetMediaDraftForTests,
  useMediaDraft,
  type MediaDraft,
} from '@/composables/useMediaDraft';

const STORAGE_KEY = 'visual-ai-media-draft';

const SONG: ModelKey = 'MINIMAX_MUSIC_26';
const SPEECH: ModelKey = 'INWORLD_TTS_2';
const AMBIENT: ModelKey = 'STABLE_AUDIO_25';
const IMAGE: ModelKey = 'FLUX_QUICK';

const draftOf = (overrides: Partial<MediaDraft> = {}): MediaDraft => ({
  prompt: '',
  lyrics: '',
  text: '',
  durationSec: null,
  ...overrides,
});

const maxOf = (limit: { max: number } | undefined) => {
  if (!limit) throw new Error('model has no such limit');
  return limit.max;
};

describe('mapDraftToModel', () => {
  it('returns an empty mapping for an empty draft', () => {
    expect(mapDraftToModel(draftOf(), SONG)).toEqual({
      values: {},
      unused: [],
      overLimit: {},
      unusedLabels: {},
    });
  });

  it('treats whitespace-only text as empty', () => {
    const mapping = mapDraftToModel(draftOf({ prompt: '   ', lyrics: '\n\t' }), SONG);
    expect(mapping.values).toEqual({});
    expect(mapping.unused).toEqual([]);
  });

  it('passes through the fields a song model uses exactly as typed', () => {
    const mapping = mapDraftToModel(draftOf({ prompt: '  warm synths ', lyrics: 'la la' }), SONG);
    expect(mapping.values).toEqual({ prompt: '  warm synths ', lyrics: 'la la' });
    expect(mapping.overLimit).toEqual({});
  });

  it('tags fields the model ignores with its label', () => {
    const mapping = mapDraftToModel(draftOf({ text: 'hello', durationSec: 30 }), SONG);
    const label = getModelDefinition(SONG).label;

    expect(mapping.values).toEqual({});
    expect(mapping.unused).toEqual(['text', 'durationSec']);
    expect(mapping.unusedLabels).toEqual({
      text: `Not used by ${label}`,
      durationSec: `Not used by ${label}`,
    });
  });

  it('reports how far a text field exceeds the model limit and never truncates it', () => {
    const limit = getModelDefinition(SPEECH).media?.textLimit ?? 0;
    const text = 'a'.repeat(limit + 7);

    const mapping = mapDraftToModel(draftOf({ text }), SPEECH);

    expect(mapping.overLimit).toEqual({ text: 7 });
    expect(mapping.values.text).toBe(text);
  });

  it('does not flag text exactly at the limit', () => {
    const limit = getModelDefinition(SPEECH).media?.textLimit ?? 0;
    expect(mapDraftToModel(draftOf({ text: 'a'.repeat(limit) }), SPEECH).overLimit).toEqual({});
  });

  it('flags prompt and lyrics over their max lengths', () => {
    const media = getModelDefinition(SONG).media;
    const promptMax = maxOf(media?.prompt);
    const lyricsMax = maxOf(media?.lyrics);

    const mapping = mapDraftToModel(
      draftOf({ prompt: 'p'.repeat(promptMax + 1), lyrics: 'l'.repeat(lyricsMax + 3) }),
      SONG,
    );

    expect(mapping.overLimit).toEqual({ prompt: 1, lyrics: 3 });
  });

  it('accepts a duration for models that support it, including zero', () => {
    expect(mapDraftToModel(draftOf({ durationSec: 45 }), AMBIENT).values).toEqual({
      durationSec: 45,
    });
    expect(mapDraftToModel(draftOf({ durationSec: 0 }), AMBIENT).values).toEqual({
      durationSec: 0,
    });
  });

  it('marks every filled field unused for a model with no media config', () => {
    const mapping = mapDraftToModel(
      draftOf({ prompt: 'a cat', lyrics: 'x', text: 'y', durationSec: 5 }),
      IMAGE,
    );
    expect(mapping.values).toEqual({});
    expect(mapping.unused).toEqual(['prompt', 'lyrics', 'text', 'durationSec']);
  });
});

describe('useMediaDraft', () => {
  beforeEach(() => {
    localStorage.clear();
    resetMediaDraftForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts empty when nothing is stored', () => {
    expect(useMediaDraft().draft).toEqual(draftOf());
  });

  it('restores saved fields', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ prompt: 'hi', lyrics: 'la', text: 'say', durationSec: 12 }),
    );
    expect(useMediaDraft().draft).toEqual({
      prompt: 'hi',
      lyrics: 'la',
      text: 'say',
      durationSec: 12,
    });
  });

  it('ignores stored values of the wrong type', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ prompt: 5, lyrics: null, text: ['x'], durationSec: '30' }),
    );
    expect(useMediaDraft().draft).toEqual(draftOf());
  });

  it('starts empty and warns when the stored draft is corrupt', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    localStorage.setItem(STORAGE_KEY, '{not json');

    expect(useMediaDraft().draft).toEqual(draftOf());
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('persists edits to storage', async () => {
    const { draft } = useMediaDraft();
    draft.prompt = 'moody piano';
    draft.durationSec = 20;
    await nextTick();

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({
      prompt: 'moody piano',
      lyrics: '',
      text: '',
      durationSec: 20,
    });
  });

  it('keeps the draft in memory and warns when storage rejects the write', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const setItem = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const { draft } = useMediaDraft();

    draft.text = 'still here';
    await nextTick();
    setItem.mockRestore();

    expect(draft.text).toBe('still here');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('shares one draft between callers', () => {
    const first = useMediaDraft();
    first.draft.lyrics = 'shared';
    expect(useMediaDraft().draft.lyrics).toBe('shared');
  });

  it('exposes the mapper', () => {
    expect(useMediaDraft().mapDraftToModel).toBe(mapDraftToModel);
  });

  it('reads storage again after a reset', () => {
    useMediaDraft().draft.prompt = 'first';
    resetMediaDraftForTests();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ prompt: 'second' }));

    expect(useMediaDraft().draft.prompt).toBe('second');
  });
});
