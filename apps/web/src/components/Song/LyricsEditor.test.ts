import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { SONG_LYRICS_LIMITS } from '@visual-ai/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import LyricsAiMenu from '@/components/Song/LyricsAiMenu.vue';
import LyricsEditor from '@/components/Song/LyricsEditor.vue';

const mountEditor = (modelValue = '') => {
  const wrapper = mount(LyricsEditor, {
    global: { plugins: [createPinia()] },
    props: {
      modelValue,
      'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
    },
    attachTo: document.body,
  });
  return wrapper;
};

const tagButton = (wrapper: ReturnType<typeof mountEditor>, label: string) => {
  const button = wrapper.findAll('[data-testid="lyrics-tag"]').find((b) => b.text() === label);
  if (!button) throw new Error(`no tag button ${label}`);
  return button;
};

describe('LyricsEditor', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('shows the used-of-max counter', () => {
    const wrapper = mountEditor('hello');
    expect(wrapper.get('[data-testid="lyrics-counter"]').text()).toBe(
      `5/${SONG_LYRICS_LIMITS.max}`,
    );
  });

  it('uses the muted counter style below the limit and the limit style at it', async () => {
    const wrapper = mountEditor('a'.repeat(SONG_LYRICS_LIMITS.max - 1));
    const counter = wrapper.get('[data-testid="lyrics-counter"]');
    expect(counter.classes()).toContain('tw-text-ink-muted');
    expect(counter.classes()).not.toContain('counter--limit');

    await wrapper.setProps({ modelValue: 'a'.repeat(SONG_LYRICS_LIMITS.max) });
    expect(counter.classes()).toContain('counter--limit');
  });

  it('does not truncate text past the limit and links the textarea to its label', () => {
    const wrapper = mountEditor();
    const input = wrapper.get('[data-testid="lyrics-input"]');
    expect(input.attributes('maxlength')).toBeUndefined();
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'));
  });

  it('emits typed text through the model', async () => {
    const wrapper = mountEditor();
    await wrapper.get('[data-testid="lyrics-input"]').setValue('new words');
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['new words']);
  });

  it('offers the five structure tags', () => {
    const labels = mountEditor()
      .findAll('[data-testid="lyrics-tag"]')
      .map((b) => b.text());
    expect(labels).toEqual(['[Intro]', '[Verse]', '[Chorus]', '[Bridge]', '[Outro]']);
  });

  it('inserts a tag into empty lyrics without a leading newline', async () => {
    const wrapper = mountEditor();
    await tagButton(wrapper, '[Verse]').trigger('click');
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['[Verse]\n']);
  });

  it('starts a new line before the tag when the text does not end in a newline', async () => {
    const wrapper = mountEditor('first line');
    const input = wrapper.get('[data-testid="lyrics-input"]').element as HTMLTextAreaElement;
    input.setSelectionRange(10, 10);
    await tagButton(wrapper, '[Chorus]').trigger('click');
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['first line\n[Chorus]\n']);
  });

  it('adds no extra newline when the caret already follows one', async () => {
    const wrapper = mountEditor('line\n');
    const input = wrapper.get('[data-testid="lyrics-input"]').element as HTMLTextAreaElement;
    input.setSelectionRange(5, 5);
    await tagButton(wrapper, '[Bridge]').trigger('click');
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['line\n[Bridge]\n']);
  });

  it('replaces the selected text and keeps the text after the selection', async () => {
    const wrapper = mountEditor('abcXYZdef');
    const input = wrapper.get('[data-testid="lyrics-input"]').element as HTMLTextAreaElement;
    input.setSelectionRange(3, 6);
    await tagButton(wrapper, '[Outro]').trigger('click');
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['abc\n[Outro]\ndef']);
  });

  it('falls back to appending at the end when the textarea ref is gone', () => {
    const onUpdate = vi.fn();
    const wrapper = mount(LyricsEditor, {
      props: { modelValue: 'abc', 'onUpdate:modelValue': onUpdate },
    });
    const vm = wrapper.vm as unknown as {
      insertTag: (tag: string) => void;
      textarea: HTMLTextAreaElement | null;
    };
    vm.textarea = null;
    vm.insertTag('[Verse]');
    expect(onUpdate).toHaveBeenLastCalledWith('abc\n[Verse]\n');
  });

  it('returns focus to the textarea with the caret after the inserted tag', async () => {
    const wrapper = mountEditor('abc');
    const input = wrapper.get('[data-testid="lyrics-input"]').element as HTMLTextAreaElement;
    input.setSelectionRange(3, 3);
    await tagButton(wrapper, '[Intro]').trigger('click');
    const expected = 'abc\n[Intro]\n'.length;
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(expected);
    expect(input.selectionEnd).toBe(expected);
  });

  it('hands the menu the textarea caret, or the end of the lyrics when it is unavailable', () => {
    const wrapper = mountEditor('[Verse]\nline one');
    const getCaret = () => wrapper.getComponent(LyricsAiMenu).props('getCaret')();
    const textarea = wrapper.get<HTMLTextAreaElement>('[data-testid="lyrics-input"]').element;

    textarea.setSelectionRange(3, 3);
    expect(getCaret()).toBe(3);

    wrapper.unmount();
    const detached = mountEditor('abc');
    const detachedCaret = detached.getComponent(LyricsAiMenu).props('getCaret');
    detached.unmount();
    expect(detachedCaret()).toBe(3);
  });
});
