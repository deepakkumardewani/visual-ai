/**
 * Warm atelier avatar fills — copper / gold family from the design system.
 * Same seed always maps to the same swatch (stable, not Math.random).
 */
export const AUTHOR_AVATAR_PALETTE = [
  '#C98A5A', // accent copper
  '#D9996A', // accent hover
  '#C9A84C', // gold
  '#9E7D35', // gold muted
  '#D29467', // copper eyebrow
  '#B87A4A', // deeper copper
  '#A89040', // olive gold
  '#E0A878', // soft copper
] as const;

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Deterministic palette color for a user id / author name. */
export function getAuthorAvatarColor(seed: string): string {
  const key = seed.trim() || 'creator';
  const index = hashSeed(key) % AUTHOR_AVATAR_PALETTE.length;
  return AUTHOR_AVATAR_PALETTE[index];
}
