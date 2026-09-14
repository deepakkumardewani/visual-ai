import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const reduced = vi.hoisted(() => ({ value: true }));

vi.mock('@/composables/useReducedMotion', () => ({
  useReducedMotion: () => reduced,
}));

import AmbientCanvas from '@/components/Landing/AmbientCanvas.vue';

function stubCanvas() {
  const gradient = { addColorStop: vi.fn() };
  const ctx = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    createRadialGradient: vi.fn(() => gradient),
    fillRect: vi.fn(),
    globalCompositeOperation: 'source-over',
    fillStyle: '',
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never);
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', {
    configurable: true,
    value: 800,
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', {
    configurable: true,
    value: 600,
  });
  return ctx;
}

describe('AmbientCanvas', () => {
  beforeEach(() => {
    reduced.value = true;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mounts a canvas backdrop and draws a static frame under reduced motion', () => {
    const ctx = stubCanvas();
    const raf = vi.fn();
    vi.stubGlobal('requestAnimationFrame', raf);

    const wrapper = mount(AmbientCanvas);
    expect(wrapper.find('canvas').exists()).toBe(true);
    expect(ctx.clearRect).toHaveBeenCalled();
    expect(ctx.createRadialGradient).toHaveBeenCalled();
    expect(raf).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('starts a rAF loop when motion is allowed and cancels it on unmount', () => {
    reduced.value = false;
    stubCanvas();
    const scheduled: FrameRequestCallback[] = [];
    const raf = vi.fn((cb: FrameRequestCallback) => {
      scheduled.push(cb);
      return 7;
    });
    const cancel = vi.fn();
    vi.stubGlobal('requestAnimationFrame', raf);
    vi.stubGlobal('cancelAnimationFrame', cancel);

    const wrapper = mount(AmbientCanvas);
    expect(raf).toHaveBeenCalled();
    scheduled[0]?.(16);
    expect(raf).toHaveBeenCalledTimes(2);
    wrapper.unmount();
    expect(cancel).toHaveBeenCalledWith(7);
  });

  it('skips drawing when the 2d context is unavailable', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const raf = vi.fn();
    vi.stubGlobal('requestAnimationFrame', raf);
    reduced.value = false;

    const wrapper = mount(AmbientCanvas);
    expect(raf).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('recomputes canvas size on window resize', () => {
    const ctx = stubCanvas();
    const wrapper = mount(AmbientCanvas);
    ctx.setTransform.mockClear();
    window.dispatchEvent(new Event('resize'));
    expect(ctx.setTransform).toHaveBeenCalled();
    wrapper.unmount();
  });
});
