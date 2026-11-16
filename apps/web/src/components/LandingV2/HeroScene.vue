<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { computed, ref, type Component } from 'vue';

import { useReducedMotion } from '@/composables/useReducedMotion';
import { DESKTOP_QUERY, useSceneMotion } from '@/components/LandingV2/composables/useSceneMotion';

import HeroCopy from '@/components/LandingV2/HeroCopy.vue';
import HeroWall from '@/components/LandingV2/HeroWall.vue';

import {
  DESKTOP_WALL,
  HERO_PROMPT,
  MOBILE_WALL,
  type WallProgress,
} from '@/components/LandingV2/heroWallLayout';

const props = defineProps<{
  /** Replaces the DOM wall; receives `HeroWallProps`. */
  wall?: Component;
}>();

/** Seconds to type the whole prompt; prompts run ~180 characters, so this is brisk on purpose. */
const TYPE_DURATION = 1.7;
const BLOOM_DURATION = 2.4;
/** The prompt's image starts blooming just before the last characters land. */
const BLOOM_OVERLAP = 0.25;
/**
 * Desktop pin length, in viewport heights. Kept short so the Tools heading
 * (about 0.1 viewport below the hero) enters while the wall is still leaving.
 */
const PIN_VIEWPORTS = 0.55;
/**
 * Desktop wall exit length, in viewport heights. It outruns the pin, so the
 * last far tiles are still leaving as the unpinned hero scrolls up and the
 * Tools heading comes in below; the screen is never empty between the two.
 * The hero clips its tiles, so they can never cover that heading.
 */
const EXIT_VIEWPORTS = 1;
/** Share of the pin over which the copy fades out. */
const COPY_FADE_SHARE = 0.45;
const COPY_EXIT_LIFT = 48;

const PROMPT = HERO_PROMPT.prompt;

const root = ref<HTMLElement | null>(null);
const copy = ref<HTMLElement | null>(null);
const reduced = useReducedMotion();
const isDesktop = useMediaQuery(DESKTOP_QUERY);
const tiles = computed(() => (isDesktop.value ? DESKTOP_WALL : MOBILE_WALL));
const wallComponent = computed(() => props.wall ?? HeroWall);
const typed = ref(reduced.value ? PROMPT.length : 0);

// Plain object, not a ref: the wall reads it every frame through getProgress.
const progress: { bloom: number; scroll: number } = { bloom: reduced.value ? 1 : 0, scroll: 0 };
const getProgress = (): WallProgress => progress;
let introPlayed = false;

function settleIntro(): void {
  progress.bloom = 1;
  typed.value = PROMPT.length;
}

function playIntro(): void {
  introPlayed = true;
  const typing = { chars: 0 };
  gsap
    .timeline()
    .to(typing, {
      chars: PROMPT.length,
      duration: TYPE_DURATION,
      ease: 'none',
      onUpdate: () => {
        typed.value = Math.round(typing.chars);
      },
    })
    .to(progress, { bloom: 1, duration: BLOOM_DURATION, ease: 'none' }, `-=${BLOOM_OVERLAP}`);
}

function trackScroll(self: ScrollTrigger): void {
  progress.scroll = self.progress;
}

/** Desktop: hold the hero while the copy lifts away; the wall's exit runs a little past the pin. */
function pinExit(section: HTMLElement, copyEl: HTMLElement): void {
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => `+=${window.innerHeight * EXIT_VIEWPORTS}`,
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
      { autoAlpha: 0, y: -COPY_EXIT_LIFT, ease: 'power1.in', duration: COPY_FADE_SHARE },
      0,
    )
    // Stretch the timeline to exactly 1 so COPY_FADE_SHARE reads as a share of the pin.
    .set({}, {}, 1);
}

/** Mobile: no pin; the tiles spread as the hero scrolls out of view. */
function spreadExit(section: HTMLElement): void {
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom top',
    onUpdate: trackScroll,
  });
}

useSceneMotion(root, ({ isDesktop: desktop, motionOk }, section) => {
  if (!motionOk) {
    settleIntro();
    return;
  }
  if (introPlayed) settleIntro();
  else playIntro();

  const copyEl = copy.value;
  if (!copyEl) throw new Error('HeroScene: copy element is not mounted');
  if (desktop) pinExit(section, copyEl);
  else spreadExit(section);

  return () => {
    progress.scroll = 0;
  };
});
</script>

<template>
  <section ref="root" class="hero" aria-labelledby="hero-title">
    <component :is="wallComponent" :tiles="tiles" :get-progress="getProgress" />
    <div ref="copy" class="hero__copy">
      <HeroCopy :prompt="PROMPT" :typed="typed" />
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
  padding: var(--hero-band-top) var(--lv2-gutter) var(--hero-band-bottom);
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
    /* --lv2-edge, so the copy starts on the same left edge as every scene below. */
    padding: var(--lv2-nav-height) var(--lv2-edge) var(--lv2-space-2xl);
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
