/**
 * The TTS tag library: the only home of every tag's native syntax (SPEC section 6, confirmed
 * 2026-11-15 from each model's Replicate schema or README). Used by the web editor and the API.
 * Adding a tag requires citing the schema or README here.
 */
import { TTS_PAUSE_MAX_SEC, TTS_PAUSE_MIN_SEC } from './media-limits.js';
import type { VoiceCatalogKey } from './types.js';
import type { SpeechModelKey } from '../schemas/media.js';

export { TTS_PAUSE_MAX_SEC, TTS_PAUSE_MIN_SEC };

// ── Tags ─────────────────────────────────────────────────────────────────────

export type TtsTagGroup = 'emotion' | 'non-verbal' | 'delivery' | 'pause' | 'direction';
export type TtsTagKind = 'simple' | 'pause' | 'direction';

/** Model-independent semantic ids (SPEC 6.5); the same id serializes differently per model. */
export const TTS_TAG_IDS = [
  'laugh',
  'sigh',
  'cough',
  'clear-throat',
  'breathe',
  'yawn',
  'gasp',
  'chuckle',
  'groan',
  'sniff',
  'sush',
  'humming',
  'whistles',
  'sneezes',
  'applause',
  'happy',
  'sad',
  'angry',
  'surprised',
  'fearful',
  'disgusted',
  'laughing',
  'whispering',
] as const;
export type TtsTagId = (typeof TTS_TAG_IDS)[number];

export interface TtsTagDefinition {
  /** A simple tag's semantic id, or the node type for the two parameterised tags. */
  id: TtsTagId | 'pause' | 'direction';
  kind: TtsTagKind;
  group: TtsTagGroup;
  label: string;
}

const EMOTION_IDS = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted'] as const;

const SIMPLE_TAG_GROUPS: Record<TtsTagId, TtsTagGroup> = {
  laugh: 'non-verbal',
  sigh: 'non-verbal',
  cough: 'non-verbal',
  'clear-throat': 'non-verbal',
  breathe: 'non-verbal',
  yawn: 'non-verbal',
  gasp: 'non-verbal',
  chuckle: 'non-verbal',
  groan: 'non-verbal',
  sniff: 'non-verbal',
  sush: 'non-verbal',
  humming: 'non-verbal',
  whistles: 'non-verbal',
  sneezes: 'non-verbal',
  applause: 'non-verbal',
  happy: 'emotion',
  sad: 'emotion',
  angry: 'emotion',
  surprised: 'emotion',
  fearful: 'emotion',
  disgusted: 'emotion',
  laughing: 'delivery',
  whispering: 'delivery',
};

function labelOf(id: string): string {
  return id.replace(/-/g, ' ');
}

export const TTS_TAGS: readonly TtsTagDefinition[] = [
  ...TTS_TAG_IDS.map(
    (id): TtsTagDefinition => ({
      id,
      kind: 'simple',
      group: SIMPLE_TAG_GROUPS[id],
      label: labelOf(id),
    }),
  ),
  { id: 'pause', kind: 'pause', group: 'pause', label: 'pause' },
  { id: 'direction', kind: 'direction', group: 'direction', label: 'direction' },
];

/** Inworld 2 direction presets, inserted as editable direction chips (SPEC 6.1). */
export const TTS_DIRECTION_PRESETS = [
  'say excitedly',
  'whisper in a hushed style',
  'say sadly with deliberate pauses in a low voice',
  'say with force',
  'articulate clearly',
  'say with deliberate pauses',
  'say with a falling pitch',
  'say with a rising pitch',
  'very loud',
  'very quiet',
  'say in a low tone',
  'say in a high pitch',
  'say playfully',
  'say with no pitch variation',
  'very fast',
  'very slow',
  'sing joyfully',
  'give a nasal quality',
] as const;

// ── Per-model syntax ─────────────────────────────────────────────────────────

type NativeTags = Partial<Record<SpeechModelKey, string>>;

/** Expands one cell per model family; an omitted cell means the model cannot express the tag. */
function nativeTags(cells: {
  inworld2?: string;
  inworld15?: string;
  minimax?: string;
  chatterbox?: string;
}): NativeTags {
  return {
    INWORLD_TTS_2: cells.inworld2,
    INWORLD_TTS_15_MAX: cells.inworld15,
    MINIMAX_SPEECH_28_HD: cells.minimax,
    MINIMAX_SPEECH_28_TURBO: cells.minimax,
    CHATTERBOX_TURBO: cells.chatterbox,
  };
}

/** SPEC 6.5 semantic map: tag id -> the exact native text per model (missing = unsupported). */
export const TTS_SEMANTIC_MAP: Record<TtsTagId, NativeTags> = {
  laugh: nativeTags({
    inworld2: '[laugh]',
    inworld15: '[laugh]',
    minimax: '(laughs)',
    chatterbox: '[laugh]',
  }),
  sigh: nativeTags({
    inworld2: '[sigh]',
    inworld15: '[sigh]',
    minimax: '(sighs)',
    chatterbox: '[sigh]',
  }),
  cough: nativeTags({
    inworld2: '[cough]',
    inworld15: '[cough]',
    minimax: '(coughs)',
    chatterbox: '[cough]',
  }),
  'clear-throat': nativeTags({
    inworld2: '[clear throat]',
    inworld15: '[clear_throat]',
    chatterbox: '[clear throat]',
  }),
  breathe: nativeTags({ inworld2: '[breathe]', inworld15: '[breathe]' }),
  yawn: nativeTags({ inworld2: '[yawn]', inworld15: '[yawn]' }),
  gasp: nativeTags({ minimax: '(gasps)', chatterbox: '[gasp]' }),
  chuckle: nativeTags({ chatterbox: '[chuckle]' }),
  groan: nativeTags({ chatterbox: '[groan]' }),
  sniff: nativeTags({ chatterbox: '[sniff]' }),
  sush: nativeTags({ chatterbox: '[sush]' }),
  humming: nativeTags({ minimax: '(humming)' }),
  whistles: nativeTags({ minimax: '(whistles)' }),
  sneezes: nativeTags({ minimax: '(sneezes)' }),
  applause: nativeTags({ minimax: '(applause)' }),
  happy: nativeTags({ inworld15: '[happy]' }),
  sad: nativeTags({ inworld15: '[sad]' }),
  angry: nativeTags({ inworld15: '[angry]' }),
  surprised: nativeTags({ inworld15: '[surprised]' }),
  fearful: nativeTags({ inworld15: '[fearful]' }),
  disgusted: nativeTags({ inworld15: '[disgusted]' }),
  laughing: nativeTags({ inworld15: '[laughing]' }),
  whispering: nativeTags({ inworld15: '[whispering]' }),
};

const MS_PER_SEC = 1000;
const PAUSE_DECIMALS = 2;

interface PauseSyntax {
  format: (seconds: number) => string;
  /** One capture group per number; `toSeconds` reads the match. */
  pattern: string;
  toSeconds: (match: RegExpExecArray) => number;
  /** Minimax wants pauses between speakable segments, never first or last (SPEC 6.3). */
  betweenSpeechOnly: boolean;
}

const INWORLD_15_PAUSE: PauseSyntax = {
  format: (sec) =>
    sec < 1 ? `<break time="${Math.round(sec * MS_PER_SEC)}ms" />` : `<break time="${sec}s" />`,
  pattern: '<break time="(\\d+(?:\\.\\d+)?)(ms|s)" />',
  toSeconds: (match) => Number(match[1]) / (match[2] === 'ms' ? MS_PER_SEC : 1),
  betweenSpeechOnly: false,
};

const MINIMAX_PAUSE: PauseSyntax = {
  format: (sec) => `<#${Number(sec.toFixed(PAUSE_DECIMALS))}#>`,
  pattern: '<#(\\d+(?:\\.\\d+)?)#>',
  toSeconds: (match) => Number(match[1]),
  betweenSpeechOnly: true,
};

const PAUSE_SYNTAX: Partial<Record<SpeechModelKey, PauseSyntax>> = {
  INWORLD_TTS_15_MAX: INWORLD_15_PAUSE,
  MINIMAX_SPEECH_28_HD: MINIMAX_PAUSE,
  MINIMAX_SPEECH_28_TURBO: MINIMAX_PAUSE,
};

/** Free-text direction cues exist only on Inworld 2 (SPEC 6.1). */
const DIRECTION_MODEL: SpeechModelKey = 'INWORLD_TTS_2';
const directionCue = (text: string) => `[${text}]`;
const DIRECTION_PATTERN = '\\[([^\\]]+)\\]';

// ── Document ─────────────────────────────────────────────────────────────────

export type TtsTagNode =
  | { type: 'tag'; id: TtsTagId }
  | { type: 'pause'; seconds: number }
  | { type: 'direction'; text: string };

export type TtsNode = { type: 'text'; text: string } | TtsTagNode;
export type TtsDoc = readonly TtsNode[];

/** Whether the model can express this tag at all (pause range is validated when serializing). */
function isSupported(node: TtsTagNode, model: SpeechModelKey): boolean {
  if (node.type === 'pause') return PAUSE_SYNTAX[model] !== undefined;
  if (node.type === 'direction') return model === DIRECTION_MODEL;
  return TTS_SEMANTIC_MAP[node.id][model] !== undefined;
}

function assertPauseInRange(seconds: number): void {
  if (!(seconds >= TTS_PAUSE_MIN_SEC && seconds <= TTS_PAUSE_MAX_SEC)) {
    throw new RangeError(
      `Pause must be between ${TTS_PAUSE_MIN_SEC} and ${TTS_PAUSE_MAX_SEC} seconds, got ${seconds}`,
    );
  }
}

function isSpeakable(node: TtsNode): boolean {
  return node.type === 'text' && node.text.trim().length > 0;
}

/** Removes pauses before the first and after the last speakable text. */
function dropEdgePauses(doc: TtsDoc): TtsDoc {
  const first = doc.findIndex(isSpeakable);
  const last = doc.findLastIndex(isSpeakable);
  return doc.filter((node, index) => node.type !== 'pause' || (index > first && index < last));
}

function serializeNode(node: TtsNode, model: SpeechModelKey): string {
  if (node.type === 'text') return node.text;
  if (node.type === 'pause') assertPauseInRange(node.seconds);
  if (!isSupported(node, model)) return '';
  if (node.type === 'pause') return PAUSE_SYNTAX[model]!.format(node.seconds);
  if (node.type === 'direction') return node.text.trim() ? directionCue(node.text.trim()) : '';
  return TTS_SEMANTIC_MAP[node.id][model] ?? '';
}

/**
 * Emits the model's native text. Tags the model cannot express are omitted (R-TTS-6: the UI
 * confirms this before sending); an out-of-range pause throws.
 */
export function serializeTts(doc: TtsDoc, model: SpeechModelKey): string {
  const prepared = PAUSE_SYNTAX[model]?.betweenSpeechOnly ? dropEdgePauses(doc) : doc;
  return prepared.map((node) => serializeNode(node, model)).join('');
}

/** The tag nodes the model cannot express; empty when every tag is supported. */
export function findUnsupportedTags(doc: TtsDoc, model: SpeechModelKey): TtsTagNode[] {
  return doc.filter(
    (node): node is TtsTagNode => node.type !== 'text' && !isSupported(node, model),
  );
}

// ── Conversion ───────────────────────────────────────────────────────────────

export interface TtsConversion {
  doc: TtsDoc;
  /** The converted doc serialized for the target model. */
  text: string;
  /** Chips replaced by an app-level setting instead of an inline tag (see `suggestedEmotion`). */
  approximated: TtsTagNode[];
  /** Chips with no equivalent on the target model, removed from `doc`. */
  dropped: TtsTagNode[];
  /** Minimax has no emotion chips; the first one becomes a "Set Emotion to <x>" offer (SPEC 6.5). */
  suggestedEmotion?: (typeof EMOTION_IDS)[number];
}

const MINIMAX_MODELS: readonly SpeechModelKey[] = [
  'MINIMAX_SPEECH_28_HD',
  'MINIMAX_SPEECH_28_TURBO',
];

function emotionOf(node: TtsTagNode): (typeof EMOTION_IDS)[number] | undefined {
  if (node.type !== 'tag') return undefined;
  return EMOTION_IDS.find((emotion) => emotion === node.id);
}

/**
 * Keeps every tag the target model can express and removes the rest. Semantic ids are model
 * independent, so supported chips map straight across; nothing is ever invented (no free-text
 * direction is created from another tag).
 */
export function convertTtsTags(doc: TtsDoc, model: SpeechModelKey): TtsConversion {
  const approximated: TtsTagNode[] = [];
  const dropped: TtsTagNode[] = [];
  let suggestedEmotion: TtsConversion['suggestedEmotion'];
  const kept = doc.filter((node) => {
    if (node.type === 'text' || isSupported(node, model)) return true;
    const emotion = emotionOf(node);
    if (emotion && !suggestedEmotion && MINIMAX_MODELS.includes(model)) {
      suggestedEmotion = emotion;
      approximated.push(node);
    } else {
      dropped.push(node);
    }
    return false;
  });
  return { doc: kept, text: serializeTts(kept, model), approximated, dropped, suggestedEmotion };
}

// ── Parsing ──────────────────────────────────────────────────────────────────

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Native text -> semantic id for one model, longest first so a longer tag wins a shared prefix. */
function nativeLookup(model: SpeechModelKey): Map<string, TtsTagId> {
  const entries = TTS_TAG_IDS.flatMap((id): [string, TtsTagId][] => {
    const native = TTS_SEMANTIC_MAP[id][model];
    return native ? [[native, id]] : [];
  });
  return new Map(entries.sort(([a], [b]) => b.length - a.length));
}

function buildParser(model: SpeechModelKey, lookup: Map<string, TtsTagId>): RegExp {
  const alternatives = [...lookup.keys()].map((native) => `(${escapeRegExp(native)})`);
  const pause = PAUSE_SYNTAX[model];
  if (pause) alternatives.push(pause.pattern);
  if (model === DIRECTION_MODEL) alternatives.push(DIRECTION_PATTERN);
  return new RegExp(alternatives.join('|') || '(?!)', 'g');
}

function pushText(nodes: TtsNode[], text: string): void {
  if (!text) return;
  const last = nodes[nodes.length - 1];
  if (last?.type === 'text') last.text += text;
  else nodes.push({ type: 'text', text });
}

function nodeFromMatch(
  match: RegExpExecArray,
  model: SpeechModelKey,
  lookup: Map<string, TtsTagId>,
): TtsTagNode | undefined {
  const known = lookup.get(match[0]);
  if (known) return { type: 'tag', id: known };
  const pause = PAUSE_SYNTAX[model];
  if (pause && new RegExp(`^${pause.pattern}$`).test(match[0])) {
    const seconds = pause.toSeconds(new RegExp(pause.pattern).exec(match[0])!);
    return seconds >= TTS_PAUSE_MIN_SEC && seconds <= TTS_PAUSE_MAX_SEC
      ? { type: 'pause', seconds }
      : undefined;
  }
  if (model === DIRECTION_MODEL) return { type: 'direction', text: match[0].slice(1, -1) };
  return undefined;
}

/**
 * The inverse of serializeTts, for restoring drafts and pasted text: native syntax of `model`
 * becomes chips; anything unrecognised stays literal text.
 */
export function parseTtsText(text: string, model: SpeechModelKey): TtsNode[] {
  const lookup = nativeLookup(model);
  const parser = buildParser(model, lookup);
  const nodes: TtsNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(parser)) {
    const node = nodeFromMatch(match, model, lookup);
    if (!node) continue;
    pushText(nodes, text.slice(cursor, match.index));
    nodes.push(node);
    cursor = match.index + match[0].length;
  }
  pushText(nodes, text.slice(cursor));
  return nodes;
}

// ── Voices ───────────────────────────────────────────────────────────────────

export interface TtsVoice {
  id: string;
  /** Shown in the voice list; there are no audio previews in v1 (A6). */
  description: string;
}

const PRESET_DESCRIPTION = 'Preset voice';

function presets(ids: readonly string[]): TtsVoice[] {
  return ids.map((id) => ({ id, description: PRESET_DESCRIPTION }));
}

/** Voices per catalog (SPEC 5.2: the presets named in each schema or README). */
export const TTS_VOICES: Record<VoiceCatalogKey, readonly TtsVoice[]> = {
  inworld: presets(['Ashley', 'Dennis', 'Alex', 'Darlene']),
  minimax: presets(['English_Wiselady']),
  chatterbox: presets([
    'Aaron',
    'Abigail',
    'Anaya',
    'Andy',
    'Archer',
    'Brian',
    'Chloe',
    'Dylan',
    'Emmanuel',
    'Ethan',
    'Evelyn',
    'Gavin',
    'Gordon',
    'Ivan',
    'Laura',
    'Lucy',
    'Madison',
    'Marisol',
    'Meera',
    'Walter',
  ]),
};

/** The voice a model starts on, and falls back to when the selected one is not valid (R-TTS-7). */
export const TTS_DEFAULT_VOICE: Record<VoiceCatalogKey, string> = {
  inworld: 'Ashley',
  minimax: 'English_Wiselady',
  chatterbox: 'Andy',
};
