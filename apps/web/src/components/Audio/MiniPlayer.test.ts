import { mount, type VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MiniPlayer from '@/components/Audio/MiniPlayer.vue';
import miniPlayerSource from '@/components/Audio/MiniPlayer.vue?raw';
import { usePlayerStore, type PlayerTrack } from '@/stores/player';

const HEIGHT_VAR = '--mini-player-h';
const TRACK: PlayerTrack = { id: 't1', title: 'Night Drive', src: 'https://cdn.test/a.mp3' };

const playSpy = vi.fn(() => Promise.resolve());

class FakeAudio {
  preload = '';
  src = '';
  loop = false;
  volume = 1;
  muted = false;
  playbackRate = 1;
  paused = true;
  currentTime = 0;
  play = (...args: []) => {
    this.paused = false;
    return playSpy(...args);
  };
  pause = () => {
    this.paused = true;
  };
  load = vi.fn();
  removeAttribute = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
}

let wrapper: VueWrapper | undefined;

function mountPlayer() {
  wrapper = mount(MiniPlayer, { attachTo: document.body });
  return wrapper;
}

const bar = () => document.querySelector('[data-testid="mini-player"]');
const byId = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;

function press(target: Element, key: string, init: KeyboardEventInit = {}) {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }),
  );
}

describe('MiniPlayer', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    playSpy.mockClear();
    vi.stubGlobal('Audio', FakeAudio);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.documentElement.style.removeProperty(HEIGHT_VAR);
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('renders nothing, never calls play and sets no height variable when no track is loaded', () => {
    mountPlayer();

    expect(bar()).toBeNull();
    expect(playSpy).not.toHaveBeenCalled();
    expect(document.documentElement.style.getPropertyValue(HEIGHT_VAR)).toBe('');
  });

  it('does not autoplay when mounted with a track already loaded', () => {
    const player = usePlayerStore();
    player.track = TRACK;
    player.status = 'paused';

    mountPlayer();

    expect(bar()).not.toBeNull();
    expect(playSpy).not.toHaveBeenCalled();
  });

  it('shows the title, a labelled region and a slider-role scrubber', async () => {
    const player = usePlayerStore();
    player.track = TRACK;
    player.duration = 120;
    mountPlayer();

    expect(bar()!.getAttribute('role')).toBe('region');
    expect(bar()!.getAttribute('aria-label')).toBe('Audio player');
    expect(byId('mini-player-title').textContent?.trim()).toBe('Night Drive');
    const scrubber = byId('mini-player-scrubber') as HTMLInputElement;
    expect(scrubber.type).toBe('range');
    expect(scrubber.getAttribute('aria-label')).toBe('Seek');
    expect(scrubber.max).toBe('120');
    expect(byId('mini-player-close').getAttribute('aria-label')).toBe('Close player');
  });

  it('publishes --mini-player-h while a track is loaded and clears it on close', async () => {
    const player = usePlayerStore();
    mountPlayer();
    player.track = TRACK;
    await wrapper!.vm.$nextTick();

    expect(document.documentElement.style.getPropertyValue(HEIGHT_VAR)).toContain('56px');
    expect(document.documentElement.style.getPropertyValue(HEIGHT_VAR)).toContain(
      'safe-area-inset-bottom',
    );

    byId('mini-player-close').click();
    await wrapper!.vm.$nextTick();

    expect(document.documentElement.style.getPropertyValue(HEIGHT_VAR)).toBe('');
  });

  it('clears --mini-player-h when unmounted while visible', () => {
    usePlayerStore().track = TRACK;
    mountPlayer();
    expect(document.documentElement.style.getPropertyValue(HEIGHT_VAR)).not.toBe('');

    wrapper!.unmount();
    wrapper = undefined;

    expect(document.documentElement.style.getPropertyValue(HEIGHT_VAR)).toBe('');
  });

  it('ends playback and hides the bar when Close is clicked', async () => {
    const player = usePlayerStore();
    await player.play(TRACK);
    mountPlayer();

    byId('mini-player-close').click();
    await wrapper!.vm.$nextTick();

    expect(player.track).toBeNull();
    expect(player.status).toBe('idle');
    expect(bar()).toBeNull();
  });

  it('toggles playback from the play button', async () => {
    const player = usePlayerStore();
    await player.play(TRACK);
    mountPlayer();
    expect(player.status).toBe('playing');

    byId('play-button').click();

    expect(player.status).toBe('paused');
  });

  it('seeks 5 seconds with the arrow keys and 1 second with Shift', async () => {
    const player = usePlayerStore();
    await player.play(TRACK);
    player.duration = 100;
    player.currentTime = 20;
    mountPlayer();
    const region = bar()!;

    press(region, 'ArrowRight');
    expect(player.currentTime).toBe(25);
    press(region, 'ArrowLeft');
    expect(player.currentTime).toBe(20);
    press(region, 'ArrowRight', { shiftKey: true });
    expect(player.currentTime).toBe(21);
  });

  it('closes the player on Escape', async () => {
    const player = usePlayerStore();
    await player.play(TRACK);
    mountPlayer();

    press(bar()!, 'Escape');
    await wrapper!.vm.$nextTick();

    expect(player.track).toBeNull();
    expect(bar()).toBeNull();
  });

  it('toggles on Space from the scrubber, but leaves Space on a button to the button', async () => {
    const player = usePlayerStore();
    await player.play(TRACK);
    mountPlayer();

    press(byId('mini-player-scrubber'), ' ');
    expect(player.status).toBe('paused');

    press(byId('play-button'), ' ');
    expect(player.status).toBe('paused');
  });

  it('seeks when the scrubber input changes', async () => {
    const player = usePlayerStore();
    await player.play(TRACK);
    player.duration = 60;
    mountPlayer();
    const scrubber = byId('mini-player-scrubber') as HTMLInputElement;

    scrubber.value = '30';
    scrubber.dispatchEvent(new Event('input', { bubbles: true }));

    expect(player.currentTime).toBe(30);
  });

  it('shows "Tap to play" instead of the scrubber when the browser blocked playback', () => {
    const player = usePlayerStore();
    player.track = TRACK;
    player.status = 'blocked';
    mountPlayer();

    expect(byId('mini-player-blocked').textContent?.trim()).toBe('Tap to play');
    expect(byId('play-button').getAttribute('aria-label')).toBe('Tap to play');
    expect(document.querySelector('[data-testid="mini-player-scrubber"]')).toBeNull();
  });

  it('draws the peaks sparkline only when the track has peaks', async () => {
    const fillRect = vi.fn();
    const ctx = {
      clearRect: vi.fn(),
      fillRect,
      fillStyle: '',
      globalAlpha: 1,
    } as unknown as CanvasRenderingContext2D;
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(ctx as never);
    const player = usePlayerStore();
    player.track = { ...TRACK, peaks: [0.2, 0.8, 0.5] };
    player.duration = 10;
    player.currentTime = 5;

    mountPlayer();

    expect(document.querySelector('canvas')).not.toBeNull();
    expect(getContext).toHaveBeenCalled();
    expect(fillRect).toHaveBeenCalled();
    getContext.mockRestore();

    player.track = TRACK;
    await wrapper!.vm.$nextTick();
    expect(document.querySelector('canvas')).toBeNull();
  });

  it('disables the slide transition under prefers-reduced-motion', () => {
    // jsdom does not evaluate scoped CSS, so assert the rule exists in the component's styles.
    const reducedBlock = miniPlayerSource.split('@media (prefers-reduced-motion: reduce)')[1] ?? '';

    expect(reducedBlock).toContain('.mini-player-enter-active');
    expect(reducedBlock).toContain('transition: none');
  });
});
