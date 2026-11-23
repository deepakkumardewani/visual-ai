import { describe, expect, it } from 'vitest';

import {
  EDITOR_PEAK_BUCKETS,
  EDIT_HISTORY_LIMIT,
  MIN_REGION_SEC,
  addFade,
  commit,
  computePeaks,
  createEditState,
  createHistory,
  cut,
  nextPlayableTime,
  normalizeRegion,
  outputDuration,
  outputSampleCount,
  overlapsKept,
  redo,
  setNormalize,
  trim,
  undo,
} from '@/utils/audioEditMath';

const SAMPLE_RATE = 44100;

describe('createEditState', () => {
  it('keeps the whole file as one segment', () => {
    expect(createEditState(5)).toEqual({
      segments: [{ start: 0, end: 5 }],
      fades: [],
      normalize: false,
    });
  });

  it('has no segments for an empty or negative duration', () => {
    expect(createEditState(0).segments).toEqual([]);
    expect(createEditState(-3).segments).toEqual([]);
  });
});

describe('trim and cut', () => {
  it('trim keeps only the region (AC1)', () => {
    const state = trim(createEditState(10), { start: 2, end: 6 });
    expect(state.segments).toEqual([{ start: 2, end: 6 }]);
    expect(outputDuration(state)).toBe(4);
  });

  it('trim to a region outside the audio leaves nothing', () => {
    const state = trim(createEditState(10), { start: 12, end: 14 });
    expect(state.segments).toEqual([]);
    expect(outputDuration(state)).toBe(0);
  });

  it('cut removes the middle and splits the segment', () => {
    const state = cut(createEditState(10), { start: 3, end: 5 });
    expect(state.segments).toEqual([
      { start: 0, end: 3 },
      { start: 5, end: 10 },
    ]);
    expect(outputDuration(state)).toBe(8);
  });

  it('cut at the start or end leaves one piece', () => {
    expect(cut(createEditState(10), { start: 0, end: 4 }).segments).toEqual([
      { start: 4, end: 10 },
    ]);
    expect(cut(createEditState(10), { start: 7, end: 10 }).segments).toEqual([
      { start: 0, end: 7 },
    ]);
  });

  it('cut of the whole file leaves nothing', () => {
    expect(cut(createEditState(10), { start: 0, end: 10 }).segments).toEqual([]);
  });

  it('cut that overlaps a gap only removes remaining audio', () => {
    const once = cut(createEditState(10), { start: 3, end: 5 });
    const twice = cut(once, { start: 4, end: 7 });
    expect(twice.segments).toEqual([
      { start: 0, end: 3 },
      { start: 7, end: 10 },
    ]);
  });

  it('cut outside every segment changes nothing', () => {
    const state = createEditState(10);
    expect(cut(state, { start: 12, end: 15 }).segments).toEqual(state.segments);
  });

  it('does not mutate the input state', () => {
    const state = createEditState(10);
    cut(state, { start: 3, end: 5 });
    expect(state.segments).toEqual([{ start: 0, end: 10 }]);
  });
});

describe('outputSampleCount', () => {
  it('counts exact samples for the whole file', () => {
    expect(outputSampleCount(createEditState(5), SAMPLE_RATE)).toBe(220500);
  });

  it('counts exact samples after trim', () => {
    const state = trim(createEditState(5), { start: 1, end: 3 });
    expect(outputSampleCount(state, SAMPLE_RATE)).toBe(88200);
  });

  it('counts exact samples after cut', () => {
    const state = cut(createEditState(5), { start: 1, end: 2 });
    expect(outputSampleCount(state, SAMPLE_RATE)).toBe(176400);
  });

  it('rounds each boundary once so fractional cuts do not drift', () => {
    // 0.00001s * 44100 = 0.441 -> 0; 0.00003s * 44100 = 1.323 -> 1
    const state = trim(createEditState(1), { start: 0.00001, end: 0.00003 });
    expect(outputSampleCount(state, SAMPLE_RATE)).toBe(1);
  });

  it('is zero for an empty state', () => {
    expect(outputSampleCount(createEditState(0), SAMPLE_RATE)).toBe(0);
  });
});

describe('addFade', () => {
  it('adds a fade inside kept audio', () => {
    const state = addFade(createEditState(10), 'in', { start: 0, end: 2 });
    expect(state.fades).toEqual([{ kind: 'in', start: 0, end: 2 }]);
  });

  it('replaces a repeated fade on the same range and kind', () => {
    const once = addFade(createEditState(10), 'out', { start: 8, end: 10 });
    const twice = addFade(once, 'out', { start: 8, end: 10 });
    expect(twice.fades).toHaveLength(1);
  });

  it('keeps a fade of the other kind on the same range', () => {
    const once = addFade(createEditState(10), 'out', { start: 8, end: 10 });
    const both = addFade(once, 'in', { start: 8, end: 10 });
    expect(both.fades.map((fade) => fade.kind)).toEqual(['out', 'in']);
  });

  it('drops fades that fall entirely into removed audio', () => {
    const faded = addFade(createEditState(10), 'in', { start: 4, end: 6 });
    const cutAway = cut(faded, { start: 3, end: 7 });
    expect(cutAway.fades).toEqual([]);
  });

  it('clips a fade to the kept audio after a cut', () => {
    const faded = addFade(createEditState(10), 'in', { start: 2, end: 6 });
    const clipped = cut(faded, { start: 4, end: 8 });
    expect(clipped.fades).toEqual([{ kind: 'in', start: 2, end: 4 }]);
  });
});

describe('setNormalize', () => {
  it('sets the flag without touching segments', () => {
    const state = setNormalize(createEditState(4), true);
    expect(state.normalize).toBe(true);
    expect(state.segments).toEqual([{ start: 0, end: 4 }]);
  });
});

describe('overlapsKept', () => {
  const state = cut(createEditState(10), { start: 3, end: 5 });

  it('is true for a region touching kept audio', () => {
    expect(overlapsKept(state, { start: 2, end: 4 })).toBe(true);
  });

  it('is false for a region only inside the removed gap', () => {
    expect(overlapsKept(state, { start: 3, end: 5 })).toBe(false);
  });
});

describe('normalizeRegion', () => {
  it('orders swapped edges', () => {
    expect(normalizeRegion({ start: 6, end: 2 }, 10)).toEqual({ start: 2, end: 6 });
  });

  it('clamps into the file', () => {
    expect(normalizeRegion({ start: -4, end: 99 }, 10)).toEqual({ start: 0, end: 10 });
  });

  it('widens a tiny selection to the minimum length', () => {
    const region = normalizeRegion({ start: 2, end: 2 }, 10);
    expect(region.start).toBe(2);
    expect(region.end).toBeCloseTo(2 + MIN_REGION_SEC, 10);
  });

  it('keeps the minimum length at the end of the file', () => {
    const region = normalizeRegion({ start: 10, end: 10 }, 10);
    expect(region.end).toBe(10);
    expect(region.end - region.start).toBeCloseTo(MIN_REGION_SEC, 10);
  });

  it('never returns end before start for a zero duration', () => {
    expect(normalizeRegion({ start: 1, end: 2 }, 0)).toEqual({ start: 0, end: 0 });
  });
});

describe('nextPlayableTime', () => {
  const state = cut(createEditState(10), { start: 3, end: 5 });

  it('returns the time itself inside kept audio', () => {
    expect(nextPlayableTime(state, 1)).toBe(1);
    expect(nextPlayableTime(state, 6)).toBe(6);
  });

  it('jumps a removed gap to the next kept start', () => {
    expect(nextPlayableTime(state, 4)).toBe(5);
  });

  it('is null past the last kept audio', () => {
    expect(nextPlayableTime(state, 10)).toBeNull();
  });

  it('is null for an empty state', () => {
    expect(nextPlayableTime(createEditState(0), 0)).toBeNull();
  });
});

describe('history', () => {
  const stateWith = (end: number) => createEditState(end);

  it('commit records the present and clears redo', () => {
    const first = commit(createHistory(stateWith(1)), stateWith(2));
    const undone = undo(first);
    const next = commit(undone, stateWith(3));
    expect(next.past).toEqual([stateWith(1)]);
    expect(next.present).toEqual(stateWith(3));
    expect(next.future).toEqual([]);
  });

  it('undo and redo step through edits', () => {
    const edited = commit(createHistory(stateWith(1)), stateWith(2));
    const back = undo(edited);
    expect(back.present).toEqual(stateWith(1));
    expect(back.future).toEqual([stateWith(2)]);
    const forward = redo(back);
    expect(forward.present).toEqual(stateWith(2));
    expect(forward.future).toEqual([]);
  });

  it('undo and redo are no-ops at the ends', () => {
    const history = createHistory(stateWith(1));
    expect(undo(history)).toBe(history);
    expect(redo(history)).toBe(history);
  });

  it('caps the undo stack at EDIT_HISTORY_LIMIT after 101 operations (AC2)', () => {
    let history = createHistory(stateWith(0));
    for (let i = 1; i <= EDIT_HISTORY_LIMIT + 1; i++) history = commit(history, stateWith(i));
    expect(history.past).toHaveLength(EDIT_HISTORY_LIMIT);
    expect(history.present).toEqual(stateWith(EDIT_HISTORY_LIMIT + 1));
    // The oldest step (initial state) was dropped.
    expect(history.past[0]).toEqual(stateWith(1));
  });

  it('redo respects the cap when the stack is full', () => {
    let history = createHistory(stateWith(0));
    for (let i = 1; i <= EDIT_HISTORY_LIMIT; i++) history = commit(history, stateWith(i));
    history = undo(history);
    history = redo(history);
    expect(history.past).toHaveLength(EDIT_HISTORY_LIMIT);
    expect(history.present).toEqual(stateWith(EDIT_HISTORY_LIMIT));
  });

  it('redo trims the past when it would exceed the limit', () => {
    const full = {
      past: Array.from({ length: EDIT_HISTORY_LIMIT }, (_, i) => stateWith(i)),
      present: stateWith(500),
      future: [stateWith(501)],
    };
    const result = redo(full);
    expect(result.past).toHaveLength(EDIT_HISTORY_LIMIT);
    expect(result.past[0]).toEqual(stateWith(1));
  });
});

describe('computePeaks', () => {
  it('takes the max absolute value per bucket', () => {
    const samples = new Float32Array([0.1, -0.5, 0.25, 0.75, -1, 0.5]);
    expect(computePeaks(samples, 3)).toEqual([0.5, 0.75, 1]);
  });

  it('caps buckets at EDITOR_PEAK_BUCKETS for a 5 second fixture (AC6)', () => {
    const samples = new Float32Array(5 * SAMPLE_RATE).fill(0.5);
    expect(computePeaks(samples)).toHaveLength(EDITOR_PEAK_BUCKETS);
  });

  it('caps an oversized bucket request', () => {
    const samples = new Float32Array(10000).fill(0.2);
    expect(computePeaks(samples, 99999)).toHaveLength(EDITOR_PEAK_BUCKETS);
  });

  it('never returns more buckets than samples', () => {
    expect(computePeaks(new Float32Array([0.3, 0.6]), 50)).toEqual([
      expect.closeTo(0.3, 5),
      expect.closeTo(0.6, 5),
    ]);
  });

  it('floors fractional and sub-one bucket counts to at least one', () => {
    expect(computePeaks(new Float32Array([0.5, 1]), 0)).toEqual([1]);
    expect(computePeaks(new Float32Array([0.5, 1]), 1.9)).toEqual([1]);
  });

  it('returns a single zero bucket for empty samples', () => {
    expect(computePeaks(new Float32Array(0))).toEqual([0]);
  });
});
