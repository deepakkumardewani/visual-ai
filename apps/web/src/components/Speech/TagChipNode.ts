import { mergeAttributes, Node, type JSONContent } from '@tiptap/core';
import type { Node as ProseNode } from '@tiptap/pm/model';
import type { EditorView } from '@tiptap/pm/view';
import {
  TTS_PAUSE_MAX_SEC,
  TTS_PAUSE_MIN_SEC,
  TTS_TAGS,
  type TtsTagGroup,
  type TtsTagNode,
} from '@visual-ai/shared';

export const TAG_CHIP_NODE_NAME = 'ttsTag';
const CHIP_DATA_ATTRIBUTE = 'data-tts-tag';
const DIRECTION_INPUT_MIN_CHARS = 8;

export const PAUSE_RANGE_MESSAGE = `Pause must be between ${TTS_PAUSE_MIN_SEC} and ${TTS_PAUSE_MAX_SEC} seconds.`;
const DIRECTION_EMPTY_MESSAGE = 'Direction cannot be empty.';

/** The group a chip belongs to; pause and direction are groups of their own. */
export function tagGroup(tag: TtsTagNode): TtsTagGroup {
  if (tag.type === 'pause') return 'pause';
  if (tag.type === 'direction') return 'direction';
  return TTS_TAGS.find((definition) => definition.id === tag.id)?.group ?? 'non-verbal';
}

export function tagLabel(tag: TtsTagNode): string {
  if (tag.type === 'pause') return 'pause';
  if (tag.type === 'direction') return 'direction';
  return tag.id.replace(/-/g, ' ');
}

/** Editor JSON for one chip, the only shape the editor ever stores a tag in. */
export function chipJson(tag: TtsTagNode): JSONContent {
  return { type: TAG_CHIP_NODE_NAME, attrs: { tag } };
}

function isTtsTagNode(value: unknown): value is TtsTagNode {
  if (typeof value !== 'object' || value === null) return false;
  const { type } = value as { type?: unknown };
  return type === 'tag' || type === 'pause' || type === 'direction';
}

function parseChipAttribute(element: HTMLElement): TtsTagNode | null {
  const raw = element.getAttribute(CHIP_DATA_ATTRIBUTE);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isTtsTagNode(parsed) ? parsed : null;
  } catch {
    // A chip pasted from foreign HTML with a mangled attribute is simply not a chip.
    return null;
  }
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  attributes: Record<string, string> = {},
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value);
  return el;
}

interface ChipContext {
  node: ProseNode;
  view: EditorView;
  getPos: () => number | undefined;
}

function replaceTag({ node, view, getPos }: ChipContext, tag: TtsTagNode): void {
  const pos = getPos();
  if (pos === undefined) return;
  view.dispatch(view.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, tag }));
  view.focus();
}

function removeChip({ node, view, getPos }: ChipContext): void {
  const pos = getPos();
  if (pos === undefined) return;
  view.dispatch(view.state.tr.delete(pos, pos + node.nodeSize));
  view.focus();
}

/** Validates the raw field value; returns the tag to apply or the message to show. */
function readEdit(tag: TtsTagNode, raw: string): { tag: TtsTagNode } | { error: string } {
  if (tag.type === 'pause') {
    const seconds = Number(raw);
    const valid = raw.trim() !== '' && seconds >= TTS_PAUSE_MIN_SEC && seconds <= TTS_PAUSE_MAX_SEC;
    return valid ? { tag: { type: 'pause', seconds } } : { error: PAUSE_RANGE_MESSAGE };
  }
  const text = raw.trim();
  return text ? { tag: { type: 'direction', text } } : { error: DIRECTION_EMPTY_MESSAGE };
}

/** The editable value inside a pause or direction chip, with its inline validation message. */
function buildEditor(context: ChipContext, tag: TtsTagNode, chip: HTMLElement): void {
  const isPause = tag.type === 'pause';
  const initial =
    tag.type === 'pause' ? String(tag.seconds) : tag.type === 'direction' ? tag.text : '';
  const input = element('input', 'tts-chip__value', {
    type: 'text',
    inputmode: isPause ? 'decimal' : 'text',
    'aria-label': isPause ? 'Pause length in seconds' : 'Direction text',
  });
  input.value = initial;
  if (!isPause) input.size = Math.max(initial.length, DIRECTION_INPUT_MIN_CHARS);
  const message = element('span', 'tts-chip__error', { role: 'alert' });
  message.hidden = true;

  const validate = () => {
    const result = readEdit(tag, input.value);
    const error = 'error' in result ? result.error : '';
    message.textContent = error;
    message.hidden = !error;
    input.setAttribute('aria-invalid', String(Boolean(error)));
    return result;
  };
  input.addEventListener('input', validate);
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const result = validate();
    if ('tag' in result) replaceTag(context, result.tag);
  });
  input.addEventListener('blur', () => {
    input.value = initial;
    validate();
  });
  chip.append(input);
  if (isPause) {
    const unit = element('span', 'tts-chip__unit');
    unit.textContent = 's';
    chip.append(unit);
  }
  chip.append(message);
}

function buildChip(context: ChipContext): HTMLElement {
  const tag = context.node.attrs.tag as TtsTagNode;
  const label = tagLabel(tag);
  const chip = element('span', `tts-chip tts-chip--${tagGroup(tag)}`, {
    role: 'group',
    'aria-label': `Tag: ${label}`,
  });
  chip.contentEditable = 'false';
  chip.append(element('span', 'tts-chip__label'));
  chip.firstElementChild!.textContent = label;
  if (tag.type !== 'tag') buildEditor(context, tag, chip);

  const remove = element('button', 'tts-chip__remove', {
    type: 'button',
    'aria-label': `Remove tag ${label}`,
  });
  remove.textContent = '×';
  remove.addEventListener('click', () => removeChip(context));
  chip.append(remove);
  return chip;
}

const isInteractive = (target: EventTarget | null) =>
  target instanceof HTMLInputElement || target instanceof HTMLButtonElement;

/**
 * An inline atom chip for one tag. The node stores the semantic tag only; the model's native
 * syntax is produced by serializeTts, never kept here.
 */
export const TagChip = Node.create({
  name: TAG_CHIP_NODE_NAME,
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      tag: {
        default: null,
        parseHTML: parseChipAttribute,
        renderHTML: (attributes) => ({ [CHIP_DATA_ATTRIBUTE]: JSON.stringify(attributes.tag) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: `span[${CHIP_DATA_ATTRIBUTE}]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ({ node, view, getPos }) => ({
      dom: buildChip({ node, view, getPos: getPos as () => number | undefined }),
      // Fields and the remove button own their events; ProseMirror must not treat them as edits.
      stopEvent: (event) => isInteractive(event.target),
      ignoreMutation: () => true,
    });
  },

  addKeyboardShortcuts() {
    return {
      // Backspace next to a chip removes the whole chip, never a part of it.
      Backspace: ({ editor }) => {
        const { selection } = editor.state;
        if (!selection.empty) return false;
        const before = selection.$from.nodeBefore;
        if (before?.type.name !== TAG_CHIP_NODE_NAME) return false;
        const to = selection.from;
        return editor.commands.deleteRange({ from: to - before.nodeSize, to });
      },
    };
  },
});
