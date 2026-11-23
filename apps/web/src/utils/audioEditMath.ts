/**
 * Pure, non-destructive edit model for the audio editor. Every position is in seconds on the
 * ORIGINAL file; an edit only changes which segments are kept and which fades are applied, and
 * nothing touches audio data until export.
 */

/** Undo steps kept; the oldest is dropped when the next edit would exceed it. */
export const EDIT_HISTORY_LIMIT = 100;
/** Upper bound on waveform peak buckets, so a long file never draws an unbounded canvas. */
export const EDITOR_PEAK_BUCKETS = 2000;
/** Smallest selectable region; shorter selections are widened to this. */
export const MIN_REGION_SEC = 0.1;

export interface TimeRange {
  start: number;
  end: number;
}

export type FadeKind = 'in' | 'out';

export interface Fade extends TimeRange {
  kind: FadeKind;
}

export interface EditState {
  /** Kept ranges of the original, sorted and non-overlapping. */
  segments: TimeRange[];
  fades: Fade[];
  normalize: boolean;
}

export interface EditHistory {
  past: EditState[];
  present: EditState;
  future: EditState[];
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function createEditState(duration: number): EditState {
  const end = Math.max(duration, 0);
  return { segments: end > 0 ? [{ start: 0, end }] : [], fades: [], normalize: false };
}

export function outputDuration(state: EditState): number {
  return state.segments.reduce((total, { start, end }) => total + (end - start), 0);
}

/** Exact sample count of the edited output; each boundary is rounded once so cuts never drift. */
export function outputSampleCount(state: EditState, sampleRate: number): number {
  return state.segments.reduce(
    (total, { start, end }) =>
      total + (Math.round(end * sampleRate) - Math.round(start * sampleRate)),
    0,
  );
}

/** Clamps a region into [0, duration] with at least MIN_REGION_SEC of length. */
export function normalizeRegion(region: TimeRange, duration: number): TimeRange {
  const start = clamp(
    Math.min(region.start, region.end),
    0,
    Math.max(duration - MIN_REGION_SEC, 0),
  );
  const end = clamp(Math.max(region.start, region.end), start + MIN_REGION_SEC, duration);
  return { start, end: Math.max(end, start) };
}

function clipRange(range: TimeRange, bounds: TimeRange): TimeRange | null {
  const start = Math.max(range.start, bounds.start);
  const end = Math.min(range.end, bounds.end);
  return end > start ? { start, end } : null;
}

function subtractRange(range: TimeRange, hole: TimeRange): TimeRange[] {
  const pieces: TimeRange[] = [];
  if (hole.start > range.start)
    pieces.push({ start: range.start, end: Math.min(hole.start, range.end) });
  if (hole.end < range.end) pieces.push({ start: Math.max(hole.end, range.start), end: range.end });
  return pieces.filter((piece) => piece.end > piece.start);
}

function keepFadesWithin(fades: Fade[], segments: TimeRange[]): Fade[] {
  return fades.flatMap((fade) =>
    segments.flatMap((segment) => {
      const clipped = clipRange(fade, segment);
      return clipped ? [{ ...fade, ...clipped }] : [];
    }),
  );
}

function withSegments(state: EditState, segments: TimeRange[]): EditState {
  return { ...state, segments, fades: keepFadesWithin(state.fades, segments) };
}

/** Keeps only the audio inside `region`. */
export function trim(state: EditState, region: TimeRange): EditState {
  const kept = state.segments.flatMap((segment) => clipRange(segment, region) ?? []);
  return withSegments(state, kept);
}

/** Removes the audio inside `region`. */
export function cut(state: EditState, region: TimeRange): EditState {
  return withSegments(
    state,
    state.segments.flatMap((segment) => subtractRange(segment, region)),
  );
}

/** Fades the kept audio of `region`; a repeat on the same range replaces the earlier fade. */
export function addFade(state: EditState, kind: FadeKind, region: TimeRange): EditState {
  const others = state.fades.filter(
    (fade) => !(fade.kind === kind && fade.start === region.start && fade.end === region.end),
  );
  return { ...state, fades: keepFadesWithin([...others, { kind, ...region }], state.segments) };
}

export function setNormalize(state: EditState, normalize: boolean): EditState {
  return { ...state, normalize };
}

/** Whether `region` overlaps any kept audio; edits on removed audio would do nothing. */
export function overlapsKept(state: EditState, region: TimeRange): boolean {
  return state.segments.some((segment) => clipRange(segment, region) !== null);
}

/**
 * Where playback should be at `time`: itself inside kept audio, the next kept start inside a
 * removed gap, or null once past the last kept audio.
 */
export function nextPlayableTime(state: EditState, time: number): number | null {
  for (const segment of state.segments) {
    if (time < segment.start) return segment.start;
    if (time < segment.end) return time;
  }
  return null;
}

export function createHistory(initial: EditState): EditHistory {
  return { past: [], present: initial, future: [] };
}

/** Records `next` as the new present; the oldest step falls off past EDIT_HISTORY_LIMIT. */
export function commit(history: EditHistory, next: EditState): EditHistory {
  const past = [...history.past, history.present].slice(-EDIT_HISTORY_LIMIT);
  return { past, present: next, future: [] };
}

export function undo(history: EditHistory): EditHistory {
  const previous = history.past.at(-1);
  if (!previous) return history;
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redo(history: EditHistory): EditHistory {
  const [next, ...rest] = history.future;
  if (!next) return history;
  return {
    past: [...history.past, history.present].slice(-EDIT_HISTORY_LIMIT),
    present: next,
    future: rest,
  };
}

/** Max-abs peak per bucket (0-1); buckets are capped at EDITOR_PEAK_BUCKETS. */
export function computePeaks(samples: Float32Array, buckets = EDITOR_PEAK_BUCKETS): number[] {
  const count = Math.min(
    Math.max(Math.floor(buckets), 1),
    EDITOR_PEAK_BUCKETS,
    samples.length || 1,
  );
  const size = samples.length / count;
  const peaks: number[] = [];
  for (let bucket = 0; bucket < count; bucket++) {
    const from = Math.floor(bucket * size);
    const to = Math.max(Math.floor((bucket + 1) * size), from + 1);
    let peak = 0;
    for (let i = from; i < to && i < samples.length; i++)
      peak = Math.max(peak, Math.abs(samples[i]));
    peaks.push(peak);
  }
  return peaks;
}
