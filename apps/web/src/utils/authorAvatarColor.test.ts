import { describe, expect, it } from 'vitest';

import { AUTHOR_AVATAR_PALETTE, getAuthorAvatarColor } from '@/utils/authorAvatarColor';

describe('getAuthorAvatarColor', () => {
  it('returns a palette swatch for a seed', () => {
    const color = getAuthorAvatarColor('user_abc');
    expect(AUTHOR_AVATAR_PALETTE).toContain(color);
  });

  it('is deterministic for the same seed', () => {
    expect(getAuthorAvatarColor('maya')).toBe(getAuthorAvatarColor('maya'));
  });

  it('trims whitespace before hashing', () => {
    expect(getAuthorAvatarColor('  maya  ')).toBe(getAuthorAvatarColor('maya'));
  });

  it('falls back to the creator seed when empty', () => {
    expect(getAuthorAvatarColor('')).toBe(getAuthorAvatarColor('creator'));
    expect(getAuthorAvatarColor('   ')).toBe(getAuthorAvatarColor('creator'));
  });

  it('can map different seeds to different swatches', () => {
    const colors = new Set(['alice', 'bob', 'carol', 'dave', 'erin'].map(getAuthorAvatarColor));
    expect(colors.size).toBeGreaterThan(1);
  });

  it('exports eight warm atelier colors', () => {
    expect(AUTHOR_AVATAR_PALETTE).toHaveLength(8);
    expect(AUTHOR_AVATAR_PALETTE[0]).toBe('#C98A5A');
    expect(AUTHOR_AVATAR_PALETTE[2]).toBe('#C9A84C');
  });
});
