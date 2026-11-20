import { describe, expect, it } from 'vitest';

import { APP_HEADER_HEIGHT_VAR, HEADER_BAR_PX, HEIGHT_BELOW_HEADER_CLASS } from '@/utils/layout';

describe('layout header height constants', () => {
  it('exposes the header bar height matching tw-h-16 (4rem at 16px)', () => {
    expect(HEADER_BAR_PX).toBe(64);
  });

  it('names the shared CSS custom property', () => {
    expect(APP_HEADER_HEIGHT_VAR).toBe('--app-header-h');
  });

  it('builds a dvh-based height class using the variable with the bar height fallback', () => {
    // Plain literals only: Tailwind scans test files too and would emit raw template text.
    expect(HEIGHT_BELOW_HEADER_CLASS).toBe('tw-h-[calc(100dvh-var(--app-header-h,64px))]');
    expect(HEIGHT_BELOW_HEADER_CLASS).toContain(APP_HEADER_HEIGHT_VAR);
    expect(HEIGHT_BELOW_HEADER_CLASS).toContain(',' + HEADER_BAR_PX + 'px)');
  });

  it('never uses the legacy vh or hardcoded 60px header offset', () => {
    expect(HEIGHT_BELOW_HEADER_CLASS).not.toContain('100vh');
    expect(HEIGHT_BELOW_HEADER_CLASS).not.toContain('60px');
  });
});
