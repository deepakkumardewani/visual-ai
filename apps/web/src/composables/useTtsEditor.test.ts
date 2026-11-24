import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, nextTick, ref, type Ref } from 'vue';

import type { SpeechModelKey, TtsDoc, TtsTagNode } from '@visual-ai/shared';

import { chipJson } from '@/components/Speech/TagChipNode';
import {
  DEFAULT_PAUSE_SEC,
  editorJsonToTtsDoc,
  filterTagItems,
  tagItemsForModel,
  ttsDocToEditorJson,
  useTtsEditor,
  type TtsEditorApi,
} from '@/composables/useTtsEditor';

const INWORLD_2: SpeechModelKey = 'INWORLD_TTS_2';
const INWORLD_15: SpeechModelKey = 'INWORLD_TTS_15_MAX';
const MINIMAX: SpeechModelKey = 'MINIMAX_SPEECH_28_HD';
const CHATTERBOX: SpeechModelKey = 'CHATTERBOX_TURBO';

const LAUGH: TtsTagNode = { type: 'tag', id: 'laugh' };
const HAPPY: TtsTagNode = { type: 'tag', id: 'happy' };

interface Harness {
  api: TtsEditorApi;
  model: Ref<SpeechModelKey>;
  unmount: () => void;
}

const mounted: Harness[] = [];

function setup(initialText: string, model: SpeechModelKey = INWORLD_15): Harness {
  const modelKey = ref(model);
  let api!: TtsEditorApi;
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useTtsEditor({ modelKey, initialText });
        return () => null;
      },
    }),
  );
  const harness = { api, model: modelKey, unmount: () => wrapper.unmount() };
  mounted.push(harness);
  return harness;
}

function keyEvent(key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, cancelable: true });
}

function pressInEditor(api: TtsEditorApi, event: KeyboardEvent): boolean {
  return (
    api.editor.view.someProp('handleKeyDown', (handler) => handler(api.editor.view, event)) ?? false
  );
}

function paste(api: TtsEditorApi, plain: string | undefined): boolean {
  const event = {
    clipboardData: { getData: () => plain },
  } as unknown as ClipboardEvent;
  return (
    api.editor.view.someProp('handlePaste', (handler) =>
      handler(api.editor.view, event, api.editor.state.doc.slice(0, 0)),
    ) ?? false
  );
}

async function openSlashMenu(api: TtsEditorApi, query = '') {
  api.editor.commands.focus('end');
  api.editor.commands.insertContent(`/${query}`);
  await nextTick();
}

afterEach(() => {
  mounted.splice(0).forEach((h) => h.unmount());
});

describe('tagItemsForModel', () => {
  it('offers pause and every simple tag the model can express', () => {
    const labels = tagItemsForModel(CHATTERBOX).map((i) => i.label);
    expect(labels).toContain('laugh');
    expect(labels).toContain('clear throat');
    expect(labels).not.toContain('pause');
    expect(labels).not.toContain('happy');
  });

  it('expands direction presets only for Inworld 2', () => {
    const inworld2 = tagItemsForModel(INWORLD_2);
    expect(inworld2.some((i) => i.label === 'direction: say excitedly')).toBe(true);
    expect(tagItemsForModel(INWORLD_15).some((i) => i.node.type === 'direction')).toBe(false);
  });

  it('creates pause items at the default duration', () => {
    const pause = tagItemsForModel(MINIMAX).find((i) => i.node.type === 'pause');
    expect(pause?.node).toEqual({ type: 'pause', seconds: DEFAULT_PAUSE_SEC });
    expect(pause?.group).toBe('pause');
  });
});

describe('filterTagItems', () => {
  const items = tagItemsForModel(INWORLD_15);

  it('matches case-insensitively on a trimmed query', () => {
    expect(filterTagItems(items, '  LAUGH ').map((i) => i.label)).toEqual(
      expect.arrayContaining(['laugh', 'laughing']),
    );
  });

  it('returns everything for an empty query and nothing for a miss', () => {
    expect(filterTagItems(items, '')).toHaveLength(items.length);
    expect(filterTagItems(items, 'zzzz')).toEqual([]);
  });
});

describe('editor JSON conversion', () => {
  it('maps newlines to paragraphs and keeps chips inline', () => {
    const doc: TtsDoc = [
      { type: 'text', text: 'one\ntwo ' },
      LAUGH,
      { type: 'text', text: '\n\nend' },
    ];
    const json = ttsDocToEditorJson(doc);

    expect(json.content).toEqual([
      { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'two ' }, chipJson(LAUGH)] },
      { type: 'paragraph' },
      { type: 'paragraph', content: [{ type: 'text', text: 'end' }] },
    ]);
  });

  it('produces one empty paragraph for an empty doc', () => {
    expect(ttsDocToEditorJson([]).content).toEqual([{ type: 'paragraph' }]);
  });

  it('round-trips a doc through editor JSON', () => {
    const doc: TtsDoc = [
      { type: 'text', text: 'a' },
      LAUGH,
      { type: 'text', text: '\n' },
      { type: 'text', text: 'b' },
      { type: 'pause', seconds: 2 },
    ];
    expect(editorJsonToTtsDoc(ttsDocToEditorJson(doc))).toEqual(doc);
  });

  it('skips empty inline text and tolerates a doc without content', () => {
    expect(editorJsonToTtsDoc({ type: 'doc' })).toEqual([]);
    expect(
      editorJsonToTtsDoc({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: '' }] },
          { type: 'paragraph' },
        ],
      }),
    ).toEqual([{ type: 'text', text: '\n' }]);
  });
});

describe('useTtsEditor state', () => {
  it('restores saved native text into chips', () => {
    const { api } = setup('hi [laugh] there');

    expect(api.doc.value).toEqual([
      { type: 'text', text: 'hi ' },
      LAUGH,
      { type: 'text', text: ' there' },
    ]);
    expect(api.text.value).toBe('hi [laugh] there');
    expect(api.hasSpeakableText.value).toBe(true);
  });

  it('reports no speakable text for blank or chip-only content', () => {
    expect(setup('   ').api.hasSpeakableText.value).toBe(false);
    expect(setup('[laugh]').api.hasSpeakableText.value).toBe(false);
  });

  it('exposes an accessible textbox', () => {
    const { api } = setup('');
    const attrs = api.editor.options.editorProps.attributes as Record<string, string>;
    expect(attrs).toMatchObject({ role: 'textbox', 'aria-label': 'Speech text' });
  });

  it('inserts a chip at the cursor and serializes it in the model syntax', () => {
    const { api } = setup('hello', MINIMAX);
    api.editor.commands.focus('end');

    api.insertTag({ type: 'pause', seconds: 2 });
    api.insertTag({ type: 'tag', id: 'laugh' });

    expect(
      api.editor.getJSON().content?.[0].content?.filter((n) => n.type === 'ttsTag'),
    ).toHaveLength(2);
    expect(api.doc.value.filter((n) => n.type !== 'text')).toHaveLength(2);
    expect(api.text.value).toBe('hello(laughs)');
  });

  it('updates doc and text when the user types', () => {
    const { api } = setup('');
    api.editor.commands.insertContent('typed');
    expect(api.text.value).toBe('typed');
  });

  it('setDoc replaces the content without waiting for an update event', () => {
    const { api } = setup('old');
    api.setDoc([{ type: 'text', text: 'new' }, LAUGH]);

    expect(api.text.value).toBe('new[laugh]');
    expect(api.editor.getText()).toContain('new');
  });
});

describe('model switching', () => {
  it('is a no-op for the current model', () => {
    const { api } = setup('[laugh]');
    expect(api.requestModelSwitch(INWORLD_15)).toBe(true);
    expect(api.pendingSwitch.value).toBeNull();
  });

  it('switches at once when every tag survives', () => {
    const { api, model } = setup('hi [laugh]');

    expect(api.requestModelSwitch(CHATTERBOX)).toBe(true);
    expect(model.value).toBe(CHATTERBOX);
    expect(api.pendingSwitch.value).toBeNull();
  });

  it('holds the model and exposes the conversion when a tag cannot survive', () => {
    const { api, model } = setup('hi [happy]');

    expect(api.requestModelSwitch(CHATTERBOX)).toBe(false);
    expect(model.value).toBe(INWORLD_15);
    expect(api.pendingSwitch.value?.target).toBe(CHATTERBOX);
    expect(api.pendingSwitch.value?.conversion.dropped).toEqual([HAPPY]);
  });

  it('cancel leaves text and model untouched', () => {
    const { api, model } = setup('hi [happy]');
    api.requestModelSwitch(CHATTERBOX);

    api.cancelSwitch();

    expect(api.pendingSwitch.value).toBeNull();
    expect(model.value).toBe(INWORLD_15);
    expect(api.text.value).toBe('hi [happy]');
  });

  it('confirm converts the doc and commits the model, and undo restores both', () => {
    const { api, model } = setup('hi [happy]');
    api.requestModelSwitch(CHATTERBOX);

    api.confirmSwitch();

    expect(model.value).toBe(CHATTERBOX);
    expect(api.text.value).toBe('hi ');
    expect(api.pendingSwitch.value).toBeNull();
    expect(api.canUndoConversion.value).toBe(true);

    api.undoConversion();

    expect(model.value).toBe(INWORLD_15);
    expect(api.text.value).toBe('hi [happy]');
    expect(api.canUndoConversion.value).toBe(false);
  });

  it('records a Minimax emotion suggestion and restores the previous emotion on undo', () => {
    const { api } = setup('hi [sad]');
    api.requestModelSwitch(MINIMAX);

    api.confirmSwitch();
    expect(api.emotion.value).toBe('sad');

    api.undoConversion();
    expect(api.emotion.value).toBeNull();
  });

  it('keeps the existing emotion when the conversion suggests none', () => {
    const { api } = setup('[happy]');
    api.emotion.value = 'calm';
    api.requestModelSwitch(CHATTERBOX);

    api.confirmSwitch();

    expect(api.emotion.value).toBe('calm');
  });

  it('confirm and undo do nothing without a pending switch or undo state', () => {
    const { api, model } = setup('hi');

    api.confirmSwitch();
    api.undoConversion();

    expect(model.value).toBe(INWORLD_15);
    expect(api.canUndoConversion.value).toBe(false);
  });

  it('clears the undo state on the next switch request', () => {
    const { api } = setup('[happy]');
    api.requestModelSwitch(CHATTERBOX);
    api.confirmSwitch();

    api.requestModelSwitch(INWORLD_15);

    expect(api.canUndoConversion.value).toBe(false);
  });
});

describe('paste', () => {
  it('turns pasted native tag syntax into chips', () => {
    const { api } = setup('');

    expect(paste(api, 'a [laugh] b')).toBe(true);

    expect(api.doc.value).toEqual([
      { type: 'text', text: 'a ' },
      LAUGH,
      { type: 'text', text: ' b' },
    ]);
  });

  it('splits a multi-paragraph paste into paragraphs', () => {
    const { api } = setup('');

    expect(paste(api, '[laugh] one\ntwo')).toBe(true);

    expect(api.editor.getJSON().content).toHaveLength(2);
  });

  it('leaves plain text and an empty clipboard to the default handler', () => {
    const { api } = setup('');

    expect(paste(api, 'just words')).toBe(false);
    expect(paste(api, '')).toBe(false);
    expect(paste(api, undefined)).toBe(false);
  });
});

describe('slash menu', () => {
  it('is closed until a slash is typed', () => {
    expect(setup('').api.slashMenu.value).toBeNull();
  });

  it('opens with the tags of the current model and filters by query', async () => {
    const { api } = setup('', CHATTERBOX);

    await openSlashMenu(api, 'lau');

    const labels = api.slashMenu.value?.items.map((i) => i.label);
    expect(labels).toEqual(['laugh']);
    expect(api.slashMenu.value?.index).toBe(0);
  });

  it('refreshes the items as the query changes', async () => {
    const { api } = setup('', CHATTERBOX);
    await openSlashMenu(api, 'l');
    const before = api.slashMenu.value?.items.length ?? 0;

    api.editor.commands.insertContent('au');
    await nextTick();

    expect(api.slashMenu.value?.items.length).toBeLessThan(before);
  });

  it('closes when the slash text is removed', async () => {
    const { api } = setup('', CHATTERBOX);
    await openSlashMenu(api);

    api.editor.commands.setContent(ttsDocToEditorJson([{ type: 'text', text: 'x' }]));
    await nextTick();

    expect(api.slashMenu.value).toBeNull();
  });

  it('navigates with arrows (wrapping) and swallows the keys', async () => {
    const { api } = setup('', CHATTERBOX);
    await openSlashMenu(api);
    const count = api.slashMenu.value?.items.length ?? 0;
    expect(count).toBeGreaterThan(1);

    const up = keyEvent('ArrowUp');
    expect(pressInEditor(api, up)).toBe(true);
    expect(up.defaultPrevented).toBe(true);
    expect(api.slashMenu.value?.index).toBe(count - 1);

    pressInEditor(api, keyEvent('ArrowDown'));
    expect(api.slashMenu.value?.index).toBe(0);

    pressInEditor(api, keyEvent('ArrowDown'));
    expect(api.slashMenu.value?.index).toBe(1);
  });

  it('ignores keys that are not menu navigation', async () => {
    const { api } = setup('', CHATTERBOX);
    await openSlashMenu(api);

    const event = keyEvent('a');
    expect(pressInEditor(api, event)).toBe(false);
    expect(event.defaultPrevented).toBe(false);
  });

  it('Enter inserts the highlighted tag as a chip in place of the slash text', async () => {
    const { api } = setup('', CHATTERBOX);
    await openSlashMenu(api, 'lau');

    expect(pressInEditor(api, keyEvent('Enter'))).toBe(true);
    await nextTick();

    expect(api.doc.value).toEqual([LAUGH]);
    expect(api.slashMenu.value).toBeNull();
  });

  it('Tab chooses too, and choose works from the exposed callback', async () => {
    const { api } = setup('', CHATTERBOX);
    await openSlashMenu(api, 'sigh');

    pressInEditor(api, keyEvent('Tab'));

    expect(api.doc.value).toEqual([{ type: 'tag', id: 'sigh' }]);
  });

  it('Enter with no matching items swallows the key and inserts nothing', async () => {
    const { api } = setup('', CHATTERBOX);
    await openSlashMenu(api, 'zzzz');
    expect(api.slashMenu.value?.items).toEqual([]);

    expect(pressInEditor(api, keyEvent('ArrowDown'))).toBe(true);
    expect(pressInEditor(api, keyEvent('ArrowUp'))).toBe(true);
    expect(pressInEditor(api, keyEvent('Enter'))).toBe(true);

    expect(api.doc.value.some((n) => n.type !== 'text')).toBe(false);
  });
});
