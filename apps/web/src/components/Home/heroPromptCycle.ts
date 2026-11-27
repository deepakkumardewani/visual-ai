/**
 * The hero prompt's rotation: every ~8s the prompt erases, the next one types
 * in and its wall tile takes the spotlight. Plain functions, not a composable,
 * because they run inside `useSceneMotion`'s setup, whose gsap context reverts
 * the timeline; its document and IntersectionObserver listeners live outside
 * that context, so the returned stop removes them.
 */
import { gsap } from 'gsap';

import type { HeroPromptStop } from '@/components/LandingV2/heroWallLayout';

/** Seconds to type a whole prompt; prompts run ~180 characters, so this is brisk on purpose. */
export const TYPE_DURATION = 1.7;
/** Erasing is quicker than typing: the old text is already read. */
const ERASE_DURATION = 0.55;
/** The tile starts to light this long after the last character lands. */
const SPOTLIGHT_DELAY = 0.12;
const SPOTLIGHT_IN = 0.4;
const SPOTLIGHT_OUT = 0.3;
/**
 * Time a lit prompt holds. With the light-in and the dim, a prompt stays fully
 * shown for ~6s: about what 27-32 words take to read at a relaxed pace.
 */
const HOLD_DURATION = 5.2;
const SPOTLIGHT_EASE = 'power2.out';

/** Plain object the cycle tweens and the wall reads each frame. */
export interface SpotlightDial {
  /** 0-1, raised once the prompt is typed, lowered before it erases. */
  level: number;
}

export interface PromptCycleOptions {
  readonly section: HTMLElement;
  readonly stops: readonly HeroPromptStop[];
  /** Stop already typed and lit when the cycle starts. */
  readonly startIndex: number;
  readonly dial: SpotlightDial;
  /** A new stop becomes current (its text starts typing from zero). */
  readonly onStop: (index: number) => void;
  readonly onTyped: (chars: number) => void;
}

export interface PromptCycle {
  /** Holds the cycle until the intro has finished. */
  begin: () => void;
  setExitStarted: (started: boolean) => void;
  /** The visitor's pause control (WCAG 2.2.2). */
  setUserPaused: (paused: boolean) => void;
  /** Held while the visitor rests the pointer on, or selects, the prompt text. */
  setReading: (reading: boolean) => void;
  stop: () => void;
}

type PauseReason = 'intro' | 'hidden' | 'offscreen' | 'exit' | 'user' | 'reading';
/** Holds that must leave a whole prompt on screen, never a half-typed one. */
type RestingReason = Extract<PauseReason, 'exit' | 'user' | 'reading'>;

/** Tweens a character count and reports it rounded; the intro uses it too. */
export function typeTween(
  range: { readonly from: number; readonly to: number; readonly duration: number },
  onChars: (chars: number) => void,
): gsap.core.Tween {
  const typing = { chars: range.from };
  return gsap.fromTo(
    typing,
    { chars: range.from },
    {
      chars: range.to,
      duration: range.duration,
      ease: 'none',
      onUpdate: () => onChars(Math.round(typing.chars)),
    },
  );
}

/** One step: hold, dim, erase, switch, type the next, light its tile. */
function addStep(timeline: gsap.core.Timeline, options: PromptCycleOptions, from: number): void {
  const { stops, dial, onStop, onTyped } = options;
  const to = (from + 1) % stops.length;
  const fromLength = stops[from]?.prompt.length ?? 0;
  const toLength = stops[to]?.prompt.length ?? 0;
  timeline
    .to(dial, { level: 0, duration: SPOTLIGHT_OUT, ease: SPOTLIGHT_EASE }, `+=${HOLD_DURATION}`)
    .add(typeTween({ from: fromLength, to: 0, duration: ERASE_DURATION }, onTyped))
    .call(() => onStop(to))
    .add(typeTween({ from: 0, to: toLength, duration: TYPE_DURATION }, onTyped))
    .to(dial, { level: 1, duration: SPOTLIGHT_IN, ease: SPOTLIGHT_EASE }, `+=${SPOTLIGHT_DELAY}`);
}

interface CycleTimeline {
  readonly timeline: gsap.core.Timeline;
  /** Local times where a prompt sits typed and lit, including the loop's end. */
  readonly restTimes: readonly number[];
}

/** Every stop once, starting and ending on `startIndex`, repeating forever. */
function buildTimeline(options: PromptCycleOptions): CycleTimeline {
  const timeline = gsap.timeline({ paused: true, repeat: -1 });
  const { stops, startIndex } = options;
  const restTimes: number[] = [];
  stops.forEach((_, offset) => {
    restTimes.push(timeline.duration());
    addStep(timeline, options, (startIndex + offset) % stops.length);
  });
  restTimes.push(timeline.duration());
  return { timeline, restTimes };
}

/** Moves the timeline to a local time, keeping the iteration it is in. */
function seekLocal(timeline: gsap.core.Timeline, time: number): void {
  timeline.totalTime(timeline.totalTime() - timeline.time() + time, false);
}

/**
 * Puts the cycle on a prompt typed in full, so a pause never freezes a
 * half-erased prompt. During the dim before an erase the full prompt still
 * shows, so it rewinds to the dim's start and keeps that prompt fully lit; the
 * rewind crosses no stop switch. Past that, it runs forward with events on to
 * the next prompt, so the stop switch and the typed count land as if played.
 */
function settleAtRest({ timeline, restTimes }: CycleTimeline): void {
  const time = timeline.time();
  const rest = restTimes.findLast((start) => start <= time);
  if (rest !== undefined && time <= rest + HOLD_DURATION) return;
  if (rest !== undefined && time <= rest + HOLD_DURATION + SPOTLIGHT_OUT) {
    seekLocal(timeline, rest + HOLD_DURATION);
    return;
  }
  seekLocal(timeline, restTimes.find((start) => start > time) ?? timeline.duration());
}

/** Lights the current tile once its prompt has typed; the intro calls this. */
export function lightTween(dial: SpotlightDial): gsap.core.Tween {
  return gsap.to(dial, {
    level: 1,
    duration: SPOTLIGHT_IN,
    ease: SPOTLIGHT_EASE,
    delay: SPOTLIGHT_DELAY,
  });
}

/** Plays the timeline only while nothing holds it: intro, hidden tab, offscreen hero, exit, visitor. */
function createGate(timeline: gsap.core.Timeline) {
  const holds = new Set<PauseReason>(['intro']);
  return (reason: PauseReason, held: boolean): void => {
    if (held) holds.add(reason);
    else holds.delete(reason);
    if (holds.size === 0) timeline.play();
    else timeline.pause();
  };
}

function watchVisibility(
  section: HTMLElement,
  hold: (reason: PauseReason, held: boolean) => void,
): () => void {
  const onVisibility = (): void => hold('hidden', document.hidden);
  document.addEventListener('visibilitychange', onVisibility);
  const observer = new IntersectionObserver(([entry]) => {
    hold('offscreen', !entry?.isIntersecting);
  });
  observer.observe(section);
  onVisibility();
  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    observer.disconnect();
  };
}

/** Starts the rotation (held until `begin`); call inside the scene's motion setup. */
export function startPromptCycle(options: PromptCycleOptions): PromptCycle {
  if (options.stops.length < 2) throw new Error('startPromptCycle: needs at least two prompts');
  const cycle = buildTimeline(options);
  const { timeline } = cycle;
  const hold = createGate(timeline);
  const stopWatching = watchVisibility(options.section, hold);
  const holdAtRest = (reason: RestingReason, held: boolean): void => {
    if (held) settleAtRest(cycle);
    hold(reason, held);
  };
  return {
    begin: () => hold('intro', false),
    setExitStarted: (started) => holdAtRest('exit', started),
    setUserPaused: (paused) => holdAtRest('user', paused),
    setReading: (reading) => holdAtRest('reading', reading),
    stop: () => {
      stopWatching();
      timeline.kill();
    },
  };
}
