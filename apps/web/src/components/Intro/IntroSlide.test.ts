import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

import type { VueWrapper } from '@vue/test-utils';

const reducedMotion = ref(false);
vi.mock('@/composables/useReducedMotion', () => ({ useReducedMotion: () => reducedMotion }));

import IntroSlide from './IntroSlide.vue';
import { INTRO_SLIDES } from './slides';

const slide = INTRO_SLIDES[0];
const play = vi.fn();
const pause = vi.fn();
const mounted: VueWrapper[] = [];

afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount());
});

beforeEach(() => {
  reducedMotion.value = false;
  play.mockReset().mockResolvedValue(undefined);
  pause.mockReset();
  Object.defineProperty(HTMLMediaElement.prototype, 'play', { configurable: true, value: play });
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', { configurable: true, value: pause });
});

function mountSlide(props: { load: boolean; playing: boolean }) {
  const wrapper = mount(IntroSlide, { props: { slide, ...props }, attachTo: document.body });
  mounted.push(wrapper);
  return wrapper;
}

describe('IntroSlide', () => {
  it('renders a muted looping inline video with poster, sources and size', () => {
    const wrapper = mountSlide({ load: true, playing: false });
    const video = wrapper.get('video');
    expect(video.element.muted).toBe(true);
    expect(video.element.loop).toBe(true);
    expect(video.attributes('playsinline')).toBeDefined();
    expect(video.attributes('poster')).toBe('/intro/slide-1.webp');
    expect(video.attributes('width')).toBe('960');
    expect(video.attributes('height')).toBe('600');
    expect(video.attributes('aria-label')).toBe(slide.alt);
    const sources = wrapper.findAll('source');
    expect(sources.map((s) => s.attributes('type'))).toEqual(['video/webm', 'video/mp4']);
    expect(sources[0].attributes('src')).toBe('/intro/slide-1.webm');
  });

  it('loads no media when the slide is neither current nor next', () => {
    const wrapper = mountSlide({ load: false, playing: false });
    expect(wrapper.find('video').exists()).toBe(false);
    expect(wrapper.find('img').exists()).toBe(false);
  });

  it('shows only the poster image under reduced motion', () => {
    reducedMotion.value = true;
    const wrapper = mountSlide({ load: true, playing: true });
    expect(wrapper.find('video').exists()).toBe(false);
    const img = wrapper.get('img');
    expect(img.attributes('src')).toBe('/intro/slide-1.webp');
    expect(img.attributes('alt')).toBe(slide.alt);
    expect(play).not.toHaveBeenCalled();
  });

  it('plays when it becomes the visible slide and pauses when it leaves', async () => {
    const wrapper = mountSlide({ load: true, playing: true });
    await nextTick();
    expect(play).toHaveBeenCalled();
    expect(play).toHaveBeenCalledTimes(1);
    expect(pause).not.toHaveBeenCalled();
    await wrapper.setProps({ playing: false });
    expect(pause).toHaveBeenCalled();
  });

  it('does not play a preloaded slide that is not visible', async () => {
    mountSlide({ load: true, playing: false });
    await nextTick();
    expect(play).not.toHaveBeenCalled();
    expect(pause).toHaveBeenCalled();
  });

  it('keeps the poster fallback when autoplay is refused', async () => {
    play.mockRejectedValue(new Error('NotAllowedError'));
    const wrapper = mountSlide({ load: true, playing: true });
    await nextTick();
    await Promise.resolve();
    expect(wrapper.find('video').exists()).toBe(true);
  });

  it('tolerates environments where play returns nothing', async () => {
    play.mockReturnValue(undefined);
    const wrapper = mountSlide({ load: true, playing: true });
    await nextTick();
    expect(wrapper.find('video').exists()).toBe(true);
  });
});
