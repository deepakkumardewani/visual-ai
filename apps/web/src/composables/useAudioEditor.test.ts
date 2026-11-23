import { flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref, type EffectScope } from 'vue';

import { useAudioEditor } from '@/composables/useAudioEditor';
import { usePlayerStore, type PlayerTrack } from '@/stores/player';

const logError = vi.hoisted(() => vi.fn());
vi.mock('@/utils/logger', () => ({
  createLogger: () => ({ error: logError, warn: vi.fn(), info: vi.fn(), debug: vi.fn() }),
}));

const TRACK: PlayerTrack = { id: 't1', title: 'Night Drive', src: 'https://cdn.test/a.mp3' };
const OTHER: PlayerTrack = { id: 't2', title: 'Other', src: 'https://cdn.test/b.mp3' };
const SOURCE_SECONDS = 10;

const constructedAudio: FakeAudio[] = [];

class FakeAudio {
  preload = '';
  src = '';
  loop = false;
  volume = 1;
  muted = false;
  playbackRate = 1;
  paused = true;
  currentTime = 0;
  duration = Number.NaN;
  listeners = new Map<string, () => void>();
  constructor() {
    constructedAudio.push(this);
  }
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn(() => {
    this.paused = true;
  });
  load = vi.fn();
  removeAttribute = vi.fn();
  addEventListener = vi.fn((name: string, handler: () => void) => {
    this.listeners.set(name, handler);
  });
  removeEventListener = vi.fn();
}

const closeContext = vi.fn();
const decodeAudioData = vi.fn();

class FakeAudioContext {
  decodeAudioData = decodeAudioData;
  close = closeContext;
}

function stubDecoded(duration = SOURCE_SECONDS, samples = new Float32Array([0.2, -0.8, 0.4, 0.1])) {
  decodeAudioData.mockResolvedValue({ duration, getChannelData: () => samples });
}

function stubFetch(ok = true, status = 200) {
  const fetchMock = vi.fn(() =>
    Promise.resolve({ ok, status, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

let scope: EffectScope | undefined;

async function setup(initial: PlayerTrack = TRACK) {
  const track = ref(initial);
  const scoped = effectScope();
  scope = scoped;
  const editor = scoped.run(() => useAudioEditor(track))!;
  await flushPromises();
  return { editor, track };
}

function press(key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

describe('useAudioEditor', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    constructedAudio.length = 0;
    logError.mockClear();
    closeContext.mockClear();
    decodeAudioData.mockReset();
    vi.stubGlobal('Audio', FakeAudio);
    vi.stubGlobal('AudioContext', FakeAudioContext);
    stubDecoded();
    stubFetch();
  });

  afterEach(() => {
    scope?.stop();
    scope = undefined;
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  describe('loading', () => {
    it('decodes the track, computes peaks and starts with the whole file kept', async () => {
      const { editor } = await setup();
      expect(editor.status.value).toBe('ready');
      expect(editor.peaks.value).toEqual([
        expect.closeTo(0.2, 5),
        expect.closeTo(0.8, 5),
        expect.closeTo(0.4, 5),
        expect.closeTo(0.1, 5),
      ]);
      expect(editor.sourceDuration.value).toBe(SOURCE_SECONDS);
      expect(editor.duration.value).toBe(SOURCE_SECONDS);
      expect(editor.region.value).toBeNull();
      expect(closeContext).toHaveBeenCalledTimes(1);
    });

    it('is loading until the decode resolves', () => {
      decodeAudioData.mockReturnValue(new Promise(() => undefined));
      const track = ref(TRACK);
      scope = effectScope();
      const editor = scope.run(() => useAudioEditor(track))!;
      expect(editor.status.value).toBe('loading');
    });

    it('shares the single player-store audio element and constructs only one Audio', async () => {
      const { editor } = await setup();
      expect(constructedAudio).toHaveLength(1);
      expect(editor.media.value).toBe(constructedAudio[0]);
      expect(constructedAudio[0].src).toBe(TRACK.src);
      expect(usePlayerStore().track?.id).toBe(TRACK.id);
    });

    it('reports an error when the request fails', async () => {
      stubFetch(false, 404);
      const { editor } = await setup();
      expect(editor.status.value).toBe('error');
      expect(logError).toHaveBeenCalledWith(
        'Waveform load failed',
        expect.objectContaining({ message: 'Audio request failed with 404' }),
      );
      expect(closeContext).not.toHaveBeenCalled();
    });

    it('reports an error and still closes the context when decoding fails', async () => {
      decodeAudioData.mockRejectedValue(new Error('bad audio'));
      const { editor } = await setup();
      expect(editor.status.value).toBe('error');
      expect(closeContext).toHaveBeenCalledTimes(1);
    });

    it('reloads when the track changes and can be retried with load()', async () => {
      const fetchMock = stubFetch();
      const { editor, track } = await setup();
      track.value = OTHER;
      await flushPromises();
      expect(fetchMock).toHaveBeenLastCalledWith(OTHER.src);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      await editor.load();
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('clears media when the scope is disposed', async () => {
      const { editor } = await setup();
      scope?.stop();
      expect(editor.media.value).toBeNull();
    });
  });

  describe('region and edits', () => {
    it('reports why edits are blocked', async () => {
      const { editor } = await setup();
      expect(editor.editBlockedReason.value).toBe('no-region');
      editor.setRegion({ start: 2, end: 4 });
      expect(editor.editBlockedReason.value).toBeNull();
    });

    it('widens and clamps the region it is given', async () => {
      const { editor } = await setup();
      editor.setRegion({ start: 8, end: 99 });
      expect(editor.region.value).toEqual({ start: 8, end: SOURCE_SECONDS });
      editor.setRegion(null);
      expect(editor.region.value).toBeNull();
    });

    it('trim keeps only the region, updates the duration and clears the selection (AC1)', async () => {
      const { editor } = await setup();
      editor.setRegion({ start: 2, end: 6 });
      editor.trimToRegion();
      expect(editor.edit.value.segments).toEqual([{ start: 2, end: 6 }]);
      expect(editor.duration.value).toBe(4);
      expect(editor.region.value).toBeNull();
    });

    it('cut removes the region and updates the duration (AC1)', async () => {
      const { editor } = await setup();
      editor.setRegion({ start: 2, end: 6 });
      editor.cutRegion();
      expect(editor.edit.value.segments).toEqual([
        { start: 0, end: 2 },
        { start: 6, end: 10 },
      ]);
      expect(editor.duration.value).toBe(6);
    });

    it('fades add a fade over the region', async () => {
      const { editor } = await setup();
      editor.setRegion({ start: 0, end: 2 });
      editor.fade('in');
      editor.setRegion({ start: 8, end: 10 });
      editor.fade('out');
      expect(editor.edit.value.fades).toEqual([
        { kind: 'in', start: 0, end: 2 },
        { kind: 'out', start: 8, end: 10 },
      ]);
    });

    it('never applies an edit without a region', async () => {
      const { editor } = await setup();
      editor.trimToRegion();
      editor.cutRegion();
      editor.fade('in');
      expect(editor.isEdited.value).toBe(false);
      expect(editor.duration.value).toBe(SOURCE_SECONDS);
    });

    it('does nothing for a region on audio that was already removed', async () => {
      const { editor } = await setup();
      editor.setRegion({ start: 2, end: 6 });
      editor.cutRegion();
      editor.setRegion({ start: 3, end: 5 });
      expect(editor.editBlockedReason.value).toBe('removed');
      editor.trimToRegion();
      expect(editor.duration.value).toBe(6);
    });

    it('toggles normalize on and off', async () => {
      const { editor } = await setup();
      editor.toggleNormalize();
      expect(editor.edit.value.normalize).toBe(true);
      editor.toggleNormalize();
      expect(editor.edit.value.normalize).toBe(false);
    });
  });

  describe('history', () => {
    it('undo and redo step through edits', async () => {
      const { editor } = await setup();
      expect(editor.canUndo.value).toBe(false);
      editor.setRegion({ start: 2, end: 6 });
      editor.trimToRegion();
      expect(editor.canUndo.value).toBe(true);
      editor.undo();
      expect(editor.duration.value).toBe(SOURCE_SECONDS);
      expect(editor.canRedo.value).toBe(true);
      editor.redo();
      expect(editor.duration.value).toBe(4);
      expect(editor.canRedo.value).toBe(false);
    });

    it('caps the undo stack at 100 entries across 101 edits (AC2)', async () => {
      const { editor } = await setup();
      for (let i = 0; i < 101; i++) editor.toggleNormalize();
      let undos = 0;
      while (editor.canUndo.value) {
        editor.undo();
        undos++;
      }
      expect(undos).toBe(100);
    });

    it('reset restores the original, clears history and the selection (AC3 of toolbar)', async () => {
      const { editor } = await setup();
      editor.setRegion({ start: 2, end: 6 });
      editor.trimToRegion();
      editor.setRegion({ start: 0, end: 1 });
      editor.reset();
      expect(editor.duration.value).toBe(SOURCE_SECONDS);
      expect(editor.isEdited.value).toBe(false);
      expect(editor.region.value).toBeNull();
    });
  });

  describe('keyboard', () => {
    async function withEdit() {
      const ctx = await setup();
      ctx.editor.setRegion({ start: 2, end: 6 });
      ctx.editor.trimToRegion();
      return ctx;
    }

    it('Mod+Z undoes and Mod+Shift+Z redoes (AC3)', async () => {
      const { editor } = await withEdit();
      const undone = press('z', { ctrlKey: true });
      expect(undone.defaultPrevented).toBe(true);
      expect(editor.duration.value).toBe(SOURCE_SECONDS);
      press('Z', { metaKey: true, shiftKey: true });
      expect(editor.duration.value).toBe(4);
    });

    it('ignores undo while typing in a text field', async () => {
      const { editor } = await withEdit();
      const input = document.createElement('input');
      document.body.append(input);
      const event = press('z', { ctrlKey: true }, input);
      expect(event.defaultPrevented).toBe(false);
      expect(editor.duration.value).toBe(4);
    });

    it('ignores keys another handler already handled', async () => {
      const { editor } = await withEdit();
      const swallow = (event: Event) => event.preventDefault();
      window.addEventListener('keydown', swallow, { capture: true });
      press('z', { ctrlKey: true });
      window.removeEventListener('keydown', swallow, { capture: true });
      expect(editor.duration.value).toBe(4);
    });

    it('ignores keys until the waveform is ready', async () => {
      stubFetch(false, 500);
      const { editor } = await setup();
      const event = press('z', { ctrlKey: true });
      expect(event.defaultPrevented).toBe(false);
      expect(editor.canUndo.value).toBe(false);
    });

    it('[ sets the region start at the playhead and ] sets the end', async () => {
      const { editor } = await setup();
      const player = usePlayerStore();
      player.currentTime = 3;
      press('[');
      expect(editor.region.value).toEqual({ start: 3, end: SOURCE_SECONDS });
      player.currentTime = 7;
      press(']');
      expect(editor.region.value).toEqual({ start: 3, end: 7 });
    });

    it('] with no region selects from the file start to the playhead', async () => {
      const { editor } = await setup();
      usePlayerStore().currentTime = 4;
      press(']');
      expect(editor.region.value).toEqual({ start: 0, end: 4 });
    });

    it('ignores [ and ] with a modifier and unrelated keys', async () => {
      const { editor } = await setup();
      press('[', { ctrlKey: true });
      press(']', { altKey: true });
      press('a');
      expect(editor.region.value).toBeNull();
    });

    it('ignores [ while typing', async () => {
      const { editor } = await setup();
      const textarea = document.createElement('textarea');
      document.body.append(textarea);
      press('[', {}, textarea);
      expect(editor.region.value).toBeNull();
    });
  });

  describe('playback of an edited track', () => {
    it('skips a removed gap to the next kept audio', async () => {
      const { editor } = await setup();
      const player = usePlayerStore();
      editor.setRegion({ start: 3, end: 5 });
      editor.cutRegion();
      player.currentTime = 3.5;
      await nextTick();
      expect(player.currentTime).toBe(5);
      expect(constructedAudio[0].currentTime).toBe(5);
    });

    it('leaves playback alone inside kept audio', async () => {
      const { editor } = await setup();
      const player = usePlayerStore();
      editor.setRegion({ start: 3, end: 5 });
      editor.cutRegion();
      constructedAudio[0].currentTime = 1;
      player.currentTime = 1;
      await nextTick();
      expect(constructedAudio[0].currentTime).toBe(1);
    });

    it('pauses once playback passes the last kept audio', async () => {
      const { editor } = await setup();
      const player = usePlayerStore();
      editor.setRegion({ start: 0, end: 6 });
      editor.trimToRegion();
      constructedAudio[0].pause.mockClear();
      player.currentTime = 7;
      await nextTick();
      expect(constructedAudio[0].pause).toHaveBeenCalled();
    });

    it('does not touch playback while another track is loaded in the player', async () => {
      const { editor } = await setup();
      const player = usePlayerStore();
      editor.setRegion({ start: 0, end: 6 });
      editor.trimToRegion();
      player.prepare(OTHER);
      constructedAudio[0].pause.mockClear();
      player.currentTime = 9;
      await nextTick();
      expect(constructedAudio[0].pause).not.toHaveBeenCalled();
    });
  });
});
