import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  VOICE_INPUT_DISCLOSURE_STORAGE_KEY,
  acceptVoiceInputDisclosure,
  hasAcceptedVoiceInputDisclosure,
} from '@/composables/voiceInputDisclosure';

describe('voiceInputDisclosure', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false before acceptance', () => {
    expect(hasAcceptedVoiceInputDisclosure()).toBe(false);
  });

  it('persists acceptance in localStorage', () => {
    acceptVoiceInputDisclosure();
    expect(localStorage.getItem(VOICE_INPUT_DISCLOSURE_STORAGE_KEY)).toBe('1');
    expect(hasAcceptedVoiceInputDisclosure()).toBe(true);
  });

  it('treats storage read failures as not accepted', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(hasAcceptedVoiceInputDisclosure()).toBe(false);
  });

  it('ignores persistence write failures', () => {
    localStorage.clear();
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => acceptVoiceInputDisclosure()).not.toThrow();
    expect(hasAcceptedVoiceInputDisclosure()).toBe(false);
  });
});
