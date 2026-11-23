/** Single source of truth for media keyboard shortcuts; the help popover renders this list. */

export interface MediaShortcut {
  id: string;
  /** Value of `KeyboardEvent.key` (letters lower-case); `Mod` means Cmd on macOS, Ctrl elsewhere. */
  key: string;
  /** Human label, e.g. "Space" or "Mod+Z". */
  label: string;
  description: string;
  /** Modifier shortcuts stay active while typing; single keys do not. */
  modifier: boolean;
}

export const MEDIA_SHORTCUTS: readonly MediaShortcut[] = [
  {
    id: 'play-pause',
    key: ' ',
    label: 'Space',
    description: 'Play or pause',
    modifier: false,
  },
  {
    id: 'seek-back',
    key: 'ArrowLeft',
    label: 'Left arrow',
    description: 'Seek back 5 seconds',
    modifier: false,
  },
  {
    id: 'seek-forward',
    key: 'ArrowRight',
    label: 'Right arrow',
    description: 'Seek forward 5 seconds',
    modifier: false,
  },
  {
    id: 'mute',
    key: 'm',
    label: 'M',
    description: 'Mute or unmute',
    modifier: false,
  },
  {
    id: 'loop',
    key: 'l',
    label: 'L',
    description: 'Turn loop on or off',
    modifier: false,
  },
  {
    id: 'region-start',
    key: '[',
    label: '[',
    description: 'Set region start',
    modifier: false,
  },
  {
    id: 'region-end',
    key: ']',
    label: ']',
    description: 'Set region end',
    modifier: false,
  },
  {
    id: 'generate',
    key: 'Mod+Enter',
    label: 'Mod+Enter',
    description: 'Generate',
    modifier: true,
  },
  {
    id: 'undo',
    key: 'Mod+z',
    label: 'Mod+Z',
    description: 'Undo',
    modifier: true,
  },
  {
    id: 'redo',
    key: 'Mod+Shift+z',
    label: 'Mod+Shift+Z',
    description: 'Redo',
    modifier: true,
  },
  {
    id: 'close',
    key: 'Escape',
    label: 'Escape',
    description: 'Close the open panel',
    modifier: false,
  },
  {
    id: 'help',
    key: '?',
    label: '?',
    description: 'Show keyboard shortcuts',
    modifier: false,
  },
];

/** The slice of an element this check reads, so it works without DOM typings. */
export interface TypingTargetLike {
  tagName?: string;
  isContentEditable?: boolean;
  closest?: (selector: string) => unknown;
}

const TYPING_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];
const TYPING_SELECTOR = '[contenteditable="true"], .ProseMirror';

export interface TypingContextInput {
  target: TypingTargetLike | null;
  /** True while an AppModal is open; it owns the keyboard. */
  modalOpen: boolean;
  /** Mod+Enter keeps working inside fields and modals. */
  isModEnter?: boolean;
}

/** True when a single-key shortcut must be ignored. Mod+Enter is always exempt. */
export function isTypingContext({
  target,
  modalOpen,
  isModEnter = false,
}: TypingContextInput): boolean {
  if (isModEnter) return false;
  if (modalOpen) return true;
  if (!target) return false;
  if (target.tagName && TYPING_TAGS.includes(target.tagName.toUpperCase())) return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest?.(TYPING_SELECTOR));
}
