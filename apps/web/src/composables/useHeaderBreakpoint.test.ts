import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick } from 'vue';

import { useHeaderBreakpoint } from '@/composables/useHeaderBreakpoint';

type Listener = (event: { matches: boolean }) => void;

let viewportWidth = 0;
const listeners = new Map<Listener, string>();

function evaluate(query: string): boolean {
  const max = /\(max-width:\s*(\d+)px\)/.exec(query);
  if (max) return viewportWidth <= Number(max[1]);
  const min = /\(min-width:\s*(\d+)px\)/.exec(query);
  if (min) return viewportWidth >= Number(min[1]);
  return false;
}

function setViewport(width: number) {
  viewportWidth = width;
  listeners.forEach((query, listener) => listener({ matches: evaluate(query) }));
}

function tierAt(width: number) {
  viewportWidth = width;
  const scope = effectScope();
  const tier = scope.run(() => {
    const { isMobile, isTablet, isDesktop } = useHeaderBreakpoint();
    return { mobile: isMobile.value, tablet: isTablet.value, desktop: isDesktop.value };
  });
  scope.stop();
  return tier;
}

describe('useHeaderBreakpoint', () => {
  beforeEach(() => {
    listeners.clear();
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        get matches() {
          return evaluate(query);
        },
        media: query,
        addEventListener: (_: string, cb: Listener) => listeners.set(cb, query),
        removeEventListener: (_: string, cb: Listener) => listeners.delete(cb),
        addListener: (cb: Listener) => listeners.set(cb, query),
        removeListener: (cb: Listener) => listeners.delete(cb),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    [767, { mobile: true, tablet: false, desktop: false }],
    [768, { mobile: false, tablet: true, desktop: false }],
    [1023, { mobile: false, tablet: true, desktop: false }],
    [1024, { mobile: false, tablet: false, desktop: true }],
  ])('classifies a %ipx viewport', (width, expected) => {
    expect(tierAt(width)).toEqual(expected);
  });

  it('queries the 767px max and 1024px min media rules', () => {
    tierAt(500);
    const queries = vi.mocked(window.matchMedia).mock.calls.map(([query]) => query);
    expect(queries).toContain('(max-width: 767px)');
    expect(queries).toContain('(min-width: 1024px)');
  });

  it('reacts when the viewport crosses a breakpoint', async () => {
    viewportWidth = 500;
    const scope = effectScope();
    const tier = scope.run(() => useHeaderBreakpoint())!;
    expect(tier.isMobile.value).toBe(true);

    setViewport(800);
    await nextTick();
    expect(tier.isMobile.value).toBe(false);
    expect(tier.isTablet.value).toBe(true);

    setViewport(1200);
    await nextTick();
    expect(tier.isTablet.value).toBe(false);
    expect(tier.isDesktop.value).toBe(true);
    scope.stop();
  });
});
