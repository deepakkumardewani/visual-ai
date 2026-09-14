import { describe, expect, it, vi } from 'vitest';

const preference = vi.hoisted(() => ({ value: 'no-preference' as 'no-preference' | 'reduce' }));

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>();
  return {
    ...actual,
    usePreferredReducedMotion: () => preference,
  };
});

import { useReducedMotion } from '@/composables/useReducedMotion';

describe('useReducedMotion', () => {
  it('is false when the user allows motion', () => {
    preference.value = 'no-preference';
    const reduced = useReducedMotion();
    expect(reduced.value).toBe(false);
  });

  it('is true when the user prefers reduced motion', () => {
    preference.value = 'reduce';
    const reduced = useReducedMotion();
    expect(reduced.value).toBe(true);
  });
});
