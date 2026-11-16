import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { clusterLayout, deckOffset } from '@/components/LandingV2/toolsMedia';
import type { ToolChapter } from '@/utils/landing';

/** Scroll length of one chapter, in viewport heights. */
const VIEWPORTS_PER_CHAPTER = 1;
/** Timeline time per chapter; 1 so a chapter's share reads directly as progress. */
const CHAPTER = 1;
/** Share of a chapter spent handing over from the previous one. */
const SWAP = 0.22;
/** The incoming chapter starts while the outgoing one is still leaving. */
const SWAP_OVERLAP = 0.08;
const COPY_SHIFT = 28;
const LAYER_EXIT_SCALE = 0.96;
const LAYER_ENTER_SCALE = 1.04;
/** Wipe is centred on the chapter midpoint: starts once the copy has landed, then the full after is held to the chapter end. */
const WIPE_START = 0.34;
const WIPE_DURATION = 0.32;
/** The after image settles from a slight push-in as it is revealed. */
const WIPE_SETTLE_SCALE = 1.06;
/**
 * Share of a chapter at which the incoming copy overtakes the outgoing one in
 * opacity; the rail's number changes here, not at the chapter boundary.
 */
const RAIL_SWITCH = 0.15;
const FAN_DURATION = 0.45;
const FAN_STAGGER = 0.06;
const RISE_SHIFT_PERCENT = 18;
const TAIL_PROPERTY = '--tools-tail';

/**
 * The pin is a full viewport tall with the stage centred in it, so once it
 * unpins the empty half below the stage is dead space before the next scene.
 * Publish that height so the section can pull the next scene up by it.
 */
function measureTail(pin: HTMLElement): number {
  const frame = pin.firstElementChild;
  if (!(frame instanceof HTMLElement)) return 0;
  const navInset = Number.parseFloat(getComputedStyle(pin).paddingTop) || 0;
  return Math.max(0, (pin.clientHeight - navInset - frame.offsetHeight) / 2);
}

export function clearTail(pin: HTMLElement): void {
  pin.closest<HTMLElement>('.tools')?.style.removeProperty(TAIL_PROPERTY);
}

function publishTail(pin: HTMLElement): void {
  pin.closest<HTMLElement>('.tools')?.style.setProperty(TAIL_PROPERTY, `${measureTail(pin)}px`);
}

/** Load stage images this far before the section reaches the viewport. */
const PRELOAD_MARGIN = '+=100%';

export interface ToolsStageElements {
  readonly pin: HTMLElement;
  readonly copies: readonly HTMLElement[];
  readonly layers: readonly HTMLElement[];
  readonly railFill: HTMLElement;
}

export interface ToolsTimelineOptions {
  readonly tools: readonly ToolChapter[];
  readonly elements: ToolsStageElements;
  /** Called when the chapter under the scroll position changes. */
  readonly onChapter: (index: number) => void;
}

function queryAll(scope: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(scope.querySelectorAll<HTMLElement>(selector));
}

/** Chapter whose copy is the visible one at `position` (in chapters from the start). */
function activeChapterAt(position: number, count: number): number {
  return Math.min(count - 1, Math.max(0, Math.floor(position - RAIL_SWITCH)));
}

function chapterStart(index: number): number {
  return index * CHAPTER;
}

/** Previous chapter's copy and image leave, the new ones arrive. */
function addSwap(tl: gsap.core.Timeline, elements: ToolsStageElements, index: number): void {
  const at = chapterStart(index);
  const enterAt = at + SWAP - SWAP_OVERLAP;
  const { copies, layers } = elements;
  tl.to(copies[index - 1] ?? [], { autoAlpha: 0, y: -COPY_SHIFT, duration: SWAP }, at)
    .to(layers[index - 1] ?? [], { autoAlpha: 0, scale: LAYER_EXIT_SCALE, duration: SWAP }, at)
    .fromTo(
      copies[index] ?? [],
      { autoAlpha: 0, y: COPY_SHIFT },
      { autoAlpha: 1, y: 0, duration: SWAP },
      enterAt,
    )
    .fromTo(
      layers[index] ?? [],
      { autoAlpha: 0, scale: LAYER_ENTER_SCALE },
      { autoAlpha: 1, scale: 1, duration: SWAP },
      enterAt,
    );
}

function addWipe(tl: gsap.core.Timeline, layer: HTMLElement, index: number): void {
  const mask = layer.querySelector<HTMLElement>('[data-wipe-mask]');
  const inner = layer.querySelector<HTMLElement>('[data-wipe-inner]');
  const after = layer.querySelector<HTMLElement>('[data-wipe-after]');
  if (!mask || !inner || !after) throw new Error('toolsTimeline: wipe layer is missing parts');
  const at = chapterStart(index) + WIPE_START;
  const vars = { duration: WIPE_DURATION, ease: 'power2.inOut' };
  tl.fromTo(mask, { xPercent: -100 }, { xPercent: 0, ...vars }, at)
    .fromTo(inner, { xPercent: 100 }, { xPercent: 0, ...vars }, at)
    .fromTo(after, { scale: WIPE_SETTLE_SCALE }, { scale: 1, ...vars }, at);
}

/** Where each card starts: squared up in one deck at the centre, or low and unseen. */
function fanFromVars(tool: ToolChapter): gsap.TweenVars {
  const { entrance, cards } = clusterLayout(tool);
  if (entrance === 'rise') return { yPercent: RISE_SHIFT_PERCENT, autoAlpha: 0 };
  const cardAt = (i: number) => {
    const card = cards[i];
    if (!card) throw new Error(`toolsTimeline: no cluster card ${i} for "${tool.id}"`);
    return card;
  };
  return {
    xPercent: (i: number) => deckOffset(cardAt(i)).xPercent,
    yPercent: (i: number) => deckOffset(cardAt(i)).yPercent,
    // Cancels the card's resting tilt (CSS `rotate`) while it sits in the deck.
    rotation: (i: number) => -cardAt(i).rotation,
  };
}

function addFan(
  tl: gsap.core.Timeline,
  layer: HTMLElement,
  tool: ToolChapter,
  index: number,
): void {
  // The first chapter is already on screen when the pin starts, so it deals right away.
  const at = index === 0 ? 0 : chapterStart(index) + SWAP;
  tl.fromTo(
    queryAll(layer, '[data-cluster-card]'),
    fanFromVars(tool),
    {
      xPercent: 0,
      yPercent: 0,
      rotation: 0,
      autoAlpha: 1,
      duration: FAN_DURATION,
      stagger: FAN_STAGGER,
      ease: 'power3.out',
    },
    at,
  );
}

/** Clipped and hidden images look offscreen to native lazy loading; fetch them early. */
function preloadImages(pin: HTMLElement): void {
  ScrollTrigger.create({
    trigger: pin,
    start: `top bottom${PRELOAD_MARGIN}`,
    once: true,
    onEnter: () => {
      queryAll(pin, '[data-stage-img]').forEach((img) => {
        if (img instanceof HTMLImageElement) img.loading = 'eager';
      });
    },
  });
}

function hideLaterChapters(elements: ToolsStageElements): void {
  gsap.set(elements.copies.slice(1), { autoAlpha: 0 });
  gsap.set(elements.layers.slice(1), { autoAlpha: 0 });
}

/**
 * Desktop only: pins the stage and scrubs through every chapter. Call inside a
 * `useSceneMotion` setup so the timeline and its pin revert with the scene.
 */
export function buildToolsTimeline({
  tools,
  elements,
  onChapter,
}: ToolsTimelineOptions): gsap.core.Timeline {
  const count = tools.length;
  preloadImages(elements.pin);
  hideLaterChapters(elements);

  const tl = gsap.timeline({
    defaults: { ease: 'power2.out' },
    scrollTrigger: {
      trigger: elements.pin,
      start: 'top top',
      end: () => `+=${window.innerHeight * VIEWPORTS_PER_CHAPTER * count}`,
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
      onRefresh: () => publishTail(elements.pin),
      onUpdate: (self) => onChapter(activeChapterAt(self.progress * count, count)),
    },
  });

  tl.fromTo(
    elements.railFill,
    { scaleX: 0 },
    { scaleX: 1, duration: count * CHAPTER, ease: 'none' },
    0,
  );
  tools.forEach((tool, index) => {
    const layer = elements.layers[index];
    if (!layer) throw new Error(`toolsTimeline: no stage layer for "${tool.id}"`);
    if (index > 0) addSwap(tl, elements, index);
    if (tool.media.kind === 'compare') addWipe(tl, layer, index);
    else addFan(tl, layer, tool, index);
  });
  return tl;
}

export function queryStage(pin: HTMLElement): ToolsStageElements {
  const railFill = pin.querySelector<HTMLElement>('[data-rail-fill]');
  if (!railFill) throw new Error('toolsTimeline: rail fill is not mounted');
  return {
    pin,
    copies: queryAll(pin, '[data-stage-copy]'),
    layers: queryAll(pin, '[data-stage-layer]'),
    railFill,
  };
}
