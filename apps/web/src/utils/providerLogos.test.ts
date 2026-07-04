import { describe, expect, it } from 'vitest';

import {
  getProviderLettermark,
  getProviderLogo,
  isKnownProvider,
  KNOWN_PROVIDERS,
} from '@/utils/providerLogos';

describe('providerLogos', () => {
  it('identifies known providers', () => {
    for (const provider of KNOWN_PROVIDERS) {
      expect(isKnownProvider(provider)).toBe(true);
    }
  });

  it('resolves a brand logo for providers with a public mark', () => {
    for (const provider of ['openai', 'google', 'bfl', 'bytedance', 'xai'] as const) {
      expect(getProviderLogo(provider)).toBeTruthy();
    }
  });

  it('returns no logo for lettermark-only providers', () => {
    expect(getProviderLogo('pruna')).toBeUndefined();
    expect(getProviderLogo('zimage')).toBeUndefined();
  });

  it('treats unknown providers as not known', () => {
    expect(isKnownProvider('unknown-co')).toBe(false);
    expect(isKnownProvider('')).toBe(false);
  });

  it('returns lettermarks for known and unknown providers', () => {
    expect(getProviderLettermark('openai')).toBe('O');
    expect(getProviderLettermark('unknown-co')).toBe('U');
    expect(getProviderLettermark('')).toBe('?');
  });
});
