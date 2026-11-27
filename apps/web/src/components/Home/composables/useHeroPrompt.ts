import { computed, ref } from 'vue';

import {
  TYPE_DURATION,
  lightTween,
  startPromptCycle,
  typeTween,
  type PromptCycle,
  type SpotlightDial,
} from '@/components/Home/heroPromptCycle';
import {
  HERO_PROMPT_CYCLE,
  NO_SPOTLIGHT,
  type HeroPromptStop,
  type WallProgress,
} from '@/components/Home/heroWallLayout';

const FIRST_STOP = 0;
const PROMPT_TEXTS: readonly string[] = HERO_PROMPT_CYCLE.map((stop) => stop.prompt);

type Spotlight = Pick<WallProgress, 'spotlight' | 'spotlightLevel'>;

/**
 * The hero prompt's state: which stop of the rotation shows, how much of it is
 * typed, and the spotlight it puts on its wall tile. The stop survives the
 * scene's setup re-runs (a resize across the breakpoint), so the rotation
 * resumes where it was instead of jumping back to the first prompt.
 */
export function useHeroPrompt(options: { readonly startTyped: boolean }) {
  const stopIndex = ref(FIRST_STOP);
  const current = (): HeroPromptStop => {
    const stop = HERO_PROMPT_CYCLE[stopIndex.value];
    if (!stop) throw new Error(`useHeroPrompt: prompt stop ${stopIndex.value} is out of range`);
    return stop;
  };
  const prompt = computed(() => current().prompt);
  const typed = ref(options.startTyped ? prompt.value.length : 0);
  // Plain, not reactive: the wall reads it every frame.
  const dial: SpotlightDial = { level: 0 };
  let spotlightItem = NO_SPOTLIGHT;

  function showStop(index: number): void {
    stopIndex.value = index;
    spotlightItem = current().item;
  }

  /** The current prompt in full; `lit` puts its tile in the spotlight at once. */
  function settle(lit: boolean): void {
    typed.value = prompt.value.length;
    dial.level = lit ? 1 : 0;
  }

  const setTyped = (chars: number): void => {
    typed.value = chars;
  };

  return {
    prompt,
    typed,
    /** Every prompt of the rotation, so the prompt box can size itself to the tallest. */
    texts: PROMPT_TEXTS,
    showStop,
    /** Keeps the current stop on desktop; anywhere else the first prompt stays put. */
    resetFor: (rotating: boolean): void => showStop(rotating ? stopIndex.value : FIRST_STOP),
    settle,
    typeIn: (): gsap.core.Tween =>
      typeTween({ from: 0, to: prompt.value.length, duration: TYPE_DURATION }, setTyped),
    lightIn: (): gsap.core.Tween => lightTween(dial),
    spotlight: (): Spotlight => ({
      spotlight: spotlightItem,
      spotlightLevel: dial.level,
    }),
    startCycle: (section: HTMLElement): PromptCycle =>
      startPromptCycle({
        section,
        stops: HERO_PROMPT_CYCLE,
        startIndex: stopIndex.value,
        dial,
        onStop: showStop,
        onTyped: setTyped,
      }),
  };
}
