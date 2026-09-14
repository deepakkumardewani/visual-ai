import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';

const tween = vi.hoisted(() => ({
  scrollTrigger: { kill: vi.fn() },
  kill: vi.fn(),
}));

const gsap = vi.hoisted(() => ({
  registerPlugin: vi.fn(),
  set: vi.fn(),
  to: vi.fn(() => tween),
}));

vi.mock('gsap', () => ({ gsap }));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { mock: true } }));

import { vReveal } from '@/directives/reveal';

const Host = defineComponent({
  props: {
    binding: { type: Object, default: undefined },
  },
  template: '<p v-reveal="binding">Reveal me</p>',
});

function mountReveal(binding?: { delay?: number; y?: number }) {
  return mount(Host, {
    props: { binding },
    global: { directives: { reveal: vReveal } },
  });
}

describe('vReveal', () => {
  const originalMatchMedia = window.matchMedia;
  const originalIO = globalThis.IntersectionObserver;

  beforeEach(() => {
    vi.clearAllMocks();
    class FakeIntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      constructor(cb: IntersectionObserverCallback) {
        queueMicrotask(() => {
          cb(
            [{ isIntersecting: true, target: document.body } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          );
        });
      }
    }
    globalThis.IntersectionObserver =
      FakeIntersectionObserver as unknown as typeof IntersectionObserver;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    globalThis.IntersectionObserver = originalIO;
  });

  it('animates the element into view with default distance', () => {
    const wrapper = mountReveal();
    expect(gsap.set).toHaveBeenCalledWith(wrapper.element, { opacity: 0, y: 28 });
    expect(gsap.to).toHaveBeenCalledWith(
      wrapper.element,
      expect.objectContaining({
        opacity: 1,
        y: 0,
        delay: 0,
        scrollTrigger: expect.objectContaining({ trigger: wrapper.element, once: true }),
      }),
    );
  });

  it('honors custom delay and travel distance', () => {
    const wrapper = mountReveal({ delay: 0.12, y: 40 });
    expect(gsap.set).toHaveBeenCalledWith(wrapper.element, { opacity: 0, y: 40 });
    expect(gsap.to).toHaveBeenCalledWith(wrapper.element, expect.objectContaining({ delay: 0.12 }));
  });

  it('skips animation when the user prefers reduced motion', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    mountReveal({ delay: 0.2 });
    expect(gsap.set).not.toHaveBeenCalled();
    expect(gsap.to).not.toHaveBeenCalled();
  });

  it('kills the tween and scroll trigger on unmount', () => {
    const wrapper = mountReveal();
    wrapper.unmount();
    expect(tween.scrollTrigger.kill).toHaveBeenCalled();
    expect(tween.kill).toHaveBeenCalled();
  });

  it('unmounts safely when no tween was created', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const wrapper = mountReveal();
    expect(() => wrapper.unmount()).not.toThrow();
    expect(tween.kill).not.toHaveBeenCalled();
  });
});
