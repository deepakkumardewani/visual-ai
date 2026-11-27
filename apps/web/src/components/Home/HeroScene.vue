<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { computed, ref, type Component } from 'vue';

import { useReducedMotion } from '@/composables/useReducedMotion';
import { DESKTOP_QUERY, useSceneMotion } from '@/components/Home/composables/useSceneMotion';

import HeroCopy from '@/components/Home/HeroCopy.vue';
import HeroWall from '@/components/Home/HeroWall.vue';

import { useHeroPrompt } from '@/components/Home/composables/useHeroPrompt';
import type { PromptCycle } from '@/components/Home/heroPromptCycle';
import {
  DESKTOP_WALL,
  MOBILE_WALL,
  RADIAL_EXIT_SHARE,
  type WallProgress,
} from '@/components/Home/heroWallLayout';

const props = defineProps<{
  /** Replaces the DOM wall; receives `HeroWallProps`. */
  wall?: Component;
}>();

const BLOOM_DURATION = 2.4;
/** The prompt's image starts blooming just before the last characters land. */
const BLOOM_OVERLAP = 0.25;
/**
 * Desktop pin length, in viewport heights. Long enough that the copy holds
 * while the outer wall leaves and then hands its half to the crossing tiles.
 */
const PIN_VIEWPORTS = 0.9;
/**
 * The next scene's heading. The wall's exit runs until the hero's bottom edge
 * has risen to where this heading rests in its own pin, so tiles fill the
 * upper screen for as long as the unpinned hero box is still there.
 */
const NEXT_HEADING_SELECTOR = '#tools-title';
const NEXT_SCENE_SELECTOR = '#tools';
/**
 * Share of the pin the copy stays fully visible; it fades over the rest. With
 * a symmetric ease it is half faded at 0.8 of the pin (0.72 viewport), and
 * heroWallLayout's CROSSING_START sends tiles into its half just after that
 * (the pin is about half the wall's exit; see wallExitLength).
 */
const COPY_HOLD_SHARE = 0.6;
/** Symmetric, so the half-faded point sits mid-fade where the crossing timing expects it. */
const COPY_FADE_EASE = 'sine.inOut';
const COPY_EXIT_LIFT = 48;

/** Timeline label at the moment the first prompt's last character lands. */
const INTRO_TYPED = 'typed';

const root = ref<HTMLElement | null>(null);
const copy = ref<HTMLElement | null>(null);
const reduced = useReducedMotion();
const isDesktop = useMediaQuery(DESKTOP_QUERY);
const tiles = computed(() => (isDesktop.value ? DESKTOP_WALL : MOBILE_WALL));
const wallComponent = computed(() => props.wall ?? HeroWall);
const heroPrompt = useHeroPrompt({ startTyped: reduced.value });
const { prompt, typed, texts: promptTexts } = heroPrompt;

// Plain object, not a ref: the wall reads it every frame through getProgress.
const progress: { bloom: number; scroll: number } = { bloom: reduced.value ? 1 : 0, scroll: 0 };
const getProgress = (): WallProgress => ({ ...progress, ...heroPrompt.spotlight() });
let introPlayed = false;
let cycle: PromptCycle | null = null;
/** Only the desktop, full-motion hero rotates its prompt (and so offers a pause). */
const rotating = ref(false);
/** Outlives the cycle, which is rebuilt whenever the scene's setup re-runs. */
const userPaused = ref(false);
let reading = false;

function togglePromptPause(): void {
  userPaused.value = !userPaused.value;
  cycle?.setUserPaused(userPaused.value);
}

function setPromptReading(value: boolean): void {
  reading = value;
  cycle?.setReading(value);
}

/** Composed wall and the current prompt in full; `lit` puts its tile in the spotlight. */
function settleIntro(lit: boolean): void {
  progress.bloom = 1;
  heroPrompt.settle(lit);
}

/** Types the first prompt and blooms the wall; callers hang more on `INTRO_TYPED`. */
function playIntro(): gsap.core.Timeline {
  introPlayed = true;
  return gsap
    .timeline()
    .add(heroPrompt.typeIn())
    .addLabel(INTRO_TYPED)
    .to(progress, { bloom: 1, duration: BLOOM_DURATION, ease: 'none' }, `-=${BLOOM_OVERLAP}`);
}

function trackScroll(self: ScrollTrigger): void {
  progress.scroll = self.progress;
  cycle?.setExitStarted(self.progress > 0);
}

/** Distance from the next scene's top to its heading; constant while that scene is pinned. */
function nextHeadingOffset(): number {
  const scene = document.querySelector<HTMLElement>(NEXT_SCENE_SELECTOR);
  const heading = document.querySelector<HTMLElement>(NEXT_HEADING_SELECTOR);
  if (!scene || !heading) {
    throw new Error(`HeroScene: ${NEXT_SCENE_SELECTOR} or ${NEXT_HEADING_SELECTOR} is not mounted`);
  }
  return heading.getBoundingClientRect().top - scene.getBoundingClientRect().top;
}

/**
 * Scroll distance of the wall's exit. With pin spacing, the hero box stays on
 * screen for the pin plus its own height (and its height can exceed the
 * viewport through `min-height`). The exit ends once its bottom edge has risen
 * to the heading's resting offset: the heading is then in the upper half, so
 * from there on the heading fills the screen instead of the tiles.
 */
function wallExitLength(section: HTMLElement): number {
  return window.innerHeight * PIN_VIEWPORTS + section.offsetHeight - nextHeadingOffset();
}

/** Desktop: hold the hero while the copy lifts away; the wall keeps leaving while the hero rises. */
function pinExit(section: HTMLElement, copyEl: HTMLElement): void {
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => `+=${wallExitLength(section)}`,
    invalidateOnRefresh: true,
    onUpdate: trackScroll,
  });
  gsap
    .timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${window.innerHeight * PIN_VIEWPORTS}`,
        pin: true,
        // Spacing on: the next scene waits below the hero instead of scrolling
        // up under the wall.
        pinSpacing: true,
        scrub: true,
        invalidateOnRefresh: true,
      },
    })
    .to(
      copyEl,
      {
        autoAlpha: 0,
        y: -COPY_EXIT_LIFT,
        ease: COPY_FADE_EASE,
        duration: 1 - COPY_HOLD_SHARE,
      },
      COPY_HOLD_SHARE,
    )
    // Stretch the timeline to exactly 1 so COPY_HOLD_SHARE reads as a share of the pin.
    .set({}, {}, 1);
}

/**
 * Mobile: no pin; the tiles spread as the hero scrolls out of view. The mobile
 * wall has no crossing tiles, so its whole scroll-out maps onto the radial
 * share of the exit and the tiles keep spreading until the hero is gone.
 */
function spreadExit(section: HTMLElement): void {
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom top',
    onUpdate: (self) => {
      progress.scroll = self.progress * RADIAL_EXIT_SHARE;
    },
  });
}

/**
 * Desktop: intro, then the rotation once the first prompt's tile has lit. The
 * mobile wall lacks most of the rotation's tiles, so its prompt stays still.
 */
function runDesktopPrompt(section: HTMLElement): PromptCycle {
  const running = heroPrompt.startCycle(section);
  running.setUserPaused(userPaused.value);
  running.setReading(reading);
  if (introPlayed) {
    settleIntro(true);
    running.begin();
    return running;
  }
  // Inside the intro timeline, so the scene's gsap context reverts the light with it.
  const light = heroPrompt.lightIn().eventCallback('onComplete', running.begin);
  playIntro().add(light, INTRO_TYPED);
  return running;
}

useSceneMotion(root, ({ isDesktop: desktop, motionOk }, section) => {
  // Reduced motion and mobile: no rotation, the first prompt in full, no spotlight.
  rotating.value = motionOk && desktop;
  heroPrompt.resetFor(rotating.value);
  if (!motionOk) {
    settleIntro(false);
    return;
  }

  const copyEl = copy.value;
  if (!copyEl) throw new Error('HeroScene: copy element is not mounted');
  if (desktop) {
    cycle = runDesktopPrompt(section);
    pinExit(section, copyEl);
  } else {
    if (introPlayed) settleIntro(false);
    else playIntro();
    spreadExit(section);
  }

  return () => {
    cycle?.stop();
    cycle = null;
    progress.scroll = 0;
  };
});
</script>

<template>
  <section ref="root" class="hero" aria-labelledby="hero-title">
    <component :is="wallComponent" :tiles="tiles" :get-progress="getProgress" />
    <div ref="copy" class="hero__copy">
      <HeroCopy
        :prompt="prompt"
        :typed="typed"
        :prompt-sizes="promptTexts"
        :prompt-rotating="rotating"
        :prompt-paused="userPaused"
        @toggle-prompt-pause="togglePromptPause"
        @prompt-reading="setPromptReading"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
.hero {
  --hero-band-top: clamp(17rem, 74vw, 24rem);
  --hero-band-bottom: clamp(11rem, 48vw, 16rem);

  position: relative;
  /* Above the next scene, so tiles flying past its top edge stay on top. */
  z-index: 2;
  overflow: clip;
  padding: var(--hero-band-top) var(--home-gutter) var(--hero-band-bottom);
  /* Only the copy is interactive; the transparent rest must not block the scene below. */
  pointer-events: none;
}

.hero__copy {
  position: relative;
  z-index: 3;
  pointer-events: auto;
}

@media (min-width: 900px) {
  .hero {
    display: flex;
    align-items: center;
    height: 100svh;
    min-height: 40rem;
    /* --home-edge, so the copy starts on the same left edge as every scene below. */
    padding: var(--home-nav-height) var(--home-edge) var(--home-space-2xl);
  }

  .hero__copy {
    width: min(48%, 42rem);

    /* A soft pool of canvas behind the copy so it stays legible over any tile that drifts close. */
    &::before {
      content: '';
      position: absolute;
      inset: -30% -25% -30% -40%;
      z-index: -1;
      background: radial-gradient(
        closest-side,
        rgb(var(--tw-canvas) / 0.88),
        rgb(var(--tw-canvas) / 0.6) 55%,
        transparent
      );
      pointer-events: none;
    }
  }
}
</style>
