import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { SONG_LYRICS_LIMITS, SONG_PROMPT_LIMITS } from '@visual-ai/shared';
import { describe, expect, it } from 'vitest';

import SongComposer from '@/components/Song/SongComposer.vue';
import {
  SONG_EXAMPLE_IDEAS,
  SONG_STYLE_CHIPS,
  songDisabledReason,
} from '@/components/Song/songPresets';

const VALID_PROMPT = 'warm indie folk';
const VALID_LYRICS = '[Verse]\nsome words here';

const mountComposer = (prompt = '', lyrics = '') => {
  const wrapper = mount(SongComposer, {
    global: { plugins: [createPinia()] },
    props: {
      prompt,
      lyrics,
      'onUpdate:prompt': (value: string) => wrapper.setProps({ prompt: value }),
      'onUpdate:lyrics': (value: string) => wrapper.setProps({ lyrics: value }),
    },
  });
  return wrapper;
};

describe('songDisabledReason', () => {
  it('asks for a longer style when the prompt is too short', () => {
    expect(songDisabledReason('short', VALID_LYRICS)).toBe(
      `Describe the style in at least ${SONG_PROMPT_LIMITS.min} characters.`,
    );
  });

  it('checks the style before the lyrics', () => {
    expect(songDisabledReason('', '')).toContain('Describe the style');
  });

  it('asks for longer lyrics when only the lyrics are too short', () => {
    expect(songDisabledReason(VALID_PROMPT, 'la la')).toBe(
      `Write at least ${SONG_LYRICS_LIMITS.min} characters of lyrics.`,
    );
  });

  it('ignores surrounding whitespace when counting', () => {
    expect(songDisabledReason(`   ${'a'.repeat(9)}   `, VALID_LYRICS)).toContain('Describe');
    expect(songDisabledReason(VALID_PROMPT, `  ${'a'.repeat(9)}\n`)).toContain('Write at least');
  });

  it('explains the over-limit state and allows exactly the maximum', () => {
    const atMax = 'b'.repeat(SONG_LYRICS_LIMITS.max);
    expect(songDisabledReason(VALID_PROMPT, atMax)).toBe('');
    expect(songDisabledReason(VALID_PROMPT, `${atMax}b`)).toContain('over 3000');
  });

  it('returns an empty string at exactly the minimums', () => {
    expect(
      songDisabledReason('a'.repeat(SONG_PROMPT_LIMITS.min), 'b'.repeat(SONG_LYRICS_LIMITS.min)),
    ).toBe('');
  });
});

describe('SongComposer', () => {
  it('shows the style counter as used of max', () => {
    const wrapper = mountComposer('12 chars....');
    expect(wrapper.get('[data-testid="style-counter"]').text()).toBe(
      `12/${SONG_PROMPT_LIMITS.max}`,
    );
  });

  it('switches the style counter to the limit style at the max length', async () => {
    const wrapper = mountComposer('a'.repeat(SONG_PROMPT_LIMITS.max - 1));
    const counter = wrapper.get('[data-testid="style-counter"]');
    expect(counter.classes()).not.toContain('counter--limit');
    await wrapper.setProps({ prompt: 'a'.repeat(SONG_PROMPT_LIMITS.max) });
    expect(counter.classes()).toContain('counter--limit');
  });

  it('caps the style input at the prompt limit', () => {
    expect(mountComposer().get('[data-testid="style-input"]').attributes('maxlength')).toBe(
      String(SONG_PROMPT_LIMITS.max),
    );
  });

  it('emits typed style text through the prompt model', async () => {
    const wrapper = mountComposer();
    await wrapper.get('[data-testid="style-input"]').setValue('jazz');
    expect(wrapper.emitted('update:prompt')!.at(-1)).toEqual(['jazz']);
  });

  it('fills the style field when a chip is picked', async () => {
    const wrapper = mountComposer();
    await wrapper.findAll('[data-testid="style-chip"]')[3]!.trigger('click');
    const input = wrapper.get('[data-testid="style-input"]').element as HTMLInputElement;
    expect(input.value).toBe(SONG_STYLE_CHIPS[3]);
  });

  it('marks the chip that matches the current style as pressed', () => {
    const wrapper = mountComposer(SONG_STYLE_CHIPS[0]);
    expect(wrapper.findAll('[data-testid="style-chip"]')[0]!.attributes('aria-pressed')).toBe(
      'true',
    );
  });

  it('re-emits the chosen example idea to the page', async () => {
    const wrapper = mountComposer();
    await wrapper.findAll('[data-testid="song-example-idea"]')[0]!.trigger('click');
    expect(wrapper.emitted('example')).toEqual([[SONG_EXAMPLE_IDEAS[0]]]);
  });

  it('binds the lyrics editor to the lyrics model', async () => {
    const wrapper = mountComposer('', 'seed');
    const input = wrapper.get('[data-testid="lyrics-input"]');
    expect((input.element as HTMLTextAreaElement).value).toBe('seed');
    await input.setValue('edited');
    expect(wrapper.emitted('update:lyrics')!.at(-1)).toEqual(['edited']);
  });
});
