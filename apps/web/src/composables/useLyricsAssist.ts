import { storeToRefs } from 'pinia';
import { computed, ref, type Ref } from 'vue';

import type { LyricsRequest, LyricsResponse } from '@visual-ai/shared';

import { useAppStore } from '@/stores/app';

import { useFetch } from '@/composables/useFetch';
import { createLogger } from '@/utils/logger';

const log = createLogger('lyricsAssist');

const HTTP_UNPROCESSABLE = 422;
const HTTP_RATE_LIMITED = 429;
const HTTP_GATEWAY_TIMEOUT = 504;

export const LYRICS_ERROR_COPY: Record<number, string> = {
  [HTTP_RATE_LIMITED]: 'Daily lyrics limit reached. Try again tomorrow.',
  [HTTP_UNPROCESSABLE]: "This text can't be used. Try rephrasing it.",
  [HTTP_GATEWAY_TIMEOUT]: 'Lyrics took too long to write. Try again.',
};
export const LYRICS_GENERIC_ERROR = "Couldn't write lyrics. Try again.";
export const NO_SECTION_COPY = 'Place the cursor inside a [Tag] section first.';
export const LYRICS_CHANGED_COPY = 'Your lyrics changed. Run the action again.';

const SECTION_TAG_LINE = /^\[[^\]\n]+\]\s*$/;

export interface SectionRange {
  start: number;
  end: number;
}

/** Finds the tagged section (tag line included) that contains the caret, or null before any tag. */
export function findSectionAt(text: string, caret: number): SectionRange | null {
  const starts: number[] = [];
  let offset = 0;
  for (const line of text.split('\n')) {
    if (SECTION_TAG_LINE.test(line)) starts.push(offset);
    offset += line.length + 1;
  }
  const startIndex = starts.findLastIndex((start) => start <= caret);
  if (startIndex === -1) return null;
  const end = starts[startIndex + 1] ?? text.length;
  return { start: starts[startIndex], end };
}

/** Swaps a section for its rewrite, keeping one blank line before the next section. */
function replaceRange(text: string, range: SectionRange, replacement: string): string {
  const rest = text.slice(range.end);
  return `${text.slice(0, range.start)}${replacement}${rest ? `\n\n${rest}` : ''}`;
}

export type LyricsAssistPhase = 'idle' | 'loading' | 'suggested' | 'applied';

interface Pending {
  text: string;
  /** Lyrics at request time; used to detect edits made while the suggestion was open. */
  snapshot: string;
  range: SectionRange | null;
}

export interface LyricsAssistOptions {
  lyrics: Ref<string>;
  getCaret: () => number;
}

/** Drives the lyrics AI actions: fetch a suggestion, review it, accept it or undo the change. */
export function useLyricsAssist(options: LyricsAssistOptions) {
  const { lyrics, getCaret } = options;
  const { snackbar, snackbarText } = storeToRefs(useAppStore());

  const phase = ref<LyricsAssistPhase>('idle');
  const pending = ref<Pending | null>(null);
  const previous = ref('');

  const isLoading = computed(() => phase.value === 'loading');
  const suggestion = computed(() => pending.value?.text ?? '');

  function toast(message: string) {
    snackbarText.value = message;
    snackbar.value = true;
  }

  async function request(body: LyricsRequest): Promise<string | null> {
    const { data, error, response } = await useFetch('/prompt/lyrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', mode: 'cors' },
      body: JSON.stringify(body),
    }).json<LyricsResponse>();

    const text = data.value?.lyrics;
    if (!error.value && typeof text === 'string' && text.trim()) return text;

    const status = response.value?.status ?? 0;
    log.warn('lyrics request failed', { mode: body.mode, status });
    toast(LYRICS_ERROR_COPY[status] ?? LYRICS_GENERIC_ERROR);
    return null;
  }

  async function run(body: LyricsRequest, range: SectionRange | null) {
    if (isLoading.value) return;
    const snapshot = lyrics.value;
    phase.value = 'loading';
    const text = await request(body);
    if (text === null) {
      phase.value = 'idle';
      return;
    }
    pending.value = { text, snapshot, range };
    phase.value = 'suggested';
  }

  async function writeFromTheme(theme: string) {
    const trimmed = theme.trim();
    if (!trimmed) return;
    await run({ mode: 'full', theme: trimmed }, null);
  }

  async function rewriteSection() {
    const range = findSectionAt(lyrics.value, getCaret());
    if (!range) {
      toast(NO_SECTION_COPY);
      return;
    }
    await run(
      { mode: 'section', section: lyrics.value.slice(range.start, range.end).trim() },
      range,
    );
  }

  async function fitToLimit() {
    await run({ mode: 'condense', lyrics: lyrics.value }, null);
  }

  function accept() {
    const current = pending.value;
    if (!current) return;
    if (lyrics.value !== current.snapshot) {
      toast(LYRICS_CHANGED_COPY);
      discard();
      return;
    }
    previous.value = current.snapshot;
    const { range, text } = current;
    lyrics.value = range ? replaceRange(current.snapshot, range, text) : text;
    pending.value = null;
    phase.value = 'applied';
  }

  function undo() {
    if (phase.value !== 'applied') return;
    lyrics.value = previous.value;
    phase.value = 'idle';
  }

  function discard() {
    pending.value = null;
    phase.value = 'idle';
  }

  return {
    phase,
    isLoading,
    suggestion,
    writeFromTheme,
    rewriteSection,
    fitToLimit,
    accept,
    undo,
    discard,
  };
}
