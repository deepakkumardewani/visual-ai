import { isTypingContext } from '@visual-ai/shared';
import { useEventListener } from '@vueuse/core';
import { computed, onScopeDispose, ref, shallowRef, watch, type Ref } from 'vue';

import {
  addFade,
  commit,
  createEditState,
  createHistory,
  cut,
  computePeaks,
  nextPlayableTime,
  normalizeRegion,
  outputDuration,
  overlapsKept,
  redo as redoHistory,
  setNormalize,
  trim,
  undo as undoHistory,
  type EditHistory,
  type EditState,
  type FadeKind,
  type TimeRange,
} from '@/utils/audioEditMath';
import { createLogger } from '@/utils/logger';

import { usePlayerStore, type PlayerTrack } from '@/stores/player';

const log = createLogger('audio-editor');

export type EditorLoadStatus = 'loading' | 'ready' | 'error';

export type EditorDisabledReason = 'no-region' | 'removed' | null;

/**
 * Owns the editor's region, edit history and decoded peaks. The audio element is the player
 * store's single shared one (the waveform binds to it), so editor and mini-player never overlap.
 */
export function useAudioEditor(track: Ref<PlayerTrack>) {
  const player = usePlayerStore();

  const status = ref<EditorLoadStatus>('loading');
  const peaks = shallowRef<number[]>([]);
  const sourceDuration = ref(0);
  const media = shallowRef<HTMLAudioElement | null>(null);
  const region = ref<TimeRange | null>(null);
  const history = ref<EditHistory>(createHistory(createEditState(0)));

  const edit = computed<EditState>(() => history.value.present);
  const duration = computed(() => outputDuration(edit.value));
  const canUndo = computed(() => history.value.past.length > 0);
  const canRedo = computed(() => history.value.future.length > 0);
  const isEdited = computed(() => canUndo.value || canRedo.value);

  /** Why edit buttons are off, or null when a region on kept audio exists. */
  const editBlockedReason = computed<EditorDisabledReason>(() => {
    if (!region.value) return 'no-region';
    return overlapsKept(edit.value, region.value) ? null : 'removed';
  });

  async function decode(src: string) {
    const response = await fetch(src);
    if (!response.ok) throw new Error(`Audio request failed with ${response.status}`);
    const context = new AudioContext();
    try {
      return await context.decodeAudioData(await response.arrayBuffer());
    } finally {
      void context.close();
    }
  }

  async function load() {
    status.value = 'loading';
    media.value = player.prepare(track.value);
    try {
      const buffer = await decode(track.value.src);
      peaks.value = computePeaks(buffer.getChannelData(0));
      sourceDuration.value = buffer.duration;
      history.value = createHistory(createEditState(buffer.duration));
      region.value = null;
      status.value = 'ready';
    } catch (error) {
      log.error('Waveform load failed', error);
      status.value = 'error';
    }
  }

  function apply(next: EditState) {
    history.value = commit(history.value, next);
  }

  /** Runs `change` on the current region; never applies without one (edits are never automatic). */
  function withRegion(change: (state: EditState, range: TimeRange) => EditState) {
    if (editBlockedReason.value || !region.value) return;
    apply(change(edit.value, region.value));
    region.value = null;
  }

  const trimToRegion = () => withRegion(trim);
  const cutRegion = () => withRegion(cut);
  const fade = (kind: FadeKind) => withRegion((state, range) => addFade(state, kind, range));

  function toggleNormalize() {
    apply(setNormalize(edit.value, !edit.value.normalize));
  }

  function undo() {
    history.value = undoHistory(history.value);
  }

  function redo() {
    history.value = redoHistory(history.value);
  }

  function reset() {
    history.value = createHistory(createEditState(sourceDuration.value));
    region.value = null;
  }

  function setRegion(next: TimeRange | null) {
    region.value = next ? normalizeRegion(next, sourceDuration.value) : null;
  }

  /** `[` and `]` set one edge at the playhead; the other edge defaults to the file's bounds. */
  function setRegionEdge(edge: 'start' | 'end') {
    const time = player.currentTime;
    const current = region.value ?? { start: 0, end: sourceDuration.value };
    setRegion(edge === 'start' ? { ...current, start: time } : { ...current, end: time });
  }

  function onKeydown(event: KeyboardEvent) {
    if (status.value !== 'ready' || event.defaultPrevented) return;
    const typing = isTypingContext({
      target: event.target as HTMLElement | null,
      modalOpen: false,
    });
    if (typing) return;
    const key = event.key.toLowerCase();
    if ((event.metaKey || event.ctrlKey) && key === 'z') {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
      return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (key === '[') setRegionEdge('start');
    if (key === ']') setRegionEdge('end');
  }

  useEventListener(document, 'keydown', onKeydown);

  // Removed audio is skipped on playback so the preview matches what will be exported.
  watch(
    () => player.currentTime,
    (time) => {
      if (status.value !== 'ready' || player.track?.id !== track.value.id) return;
      const target = nextPlayableTime(edit.value, time);
      if (target === null) {
        player.pause();
        return;
      }
      if (target !== time) player.seek(target);
    },
  );

  watch(() => track.value.id, load, { immediate: true });
  onScopeDispose(() => (media.value = null));

  return {
    status,
    peaks,
    media,
    region,
    edit,
    duration,
    sourceDuration,
    canUndo,
    canRedo,
    isEdited,
    editBlockedReason,
    load,
    setRegion,
    trimToRegion,
    cutRegion,
    fade,
    toggleNormalize,
    undo,
    redo,
    reset,
  };
}
