import { computed } from 'vue';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const reducedMotionRef = vi.hoisted(() => ({ value: false }));
const lenisInstance = vi.hoisted(() => ({
  on: vi.fn(),
  raf: vi.fn(),
  destroy: vi.fn(),
  scrollTo: vi.fn(),
}));
const Lenis = vi.hoisted(() =>
  vi.fn().mockImplementation(function LenisMock() {
    return lenisInstance;
  }),
);
const ticker = vi.hoisted(() => ({
  add: vi.fn(),
  remove: vi.fn(),
  lagSmoothing: vi.fn(),
}));

vi.mock('@/composables/useReducedMotion', () => ({
  useReducedMotion: () => computed(() => reducedMotionRef.value),
}));

vi.mock('lenis', () => ({ default: Lenis }));

vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    ticker,
  },
}));

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: { update: vi.fn() },
}));

import { scrollToSection, useLenis } from '@/composables/useLenis';

function mountLenis() {
  return mount({
    setup() {
      useLenis();
      return {};
    },
    template: '<div />',
  });
}

describe('useLenis', () => {
  beforeEach(() => {
    reducedMotionRef.value = false;
    vi.clearAllMocks();
  });

  it('creates a Lenis instance and syncs the GSAP ticker', () => {
    const wrapper = mountLenis();
    expect(Lenis).toHaveBeenCalledTimes(1);
    expect(lenisInstance.on).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(ticker.add).toHaveBeenCalled();
    expect(ticker.lagSmoothing).toHaveBeenCalledWith(0);

    scrollToSection('#pricing');
    expect(lenisInstance.scrollTo).toHaveBeenCalledWith('#pricing', { offset: -8 });

    wrapper.unmount();
    expect(ticker.remove).toHaveBeenCalled();
    expect(lenisInstance.destroy).toHaveBeenCalled();
  });

  it('skips Lenis when reduced motion is preferred', () => {
    reducedMotionRef.value = true;
    const wrapper = mountLenis();
    expect(Lenis).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('falls back to native scroll when no Lenis instance exists', () => {
    const el = document.createElement('section');
    el.id = 'faq';
    el.scrollIntoView = vi.fn();
    document.body.appendChild(el);

    scrollToSection('#faq');
    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
    el.remove();
  });
});
