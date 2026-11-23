import { mount, type VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MediaAssetDto } from '@visual-ai/shared';

import ResultCard from '@/components/Studio/ResultCard.vue';
import { useAppStore } from '@/stores/app';

const AUDIO_ASSET: MediaAssetDto = {
  id: 'a1',
  type: 'audio',
  feature: 'music',
  modelKey: 'fake-music',
  title: 'Night Drive',
  url: 'https://cdn.test/night.mp3',
  creditsCharged: 12,
  saved: true,
} as MediaAssetDto;

const VIDEO_ASSET: MediaAssetDto = {
  ...AUDIO_ASSET,
  id: 'v1',
  type: 'video',
  feature: 'video',
  title: 'Sunrise',
  url: 'https://cdn.test/sunrise.mp4',
  posterUrl: 'https://cdn.test/sunrise.jpg',
} as MediaAssetDto;

let wrapper: VueWrapper | undefined;
let scrollIntoView: ReturnType<typeof vi.fn>;

function mountCard(asset: MediaAssetDto) {
  wrapper = mount(ResultCard, {
    props: { asset },
    attachTo: document.body,
    global: { stubs: { UnsavedResultNotice: false } },
  });
  return wrapper;
}

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  );
}

describe('ResultCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView =
      scrollIntoView as unknown as typeof Element.prototype.scrollIntoView;
    stubReducedMotion(false);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('moves focus to Play on a successful audio result', async () => {
    mountCard(AUDIO_ASSET);
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(document.querySelector('[data-testid="play-button"]'));
    });
  });

  it('focuses the video element for a video result', async () => {
    mountCard(VIDEO_ASSET);

    await vi.waitFor(() => {
      expect(document.activeElement).toBe(document.querySelector('video'));
    });
    expect(document.querySelector('video')!.getAttribute('poster')).toBe(VIDEO_ASSET.posterUrl);
  });

  it('shows the ready toast and scrolls the card into view smoothly', async () => {
    mountCard(AUDIO_ASSET);
    const app = useAppStore();

    await vi.waitFor(() => expect(app.snackbar).toBe(true));

    expect(app.snackbarText).toBe('Your result is ready');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
  });

  it('scrolls without animation under prefers-reduced-motion', async () => {
    stubReducedMotion(true);
    mountCard(AUDIO_ASSET);

    await vi.waitFor(() => expect(scrollIntoView).toHaveBeenCalled());

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'center' });
  });

  it('offers a download link for the asset', () => {
    const link = mountCard(AUDIO_ASSET).get('[data-testid="result-download"]');

    expect(link.attributes('href')).toBe(AUDIO_ASSET.url);
    expect(link.attributes('download')).toBe('Night Drive');
  });

  it('shows no unsaved notice for a saved asset', () => {
    mountCard(AUDIO_ASSET);

    expect(document.querySelector('[data-testid="unsaved-result-notice"]')).toBeNull();
  });

  it('shows the unsaved notice when saved is false and hides it once dismissed', async () => {
    const card = mountCard({ ...AUDIO_ASSET, saved: false });
    expect(document.querySelector('[data-testid="unsaved-result-notice"]')).not.toBeNull();

    await card.get('[data-testid="unsaved-dismiss"]').trigger('click');

    expect(document.querySelector('[data-testid="unsaved-result-notice"]')).toBeNull();
  });

  it('reveals again and re-shows the notice for a new unsaved asset', async () => {
    const card = mountCard({ ...AUDIO_ASSET, saved: false });
    await card.get('[data-testid="unsaved-dismiss"]').trigger('click');
    const app = useAppStore();
    app.snackbar = false;

    await card.setProps({ asset: { ...AUDIO_ASSET, id: 'a2', saved: false } });

    await vi.waitFor(() => expect(app.snackbar).toBe(true));
    expect(document.querySelector('[data-testid="unsaved-result-notice"]')).not.toBeNull();
  });
});
