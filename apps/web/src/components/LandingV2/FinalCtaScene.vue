<script setup lang="ts">
import { gsap } from 'gsap';
import { DAILY_CREDITS, SIGNUP_CREDITS } from '@visual-ai/shared';
import { ref } from 'vue';

import { useMagnetic } from '@/composables/useMagnetic';

import LandingButton from '@/components/Landing/LandingButton.vue';
import {
  CTA_COMPOSED,
  ctaFrameToTransform,
  ctaTileFrame,
  DESKTOP_CTA_TILES,
  MOBILE_CTA_TILES,
  toCssAspectRatio,
  type CtaTile,
} from '@/components/LandingV2/finalCtaLayout';
import { usePrimaryCta } from '@/components/LandingV2/composables/usePrimaryCta';
import { useSceneMotion } from '@/components/LandingV2/composables/useSceneMotion';

const MAGNET_STRENGTH = 0.25;
const FINE_POINTER_QUERY = '(pointer: fine)';
/** Scroll window (section top, in viewport terms) over which the frame converges. */
const SCRUB_START = 'top 85%';
const SCRUB_END = 'top 8%';
/** Seconds of catch-up lag: the frame trails the scroll, which is what makes it feel heavy. */
const SCRUB_LAG = 1.6;

const { label: ctaLabel, to: ctaTo } = usePrimaryCta();
const root = ref<HTMLElement | null>(null);
const wall = ref<HTMLElement | null>(null);
// Magnetic needs a DOM node; the button is a component, so the wrapper span is what moves.
const magnet = ref<HTMLElement | null>(null);

useMagnetic(magnet, window.matchMedia(FINE_POINTER_QUERY).matches ? MAGNET_STRENGTH : 0);

const composedTransform = (tile: CtaTile): string =>
  ctaFrameToTransform(ctaTileFrame(tile, CTA_COMPOSED));

function tileStyle(tile: CtaTile, withTransform: boolean): Record<string, string> {
  return {
    left: `${tile.x * 100}%`,
    top: `${tile.y * 100}%`,
    width: `${tile.width * 100}%`,
    aspectRatio: toCssAspectRatio(tile.image.aspectRatio),
    ...(withTransform ? { transform: composedTransform(tile) } : {}),
  };
}

function applyProgress(tiles: HTMLElement[], progress: number): void {
  tiles.forEach((el, index) => {
    const tile = DESKTOP_CTA_TILES[index];
    if (!tile) return;
    const frame = ctaTileFrame(tile, progress);
    el.style.transform = ctaFrameToTransform(frame);
    el.style.opacity = frame.opacity.toFixed(3);
  });
}

useSceneMotion(root, ({ isDesktop, motionOk }) => {
  if (!isDesktop || !motionOk || !wall.value) return;
  const tiles = gsap.utils.toArray<HTMLElement>('.cta__tile', wall.value);
  const state = { progress: 0 };
  applyProgress(tiles, state.progress);

  gsap.to(state, {
    progress: 1,
    ease: 'none',
    onUpdate: () => applyProgress(tiles, state.progress),
    scrollTrigger: {
      trigger: root.value,
      start: SCRUB_START,
      end: SCRUB_END,
      scrub: SCRUB_LAG,
    },
  });

  // Matching media reverts tweens, not inline styles, so hand tiles back composed.
  return () => {
    applyProgress(tiles, CTA_COMPOSED);
  };
});
</script>

<template>
  <section id="final-cta" ref="root" class="lv2-section cta" aria-labelledby="final-cta-title">
    <div class="cta__stage">
      <div ref="wall" class="cta__wall cta__wall--desktop" aria-hidden="true">
        <img
          v-for="tile in DESKTOP_CTA_TILES"
          :key="tile.image.url"
          :src="tile.image.url"
          alt=""
          class="cta__tile"
          :style="tileStyle(tile, true)"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div class="cta__wall cta__wall--mobile" aria-hidden="true">
        <img
          v-for="tile in MOBILE_CTA_TILES"
          :key="tile.image.url"
          :src="tile.image.url"
          alt=""
          class="cta__tile cta__tile--static"
          :style="tileStyle(tile, false)"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div class="cta__copy">
        <p class="lv2-eyebrow">Ready when you are</p>
        <h2 id="final-cta-title" class="lv2-display cta__title">
          Your next image is one prompt away.
        </h2>
        <p class="lv2-lede cta__sub">
          Generate, upscale, colorize and revive. {{ SIGNUP_CREDITS }} persistent credits with a new
          account, plus {{ DAILY_CREDITS.free }} daily credits.
        </p>
        <div class="cta__actions">
          <span ref="magnet" class="cta__magnet">
            <LandingButton :to="ctaTo" size="lg">{{ ctaLabel }}</LandingButton>
          </span>
          <LandingButton to="/pricing" variant="ghost" size="lg">See pricing</LandingButton>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.cta {
  /* Block padding comes from `.lv2-section`, the rhythm every scene shares. */
  /* Converging tiles start outside the stage; clip them so they never cross into the FAQ or footer. */
  overflow: clip;
}

.cta__stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 100rem;
  margin-inline: auto;
}

.cta__wall {
  position: relative;
  width: 100%;
  pointer-events: none;
}

.cta__wall--mobile {
  aspect-ratio: 6 / 4.2;
  margin-bottom: var(--lv2-space-xl);
}

.cta__wall--desktop {
  display: none;
}

.cta__tile {
  position: absolute;
  display: block;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid rgb(var(--tw-hairline));
  box-shadow: 0 18px 40px rgb(0 0 0 / 0.5);
  background-color: rgb(var(--tw-surface-2));
  will-change: transform, opacity;
}

.cta__tile--static {
  /* Static cluster: the centre tile is last in the list, so it already sits on top. */
  transform: translate(-50%, -50%);
  will-change: auto;
}

.cta__copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.cta__title {
  margin-top: var(--lv2-space-md);
  max-width: 14ch;
  text-wrap: balance;
}

.cta__sub {
  margin-top: var(--lv2-space-lg);
  max-width: 34rem;
  text-wrap: balance;
}

.cta__magnet {
  display: inline-flex;
}

/*
 * Fine pointers: the moved element is a padded field around the button, so the
 * lean starts ~3rem out. Matching negative margin keeps layout still; the right
 * side stays inside the actions gap so the field never covers the ghost button.
 */
@media (hover: hover) and (pointer: fine) {
  .cta__magnet {
    --magnet-reach: 3rem;
    --magnet-reach-end: var(--lv2-space-sm);
    padding: var(--magnet-reach) var(--magnet-reach-end) var(--magnet-reach) var(--magnet-reach);
    margin: calc(var(--magnet-reach) * -1) calc(var(--magnet-reach-end) * -1)
      calc(var(--magnet-reach) * -1) calc(var(--magnet-reach) * -1);
  }
}

.cta__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--lv2-space-md);
  margin-top: var(--lv2-space-xl);
}

@media (min-width: 900px) {
  .cta__stage {
    justify-content: center;
    aspect-ratio: 8 / 5;
    min-height: 40rem;
  }

  .cta__wall--mobile {
    display: none;
  }

  .cta__wall--desktop {
    display: block;
    position: absolute;
    inset: 0;
  }

  .cta__copy {
    width: 46%;
  }

  .cta__title {
    font-size: calc(var(--lv2-text-hero) * 0.66);
    max-width: 16ch;
  }
}
</style>
