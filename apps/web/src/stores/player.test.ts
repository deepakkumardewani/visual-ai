import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePlayerStore, type PlayerTrack } from '@/stores/player';

const loggerError = vi.hoisted(() => vi.fn());
vi.mock('@/utils/logger', () => ({
  createLogger: () => ({ error: loggerError, warn: vi.fn(), info: vi.fn(), debug: vi.fn() }),
}));

class FakeAudio extends EventTarget {
  static instances: FakeAudio[] = [];
  preload = '';
  src = '';
  loop = false;
  volume = 1;
  muted = false;
  playbackRate = 1;
  currentTime = 0;
  duration = Number.NaN;
  paused = true;
  playImpl: () => Promise<void> = () => Promise.resolve();
  listenerCount = 0;

  constructor() {
    super();
    FakeAudio.instances.push(this);
  }

  addEventListener(...args: Parameters<EventTarget['addEventListener']>) {
    this.listenerCount += 1;
    super.addEventListener(...args);
  }

  removeEventListener(...args: Parameters<EventTarget['removeEventListener']>) {
    this.listenerCount -= 1;
    super.removeEventListener(...args);
  }

  play = vi.fn(async () => {
    await this.playImpl();
    this.paused = false;
  });

  pause = vi.fn(() => {
    this.paused = true;
    this.dispatchEvent(new Event('pause'));
  });

  removeAttribute = vi.fn((name: string) => {
    if (name === 'src') this.src = '';
  });

  load = vi.fn();

  fire(name: string) {
    this.dispatchEvent(new Event(name));
  }
}

type Handler = ((details: { seekTime?: number }) => void) | null;

function installMediaSession() {
  const handlers: Record<string, Handler> = {};
  const session = {
    metadata: null as unknown,
    setActionHandler: vi.fn((action: string, handler: Handler) => {
      handlers[action] = handler;
    }),
  };
  Object.defineProperty(navigator, 'mediaSession', { value: session, configurable: true });
  return { session, handlers };
}

class FakeMediaMetadata {
  constructor(public init: Record<string, unknown>) {}
}

const trackA: PlayerTrack = {
  id: 'a',
  title: 'Track A',
  src: 'https://cdn.test/a.mp3',
  artist: 'Artist A',
  artworkUrl: 'https://cdn.test/a.jpg',
};
const trackB: PlayerTrack = { id: 'b', title: 'Track B', src: 'https://cdn.test/b.mp3' };

const lastAudio = () => FakeAudio.instances[FakeAudio.instances.length - 1];

describe('usePlayerStore', () => {
  let media: ReturnType<typeof installMediaSession>;

  beforeEach(() => {
    setActivePinia(createPinia());
    FakeAudio.instances = [];
    loggerError.mockClear();
    vi.stubGlobal('Audio', FakeAudio);
    vi.stubGlobal('MediaMetadata', FakeMediaMetadata);
    media = installMediaSession();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, 'mediaSession');
  });

  it('starts idle with default controls and creates no audio element', () => {
    const store = usePlayerStore();
    expect(store.status).toBe('idle');
    expect(store.track).toBeNull();
    expect(store.volume).toBe(1);
    expect(store.rate).toBe(1);
    expect(store.muted).toBe(false);
    expect(store.loop).toBe(false);
    expect(FakeAudio.instances).toHaveLength(0);
  });

  it('plays a track on a lazily created element and settles to playing', async () => {
    const store = usePlayerStore();
    await store.play(trackA);

    expect(FakeAudio.instances).toHaveLength(1);
    expect(lastAudio().preload).toBe('auto');
    expect(lastAudio().src).toBe(trackA.src);
    expect(store.track).toEqual(trackA);
    expect(store.status).toBe('playing');
  });

  it('applies stored volume, mute, rate and loop to a newly loaded track', async () => {
    const store = usePlayerStore();
    store.setVolume(0.4);
    store.setMuted(true);
    store.setRate(1.5);
    store.setLoop(true);
    await store.play(trackA);

    expect(lastAudio()).toMatchObject({ volume: 0.4, muted: true, playbackRate: 1.5, loop: true });
  });

  it('pauses the previous track and reuses the single element when switching', async () => {
    const store = usePlayerStore();
    await store.play(trackA);
    const el = lastAudio();
    el.pause.mockClear();
    await store.play(trackB);

    expect(FakeAudio.instances).toHaveLength(1);
    expect(el.pause).toHaveBeenCalledTimes(1);
    expect(el.src).toBe(trackB.src);
    expect(store.track?.id).toBe('b');
    expect(store.currentTime).toBe(0);
  });

  it('resumes the same track without reloading when play() is called with it again', async () => {
    const store = usePlayerStore();
    await store.play(trackA);
    store.pause();
    lastAudio().currentTime = 12;
    await store.play(trackA);

    expect(lastAudio().currentTime).toBe(12);
    expect(store.status).toBe('playing');
  });

  it('does nothing when play() is called with no track loaded', async () => {
    const store = usePlayerStore();
    await store.play();
    expect(lastAudio().play).not.toHaveBeenCalled();
    expect(store.status).toBe('idle');
  });

  it('sets status blocked on NotAllowedError without logging an error', async () => {
    const store = usePlayerStore();
    await store.play(trackA);
    lastAudio().playImpl = () => Promise.reject(new DOMException('blocked', 'NotAllowedError'));
    await store.play(trackB);

    expect(store.status).toBe('blocked');
    expect(loggerError).not.toHaveBeenCalled();
  });

  it('ignores an AbortError from an interrupted play()', async () => {
    const store = usePlayerStore();
    await store.play(trackA);
    const el = lastAudio();
    el.playImpl = () => Promise.reject(new DOMException('interrupted', 'AbortError'));
    await store.play(trackB);

    expect(store.status).toBe('loading');
    expect(loggerError).not.toHaveBeenCalled();
  });

  it('logs and pauses on an unexpected play() failure', async () => {
    const store = usePlayerStore();
    await store.play(trackA);
    const boom = new Error('decode failed');
    lastAudio().playImpl = () => Promise.reject(boom);
    await store.play(trackB);

    expect(store.status).toBe('paused');
    expect(loggerError).toHaveBeenCalledWith('Audio playback failed', boom);
  });

  it('ignores a rejection that belongs to a track that is no longer current', async () => {
    const store = usePlayerStore();
    await store.play(trackA);
    let rejectFirst: (error: unknown) => void = () => undefined;
    lastAudio().playImpl = () =>
      new Promise<void>((_, reject) => {
        rejectFirst = reject;
      });
    const pending = store.play(trackB);
    lastAudio().playImpl = () => Promise.resolve();
    await store.play(trackA);
    rejectFirst(new DOMException('blocked', 'NotAllowedError'));
    await pending;

    expect(store.track?.id).toBe('a');
    expect(store.status).toBe('playing');
  });

  it('does not report playing when the element is still paused after play() resolves', async () => {
    const store = usePlayerStore();
    await store.play(trackA);
    lastAudio().play.mockImplementationOnce(() => Promise.resolve());
    lastAudio().paused = true;
    await store.play();

    expect(store.status).toBe('loading');
  });

  it('mirrors element events into reactive state', async () => {
    const store = usePlayerStore();
    await store.play(trackA);
    const el = lastAudio();

    el.currentTime = 7;
    el.fire('timeupdate');
    expect(store.currentTime).toBe(7);

    el.duration = 90;
    el.fire('durationchange');
    expect(store.duration).toBe(90);

    el.duration = Number.POSITIVE_INFINITY;
    el.fire('durationchange');
    expect(store.duration).toBe(0);

    el.fire('waiting');
    expect(store.status).toBe('loading');
    el.fire('playing');
    expect(store.status).toBe('playing');
    el.fire('pause');
    expect(store.status).toBe('paused');
  });

  it('keeps blocked status when a pause event arrives', async () => {
    const store = usePlayerStore();
    await store.play(trackA);
    store.status = 'blocked';
    lastAudio().fire('pause');
    expect(store.status).toBe('blocked');
  });

  it('marks the track paused with its final time when it ends', async () => {
    const store = usePlayerStore();
    await store.play(trackA);
    lastAudio().currentTime = 90;
    lastAudio().fire('ended');

    expect(store.status).toBe('paused');
    expect(store.currentTime).toBe(90);
  });

  describe('toggle', () => {
    it('pauses while playing and resumes while paused', async () => {
      const store = usePlayerStore();
      await store.play(trackA);
      store.toggle();
      expect(store.status).toBe('paused');

      store.toggle();
      await vi.waitFor(() => expect(store.status).toBe('playing'));
    });

    it('pauses while loading', async () => {
      const store = usePlayerStore();
      await store.play(trackA);
      lastAudio().fire('waiting');
      store.toggle();
      expect(store.status).toBe('paused');
    });
  });

  describe('pause', () => {
    it('is safe before any track or element exists', () => {
      const store = usePlayerStore();
      store.pause();
      expect(store.status).toBe('idle');
    });
  });

  describe('seek', () => {
    it('is a no-op without a track', () => {
      const store = usePlayerStore();
      store.seek(5);
      expect(store.currentTime).toBe(0);
    });

    it('clamps to zero and to the duration', async () => {
      const store = usePlayerStore();
      await store.play(trackA);
      lastAudio().duration = 60;
      lastAudio().fire('durationchange');

      store.seek(-4);
      expect(lastAudio().currentTime).toBe(0);
      store.seek(75);
      expect(lastAudio().currentTime).toBe(60);
      store.seek(30);
      expect(store.currentTime).toBe(30);
    });

    it('allows any non-negative position while the duration is unknown', async () => {
      const store = usePlayerStore();
      await store.play(trackA);
      store.seek(42);
      expect(lastAudio().currentTime).toBe(42);
    });
  });

  describe('close', () => {
    it('stops playback, releases the source and resets state', async () => {
      const store = usePlayerStore();
      await store.play(trackA);
      const el = lastAudio();
      el.currentTime = 20;
      el.fire('timeupdate');
      store.close();

      expect(el.pause).toHaveBeenCalled();
      expect(el.removeAttribute).toHaveBeenCalledWith('src');
      expect(el.load).toHaveBeenCalled();
      expect(store.track).toBeNull();
      expect(store.status).toBe('idle');
      expect(store.currentTime).toBe(0);
      expect(store.duration).toBe(0);
    });

    it('stops reacting to element events after closing', async () => {
      const store = usePlayerStore();
      await store.play(trackA);
      store.close();
      lastAudio().currentTime = 33;
      lastAudio().fire('timeupdate');
      expect(store.currentTime).toBe(0);
    });

    it('is safe before any element exists', () => {
      const store = usePlayerStore();
      store.close();
      expect(store.status).toBe('idle');
      expect(media.session.metadata).toBeNull();
    });
  });

  describe('controls', () => {
    it('stores settings without an element and applies them to a live one', async () => {
      const store = usePlayerStore();
      store.setRate(2);
      store.setLoop(true);
      store.setVolume(0.5);
      store.setMuted(true);
      expect(store).toMatchObject({ rate: 2, loop: true, volume: 0.5, muted: true });
      expect(FakeAudio.instances).toHaveLength(0);

      await store.play(trackA);
      store.setRate(0.75);
      store.setLoop(false);
      store.setVolume(0.8);
      store.setMuted(false);
      expect(lastAudio()).toMatchObject({
        playbackRate: 0.75,
        loop: false,
        volume: 0.8,
        muted: false,
      });
    });

    it('clamps volume into 0-1', () => {
      const store = usePlayerStore();
      store.setVolume(3);
      expect(store.volume).toBe(1);
      store.setVolume(-1);
      expect(store.volume).toBe(0);
    });
  });

  describe('media session', () => {
    it('publishes metadata and the five handlers while a track plays', async () => {
      const store = usePlayerStore();
      await store.play(trackA);

      expect(media.session.metadata).toEqual(
        new FakeMediaMetadata({
          title: 'Track A',
          artist: 'Artist A',
          artwork: [{ src: 'https://cdn.test/a.jpg' }],
        }),
      );
      for (const action of ['play', 'pause', 'seekto', 'seekbackward', 'seekforward']) {
        expect(media.handlers[action]).toBeTypeOf('function');
      }
    });

    it('uses empty artist and artwork when the track has none', async () => {
      const store = usePlayerStore();
      await store.play(trackB);
      expect(media.session.metadata).toEqual(
        new FakeMediaMetadata({ title: 'Track B', artist: '', artwork: [] }),
      );
    });

    it('routes handler invocations to the player', async () => {
      const store = usePlayerStore();
      await store.play(trackA);
      lastAudio().currentTime = 30;
      lastAudio().fire('timeupdate');

      media.handlers.pause?.({});
      expect(store.status).toBe('paused');
      media.handlers.play?.({});
      await vi.waitFor(() => expect(store.status).toBe('playing'));

      media.handlers.seekto?.({ seekTime: 12 });
      expect(lastAudio().currentTime).toBe(12);
      media.handlers.seekto?.({});
      expect(lastAudio().currentTime).toBe(0);
      media.handlers.seekforward?.({});
      expect(lastAudio().currentTime).toBe(10);
      media.handlers.seekbackward?.({});
      expect(lastAudio().currentTime).toBe(0);
    });

    it('clears metadata and handlers on close', async () => {
      const store = usePlayerStore();
      await store.play(trackA);
      store.close();

      expect(media.session.metadata).toBeNull();
      for (const action of ['play', 'pause', 'seekto', 'seekbackward', 'seekforward']) {
        expect(media.handlers[action]).toBeNull();
      }
    });

    it('works when the browser has no Media Session', async () => {
      Reflect.deleteProperty(navigator, 'mediaSession');
      const store = usePlayerStore();
      await store.play(trackA);
      store.close();
      expect(store.status).toBe('idle');
    });
  });

  it('leaves exactly one set of listeners after 50 track switches', async () => {
    const store = usePlayerStore();
    for (let i = 0; i < 50; i += 1) {
      await store.play({ id: `t${i}`, title: `T${i}`, src: `https://cdn.test/${i}.mp3` });
    }
    expect(FakeAudio.instances).toHaveLength(1);
    expect(lastAudio().listenerCount).toBe(6);

    store.close();
    expect(lastAudio().listenerCount).toBe(0);
  });
});
