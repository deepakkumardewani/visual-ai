<script setup lang="ts">
import { gsap } from 'gsap';
import { ref } from 'vue';

import { FREE_CREDITS_COPY } from '@/utils/landing';

import LandingButton from '@/components/Landing/LandingButton.vue';
import {
  CTA_COMPOSED,
  ctaFrameToTransform,
  ctaTileFrame,
  DESKTOP_CTA_TILES,
  MOBILE_CTA_TILES,
  toCssAspectRatio,
  type CtaTile,
} from '@/components/Home/finalCtaLayout';
import { usePrimaryCta } from '@/components/Home/composables/usePrimaryCta';
import { useSceneMotion } from '@/components/Home/composables/useSceneMotion';
import { bindCursorLight } from '@/components/Home/useCursorLight';

/** Scroll window (section top, in viewport terms) over which the frame converges. */
const SCRUB_START = 'top 85%';
const SCRUB_END = 'top 8%';
/** Seconds of catch-up lag: the frame trails the scroll, which is what makes it feel heavy. */
const SCRUB_LAG = 1.6;

const { label: ctaLabel, to: ctaTo } = usePrimaryCta();
const root = ref<HTMLElement | null>(null);
const stage = ref<HTMLElement | null>(null);
const wall = ref<HTMLElement | null>(null);
const light = ref<HTMLElement | null>(null);

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

  const unbindLight =
    light.value && stage.value ? bindCursorLight(stage.value, light.value) : undefined;

  // Matching media reverts tweens, not inline styles, so hand tiles back composed.
  return () => {
    unbindLight?.();
    applyProgress(tiles, CTA_COMPOSED);
  };
});
</script>

<template>
  <section id="final-cta" ref="root" class="home-section cta" aria-labelledby="final-cta-title">
    <div ref="stage" class="cta__stage">
      <div ref="wall" class="cta__wall cta__wall--desktop" aria-hidden="true">
        <div
          v-for="tile in DESKTOP_CTA_TILES"
          :key="tile.image.url"
          class="cta__tile"
          :style="tileStyle(tile, true)"
        >
          <img :src="tile.image.url" alt="" class="cta__img" loading="lazy" decoding="async" />
        </div>
        <div ref="light" class="cta__light" />
      </div>

      <div class="cta__wall cta__wall--mobile" aria-hidden="true">
        <div
          v-for="tile in MOBILE_CTA_TILES"
          :key="tile.image.url"
          class="cta__tile cta__tile--static"
          :style="tileStyle(tile, false)"
        >
          <img :src="tile.image.url" alt="" class="cta__img" loading="lazy" decoding="async" />
        </div>
      </div>

      <div class="cta__copy">
        <p class="home-eyebrow">Ready when you are</p>
        <h2 id="final-cta-title" class="home-display cta__title">
          Your next image is one prompt away.
        </h2>
        <p class="home-lede cta__sub">
          Generate, upscale, colorize and revive. {{ FREE_CREDITS_COPY }}
        </p>
        <div class="cta__actions">
          <LandingButton :to="ctaTo" size="lg">{{ ctaLabel }}</LandingButton>
          <LandingButton to="/pricing" variant="ghost" size="lg">See pricing</LandingButton>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.cta {
  /* Block padding comes from `.home-section`, the rhythm every scene shares. */
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
  margin-bottom: var(--home-space-xl);
}

.cta__wall--desktop {
  display: none;
}

.cta__tile {
  position: absolute;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgb(var(--tw-hairline));
  box-shadow: 0 18px 40px rgb(0 0 0 / 0.5);
  background-color: rgb(var(--tw-surface-2));
  will-change: transform, opacity;
}

.cta__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Sits above the tiles but below the copy (the copy has its own z-index), moved by transform only. */
.cta__light {
  position: absolute;
  top: 0;
  left: 0;
  width: 34rem;
  height: 34rem;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgb(var(--tw-accent) / 0.2),
    rgb(var(--tw-accent) / 0.08) 35%,
    transparent 68%
  );
  opacity: 0;
  pointer-events: none;
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
  margin-top: var(--home-space-md);
  max-width: 14ch;
  text-wrap: balance;
}

.cta__sub {
  margin-top: var(--home-space-lg);
  max-width: 34rem;
  text-wrap: balance;
}

.cta__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--home-space-md);
  margin-top: var(--home-space-xl);
}

/*
 * Desktop wall, fine pointer, motion allowed: tiles lift and gain a warm rim.
 * `translate` composes with the scrub's inline `transform`, and the rim is an
 * opacity fade, so nothing animates but transform and opacity. The wall sits
 * under the copy, so buttons keep every click.
 */
@media (min-width: 900px) and (hover: hover) and (pointer: fine) {
  .cta__wall--desktop {
    pointer-events: auto;
  }

  .cta__wall--desktop .cta__tile::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow:
      inset 0 0 0 1px rgb(var(--tw-accent) / 0.75),
      inset 0 0 24px rgb(var(--tw-accent) / 0.3);
    opacity: 0;
    pointer-events: none;
  }
}

@media (min-width: 900px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .cta__wall--desktop .cta__tile {
    --tile-lift: -10px;
    transition: translate 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .cta__wall--desktop .cta__tile::after {
    transition: opacity 0.35s ease-out;
  }

  .cta__wall--desktop .cta__tile:hover {
    translate: 0 var(--tile-lift);
  }

  .cta__wall--desktop .cta__tile:hover::after {
    opacity: 1;
  }
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
    font-size: calc(var(--home-text-hero) * 0.66);
    max-width: 16ch;
  }
}
</style>
