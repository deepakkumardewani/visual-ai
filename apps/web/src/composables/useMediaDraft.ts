import { getModelDefinition, type ModelKey } from '@visual-ai/shared';
import { reactive, watch } from 'vue';

import { createLogger } from '@/utils/logger';

const STORAGE_KEY = 'visual-ai-media-draft';

export interface MediaDraft {
  prompt: string;
  lyrics: string;
  text: string;
  durationSec: number | null;
}

export type DraftField = keyof MediaDraft;
const DRAFT_FIELDS: readonly DraftField[] = ['prompt', 'lyrics', 'text', 'durationSec'];

export interface DraftMapping {
  /** Values for fields the model uses, exactly as typed. */
  values: Partial<MediaDraft>;
  /** Fields the user filled that this model ignores; shown with a "Not used by <model>" tag. */
  unused: DraftField[];
  /** Text fields longer than the model's limit, with the excess length. Never truncated. */
  overLimit: Partial<Record<DraftField, number>>;
  /** Tag text per unused field. */
  unusedLabels: Partial<Record<DraftField, string>>;
}

const emptyDraft = (): MediaDraft => ({
  prompt: '',
  lyrics: '',
  text: '',
  durationSec: null,
});

const log = createLogger('useMediaDraft');

function readStored(): MediaDraft {
  const draft = emptyDraft();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return draft;
    const parsed = JSON.parse(raw) as Partial<MediaDraft>;
    for (const field of ['prompt', 'lyrics', 'text'] as const) {
      if (typeof parsed[field] === 'string') draft[field] = parsed[field];
    }
    if (typeof parsed.durationSec === 'number') draft.durationSec = parsed.durationSec;
  } catch (error) {
    // Corrupt or unreadable storage must not block the studio; start from an empty draft.
    log.warn('could not read the saved draft', error);
  }
  return draft;
}

function writeStored(draft: MediaDraft) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch (error) {
    // Private mode or a full quota: the draft stays in memory for this session.
    log.warn('could not save the draft', error);
  }
}

const isFilled = (value: MediaDraft[DraftField]) =>
  typeof value === 'number' ? true : Boolean(value?.trim());

/** Maps the shared draft onto one model's fields without ever shortening user text. */
export function mapDraftToModel(draft: MediaDraft, modelKey: ModelKey): DraftMapping {
  const model = getModelDefinition(modelKey);
  const media = model.media;
  const accepted: Record<DraftField, boolean> = {
    prompt: Boolean(media?.prompt),
    lyrics: Boolean(media?.lyrics),
    text: Boolean(media?.textLimit),
    durationSec: Boolean(media?.durationSec),
  };
  const limits: Partial<Record<DraftField, number>> = {
    prompt: media?.prompt?.max,
    lyrics: media?.lyrics?.max,
    text: media?.textLimit,
  };
  const mapping: DraftMapping = {
    values: {},
    unused: [],
    overLimit: {},
    unusedLabels: {},
  };

  for (const field of DRAFT_FIELDS) {
    if (!isFilled(draft[field])) continue;
    if (!accepted[field]) {
      mapping.unused.push(field);
      mapping.unusedLabels[field] = `Not used by ${model.label}`;
      continue;
    }
    (mapping.values as Record<DraftField, unknown>)[field] = draft[field];
    const limit = limits[field];
    const length = typeof draft[field] === 'string' ? (draft[field] as string).length : 0;
    if (limit !== undefined && length > limit) mapping.overLimit[field] = length - limit;
  }
  return mapping;
}

let sharedDraft: MediaDraft | null = null;

/** Test-only: drop the singleton so a fresh draft is read from storage. */
export function resetMediaDraftForTests() {
  sharedDraft = null;
}

/** Shared draft fields persisted across studios; survives storage failures in memory. */
export function useMediaDraft() {
  if (!sharedDraft) {
    sharedDraft = reactive(readStored());
    watch(sharedDraft, (next) => writeStored({ ...next }), { deep: true });
  }
  return { draft: sharedDraft, mapDraftToModel };
}
