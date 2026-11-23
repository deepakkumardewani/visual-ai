import { defineStore } from 'pinia';
import { ref } from 'vue';

import { createLogger } from '@/utils/logger';

const log = createLogger('player');

export interface PlayerTrack {
  id: string;
  title: string;
  src: string;
  artist?: string;
  artworkUrl?: string;
  /** Precomputed amplitude peaks (0-1) for the mini-player sparkline. */
  peaks?: number[];
}

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'blocked';

/** Seconds the Media Session seek-forward / seek-backward handlers jump by. */
const MEDIA_SESSION_SEEK_SEC = 10;
const DEFAULT_RATE = 1;
const DEFAULT_VOLUME = 1;

type ElementListeners = Partial<Record<keyof HTMLMediaElementEventMap, () => void>>;

export const usePlayerStore = defineStore('player', () => {
  const track = ref<PlayerTrack | null>(null);
  const status = ref<PlayerStatus>('idle');
  const currentTime = ref(0);
  const duration = ref(0);
  const volume = ref(DEFAULT_VOLUME);
  const muted = ref(false);
  const rate = ref(DEFAULT_RATE);
  const loop = ref(false);

  /** The one audio element for the whole app: created on the first user gesture, never per component. */
  let audio: HTMLAudioElement | null = null;
  let attached: ElementListeners | null = null;

  function ensureAudio(): HTMLAudioElement {
    if (audio) return audio;
    audio = new Audio();
    audio.preload = 'auto';
    return audio;
  }

  function buildListeners(el: HTMLAudioElement): ElementListeners {
    return {
      timeupdate: () => (currentTime.value = el.currentTime),
      durationchange: () => (duration.value = Number.isFinite(el.duration) ? el.duration : 0),
      playing: () => (status.value = 'playing'),
      waiting: () => (status.value = 'loading'),
      pause: () => {
        if (status.value === 'playing' || status.value === 'loading') status.value = 'paused';
      },
      ended: () => {
        status.value = 'paused';
        currentTime.value = el.currentTime;
      },
    };
  }

  function attach(el: HTMLAudioElement) {
    detach(el);
    attached = buildListeners(el);
    for (const [name, handler] of Object.entries(attached)) {
      el.addEventListener(name, handler);
    }
  }

  function detach(el: HTMLAudioElement) {
    if (!attached) return;
    for (const [name, handler] of Object.entries(attached)) {
      el.removeEventListener(name, handler);
    }
    attached = null;
  }

  function registerMediaSession(next: PlayerTrack) {
    const session = navigator.mediaSession;
    if (!session) return;

    session.metadata = new MediaMetadata({
      title: next.title,
      artist: next.artist ?? '',
      artwork: next.artworkUrl ? [{ src: next.artworkUrl }] : [],
    });
    session.setActionHandler('play', () => void play());
    session.setActionHandler('pause', pause);
    session.setActionHandler('seekto', (details) => seek(details.seekTime ?? 0));
    session.setActionHandler('seekbackward', () =>
      seek(currentTime.value - MEDIA_SESSION_SEEK_SEC),
    );
    session.setActionHandler('seekforward', () => seek(currentTime.value + MEDIA_SESSION_SEEK_SEC));
  }

  function clearMediaSession() {
    const session = navigator.mediaSession;
    if (!session) return;

    session.metadata = null;
    for (const action of ['play', 'pause', 'seekto', 'seekbackward', 'seekforward'] as const) {
      session.setActionHandler(action, null);
    }
  }

  function loadTrack(el: HTMLAudioElement, next: PlayerTrack) {
    attach(el);
    el.src = next.src;
    el.loop = loop.value;
    el.volume = volume.value;
    el.muted = muted.value;
    el.playbackRate = rate.value;
    track.value = next;
    currentTime.value = 0;
    duration.value = 0;
    registerMediaSession(next);
  }

  /** Autoplay policy rejection is an expected state ("Tap to play"), never an error. */
  function handlePlayRejection(error: unknown, requested: PlayerTrack) {
    if (track.value?.id !== requested.id) return;
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      status.value = 'blocked';
      return;
    }
    // A newer load interrupting this play() is not a failure.
    if (error instanceof DOMException && error.name === 'AbortError') return;
    log.error('Audio playback failed', error);
    status.value = 'paused';
  }

  /** Plays `next` (pausing whatever played before), or resumes the current track when omitted. */
  async function play(next?: PlayerTrack) {
    const el = ensureAudio();
    if (next && next.id !== track.value?.id) {
      el.pause();
      loadTrack(el, next);
    }
    const requested = track.value;
    if (!requested) return;

    status.value = 'loading';
    try {
      await el.play();
      // Resuming an already-playing element fires no `playing` event, so settle the status here.
      if (track.value?.id === requested.id && !el.paused) status.value = 'playing';
    } catch (error) {
      handlePlayRejection(error, requested);
    }
  }

  /** Loads `next` into the shared element without playing, so an editor can bind to it. */
  function prepare(next: PlayerTrack): HTMLAudioElement {
    const el = ensureAudio();
    if (next.id !== track.value?.id) {
      el.pause();
      loadTrack(el, next);
      status.value = 'paused';
    }
    return el;
  }

  function pause() {
    audio?.pause();
    if (track.value) status.value = 'paused';
  }

  function toggle() {
    if (status.value === 'playing' || status.value === 'loading') {
      pause();
      return;
    }
    void play();
  }

  function seek(seconds: number) {
    if (!audio || !track.value) return;
    const max = duration.value || seconds;
    audio.currentTime = Math.min(Math.max(seconds, 0), max);
    currentTime.value = audio.currentTime;
  }

  function close() {
    if (audio) {
      detach(audio);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    clearMediaSession();
    track.value = null;
    status.value = 'idle';
    currentTime.value = 0;
    duration.value = 0;
  }

  function setRate(next: number) {
    rate.value = next;
    if (audio) audio.playbackRate = next;
  }

  function setLoop(next: boolean) {
    loop.value = next;
    if (audio) audio.loop = next;
  }

  function setVolume(next: number) {
    volume.value = Math.min(Math.max(next, 0), 1);
    if (audio) audio.volume = volume.value;
  }

  function setMuted(next: boolean) {
    muted.value = next;
    if (audio) audio.muted = next;
  }

  return {
    track,
    status,
    currentTime,
    duration,
    volume,
    muted,
    rate,
    loop,
    play,
    prepare,
    pause,
    toggle,
    seek,
    close,
    setRate,
    setLoop,
    setVolume,
    setMuted,
  };
});
