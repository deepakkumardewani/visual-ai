import { Extension, type JSONContent } from '@tiptap/core';
import { Editor } from '@tiptap/vue-3';
import Document from '@tiptap/extension-document';
import { History } from '@tiptap/extension-history';
import Paragraph from '@tiptap/extension-paragraph';
import Placeholder from '@tiptap/extension-placeholder';
import Text from '@tiptap/extension-text';
import Suggestion from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import {
  convertTtsTags,
  findUnsupportedTags,
  parseTtsText,
  serializeTts,
  TTS_DIRECTION_PRESETS,
  TTS_TAGS,
  type SpeechModelKey,
  type TtsConversion,
  type TtsDoc,
  type TtsNode,
  type TtsTagNode,
} from '@visual-ai/shared';
import { computed, onBeforeUnmount, ref, shallowRef, type Ref } from 'vue';

import {
  chipJson,
  TAG_CHIP_NODE_NAME,
  TagChip,
  tagGroup,
  tagLabel,
} from '@/components/Speech/TagChipNode';

export const DEFAULT_PAUSE_SEC = 1;
export const EDITOR_PLACEHOLDER = 'Type or paste what you want spoken.';
const SLASH_CHAR = '/';
const PARAGRAPH_BREAK = '\n';
const SLASH_MENU_KEY = new PluginKey('ttsSlashMenu');

// ── Tags a model offers ─────────────────────────────────────────────────────

export interface TtsTagItem {
  key: string;
  label: string;
  group: ReturnType<typeof tagGroup>;
  node: TtsTagNode;
}

function itemFor(node: TtsTagNode, label = tagLabel(node)): TtsTagItem {
  return { key: `${node.type}:${label}`, label, group: tagGroup(node), node };
}

/** Every tag the model can express; direction expands to its presets (Inworld 2 only). */
export function tagItemsForModel(model: SpeechModelKey): TtsTagItem[] {
  return TTS_TAGS.flatMap((definition): TtsTagItem[] => {
    if (definition.kind === 'direction') {
      const presets = TTS_DIRECTION_PRESETS.map((text) =>
        itemFor({ type: 'direction', text }, `direction: ${text}`),
      );
      return findUnsupportedTags([{ type: 'direction', text: 'x' }], model).length ? [] : presets;
    }
    const node: TtsTagNode =
      definition.kind === 'pause'
        ? { type: 'pause', seconds: DEFAULT_PAUSE_SEC }
        : { type: 'tag', id: definition.id as Extract<TtsTagNode, { type: 'tag' }>['id'] };
    return findUnsupportedTags([node], model).length ? [] : [itemFor(node)];
  });
}

export function filterTagItems(items: readonly TtsTagItem[], query: string): TtsTagItem[] {
  const needle = query.trim().toLowerCase();
  return items.filter((item) => item.label.toLowerCase().includes(needle));
}

// ── Editor JSON <-> TtsDoc ──────────────────────────────────────────────────

function paragraphOf(content: JSONContent[]): JSONContent {
  return content.length ? { type: 'paragraph', content } : { type: 'paragraph' };
}

/** Text with newlines becomes paragraphs; chips stay inline in their paragraph. */
export function ttsDocToEditorJson(doc: readonly TtsNode[]): JSONContent {
  const paragraphs: JSONContent[][] = [[]];
  for (const node of doc) {
    if (node.type !== 'text') {
      paragraphs[paragraphs.length - 1].push(chipJson(node));
      continue;
    }
    node.text.split(PARAGRAPH_BREAK).forEach((line, index) => {
      if (index > 0) paragraphs.push([]);
      if (line) paragraphs[paragraphs.length - 1].push({ type: 'text', text: line });
    });
  }
  return { type: 'doc', content: paragraphs.map(paragraphOf) };
}

function inlineToNode(inline: JSONContent): TtsNode | null {
  if (inline.type === TAG_CHIP_NODE_NAME) return inline.attrs?.tag as TtsTagNode;
  return inline.text ? { type: 'text', text: inline.text } : null;
}

export function editorJsonToTtsDoc(json: JSONContent): TtsDoc {
  const nodes: TtsNode[] = [];
  (json.content ?? []).forEach((paragraph, index) => {
    if (index > 0) nodes.push({ type: 'text', text: PARAGRAPH_BREAK });
    for (const inline of paragraph.content ?? []) {
      const node = inlineToNode(inline);
      if (node) nodes.push(node);
    }
  });
  return nodes;
}

// ── Slash menu ──────────────────────────────────────────────────────────────

export interface SlashMenuState {
  items: TtsTagItem[];
  index: number;
  rect: DOMRect | null;
  choose: (item: TtsTagItem) => void;
}

const MENU_NAV_KEYS = ['ArrowDown', 'ArrowUp', 'Enter', 'Tab'];

function createSlashExtension(
  model: Ref<SpeechModelKey>,
  menu: Ref<SlashMenuState | null>,
): Extension {
  return Extension.create({
    name: 'ttsSlashMenu',
    addProseMirrorPlugins() {
      return [
        Suggestion<TtsTagItem, TtsTagItem>({
          editor: this.editor,
          char: SLASH_CHAR,
          pluginKey: SLASH_MENU_KEY,
          items: ({ query }) => filterTagItems(tagItemsForModel(model.value), query),
          command: ({ editor, range, props }) =>
            editor.chain().focus().deleteRange(range).insertContent(chipJson(props.node)).run(),
          render: () => ({
            onStart: (props) => {
              menu.value = {
                items: props.items,
                index: 0,
                rect: props.clientRect?.() ?? null,
                choose: props.command,
              };
            },
            onUpdate: (props) => {
              menu.value = {
                items: props.items,
                index: 0,
                rect: props.clientRect?.() ?? null,
                choose: props.command,
              };
            },
            onKeyDown: ({ event }) => {
              const state = menu.value;
              if (!state || !MENU_NAV_KEYS.includes(event.key)) return false;
              event.preventDefault();
              const count = state.items.length;
              if (event.key === 'ArrowDown') state.index = (state.index + 1) % Math.max(count, 1);
              else if (event.key === 'ArrowUp')
                state.index = (state.index - 1 + count) % Math.max(count, 1);
              else if (count) state.choose(state.items[state.index]);
              return true;
            },
            onExit: () => {
              menu.value = null;
            },
          }),
        }),
      ];
    },
  });
}

// ── Composable ──────────────────────────────────────────────────────────────

export interface UseTtsEditorOptions {
  /** The committed model; a switch only lands here after the user has confirmed any conversion. */
  modelKey: Ref<SpeechModelKey>;
  /** Saved text in the committed model's native syntax; restored into chips. */
  initialText: string;
}

export interface PendingSwitch {
  target: SpeechModelKey;
  conversion: TtsConversion;
}

interface ConversionUndo {
  doc: TtsDoc;
  model: SpeechModelKey;
  emotion: string | null;
}

function pasteIntoEditor(editor: Editor, model: SpeechModelKey, text: string): boolean {
  const parsed = parseTtsText(text, model);
  if (parsed.every((node) => node.type === 'text')) return false;
  const { content = [] } = ttsDocToEditorJson(parsed);
  const single = content.length === 1 ? (content[0].content ?? []) : content;
  return editor.chain().focus().insertContent(single).run();
}

export function useTtsEditor({ modelKey, initialText }: UseTtsEditorOptions) {
  const slashMenu = ref<SlashMenuState | null>(null);
  const doc = shallowRef<TtsDoc>(parseTtsText(initialText, modelKey.value));

  const editor: Editor = new Editor({
    extensions: [
      Document,
      Paragraph,
      Text,
      History,
      TagChip,
      Placeholder.configure({ placeholder: EDITOR_PLACEHOLDER }),
      createSlashExtension(modelKey, slashMenu),
    ],
    content: ttsDocToEditorJson(doc.value),
    editorProps: {
      attributes: { role: 'textbox', 'aria-multiline': 'true', 'aria-label': 'Speech text' },
      handlePaste: (_view, event): boolean => {
        const text = event.clipboardData?.getData('text/plain');
        return text ? pasteIntoEditor(editor, modelKey.value, text) : false;
      },
    },
    onUpdate: () => {
      doc.value = editorJsonToTtsDoc(editor.getJSON());
    },
  });
  onBeforeUnmount(() => editor.destroy());

  const text = computed(() => serializeTts(doc.value, modelKey.value));
  const hasSpeakableText = computed(() =>
    doc.value.some((node) => node.type === 'text' && node.text.trim().length > 0),
  );

  function setDoc(next: TtsDoc) {
    doc.value = next;
    editor.commands.setContent(ttsDocToEditorJson(next), { emitUpdate: false });
  }

  function insertTag(node: TtsTagNode) {
    editor.chain().focus().insertContent(chipJson(node)).run();
  }

  // ── Model switching (R-TTS-6) ──
  const pendingSwitch = ref<PendingSwitch | null>(null);
  const undoState = ref<ConversionUndo | null>(null);
  /** Minimax has no emotion chips; a converted one lands here as the model's emotion setting. */
  const emotion = ref<string | null>(null);

  /** Switches at once when every tag survives; otherwise asks first. Returns whether it switched. */
  function requestModelSwitch(target: SpeechModelKey): boolean {
    if (target === modelKey.value) return true;
    undoState.value = null;
    if (!findUnsupportedTags(doc.value, target).length) {
      modelKey.value = target;
      return true;
    }
    pendingSwitch.value = { target, conversion: convertTtsTags(doc.value, target) };
    return false;
  }

  function confirmSwitch() {
    const pending = pendingSwitch.value;
    if (!pending) return;
    undoState.value = { doc: doc.value, model: modelKey.value, emotion: emotion.value };
    setDoc(pending.conversion.doc);
    emotion.value = pending.conversion.suggestedEmotion ?? emotion.value;
    modelKey.value = pending.target;
    pendingSwitch.value = null;
  }

  function cancelSwitch() {
    pendingSwitch.value = null;
  }

  function undoConversion() {
    const previous = undoState.value;
    if (!previous) return;
    modelKey.value = previous.model;
    emotion.value = previous.emotion;
    setDoc(previous.doc);
    undoState.value = null;
  }

  return {
    editor,
    doc,
    text,
    hasSpeakableText,
    slashMenu,
    pendingSwitch,
    canUndoConversion: computed(() => undoState.value !== null),
    emotion,
    setDoc,
    insertTag,
    requestModelSwitch,
    confirmSwitch,
    cancelSwitch,
    undoConversion,
  };
}

export type TtsEditorApi = ReturnType<typeof useTtsEditor>;
