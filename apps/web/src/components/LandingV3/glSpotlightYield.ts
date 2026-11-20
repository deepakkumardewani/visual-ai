/**
 * While the pointer moves across the tiles, the cursor light wins over the
 * prompt's spotlight; once the pointer rests, the spotlight eases back. Only the
 * WebGL wall has a cursor light, so only it yields: the DOM wall keeps the
 * spotlight on, and moving over the copy never hides it.
 */
import type { WallProgress } from '@/components/LandingV2/heroWallLayout';

/** Per-frame share of the gap closed: quick to give way, slower to return. */
const YIELD_OUT_EASE = 0.15;
const YIELD_IN_EASE = 0.05;
const FULL_SHARE = 1;

export interface SpotlightYield {
  /** The progress with its spotlight scaled by how far it has given way. */
  apply: (progress: WallProgress, cursorInUse: boolean) => WallProgress;
}

export function createSpotlightYield(): SpotlightYield {
  let share = FULL_SHARE;
  return {
    apply: (progress, cursorInUse) => {
      const goal = cursorInUse ? 0 : FULL_SHARE;
      share += (goal - share) * (cursorInUse ? YIELD_OUT_EASE : YIELD_IN_EASE);
      return { ...progress, spotlightLevel: progress.spotlightLevel * share };
    },
  };
}
