import { vi } from 'vitest';

type Listener = (event: { matches: boolean; media: string }) => void;

interface MediaState {
  width: number;
  reducedMotion: boolean;
}

function evaluate(query: string, state: MediaState): boolean {
  if (query.includes('prefers-reduced-motion: reduce')) return state.reducedMotion;
  const max = /max-width:\s*(\d+)px/.exec(query);
  const min = /min-width:\s*(\d+)px/.exec(query);
  if (max && state.width > Number(max[1])) return false;
  if (min && state.width < Number(min[1])) return false;
  // Hover/pointer clauses are not modelled; width decides.
  return true;
}

/**
 * Installs a controllable window.matchMedia driven by a viewport width and a reduced-motion flag.
 * Call restore() in afterEach.
 */
export function installMatchMedia(initial: Partial<MediaState> = {}) {
  const state: MediaState = { width: 1280, reducedMotion: false, ...initial };
  const original = window.matchMedia;
  const entries: { query: string; last: boolean; listeners: Set<Listener> }[] = [];

  window.matchMedia = ((query: string) => {
    const entry = {
      query,
      last: evaluate(query, state),
      listeners: new Set<Listener>(),
    };
    entries.push(entry);
    const mql = {
      get matches() {
        return evaluate(query, state);
      },
      media: query,
      onchange: null,
      addEventListener: (_: string, cb: Listener) => entry.listeners.add(cb),
      removeEventListener: (_: string, cb: Listener) => entry.listeners.delete(cb),
      addListener: (cb: Listener) => entry.listeners.add(cb),
      removeListener: (cb: Listener) => entry.listeners.delete(cb),
      dispatchEvent: vi.fn(),
    };
    return mql;
  }) as unknown as typeof window.matchMedia;

  function notify() {
    for (const entry of entries) {
      const next = evaluate(entry.query, state);
      if (next === entry.last) continue;
      entry.last = next;
      entry.listeners.forEach((cb) => cb({ matches: next, media: entry.query }));
    }
  }

  return {
    setWidth(width: number) {
      state.width = width;
      notify();
    },
    setReducedMotion(value: boolean) {
      state.reducedMotion = value;
      notify();
    },
    restore() {
      window.matchMedia = original;
    },
  };
}
