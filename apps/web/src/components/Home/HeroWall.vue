<script setup lang="ts">
import { gsap } from 'gsap';
import { computed, onBeforeUpdate, ref, watch, type ComponentPublicInstance } from 'vue';

import { useReducedMotion } from '@/composables/useReducedMotion';
import { useSceneMotion } from '@/components/Home/composables/useSceneMotion';

import {
  HIDDEN_INPUT,
  STILL_INPUT,
  frameToTransform,
  isRaised,
  tileFrame,
  toCssAspectRatio,
  type HeroWallProps,
  type TileFrame,
  type WallBand,
  type WallInput,
  type WallTile,
} from '@/components/Home/heroWallLayout';

const props = defineProps<HeroWallProps>();

const POINTER_FINE_QUERY = '(pointer: fine)';
/** Per-frame share of the gap closed toward the real pointer; lower is lazier. */
const POINTER_EASE = 0.06;
const BAND_ORDER: readonly WallBand[] = ['full', 'top', 'bottom'];
/** Custom property the tile's rim reads; see `.wall__tile::after`. */
const GLOW_VAR = '--tile-glow';
/** Above the near layer (z-index 2), so the lit tile's rim is never cut by a neighbour. */
const RAISED_Z_INDEX = '3';

const root = ref<HTMLElement | null>(null);
const reduced = useReducedMotion();
const tileEls: HTMLElement[] = [];
const pointerTarget = { x: 0, y: 0 };
const pointer = { x: 0, y: 0 };

const bands = computed(() =>
  BAND_ORDER.map((band) => ({
    band,
    tiles: props.tiles.map((tile, index) => ({ tile, index })).filter((t) => t.tile.band === band),
  })).filter((group) => group.tiles.length > 0),
);

/** Initial paint, before any loop runs: hidden if the bloom will play, composed if not. */
function initialStyle(tile: WallTile) {
  const frame = tileFrame(tile, reduced.value ? STILL_INPUT : HIDDEN_INPUT);
  return {
    left: `${tile.x * 100}%`,
    top: `${tile.y * 100}%`,
    width: `${tile.width * 100}%`,
    aspectRatio: toCssAspectRatio(tile.image.aspectRatio),
    transform: frameToTransform(frame),
    opacity: String(frame.opacity),
  };
}

function setTileEl(el: Element | ComponentPublicInstance | null, index: number): void {
  if (el instanceof HTMLElement) tileEls[index] = el;
}

/** The spotlight: a warm rim on the lit tile, raised above the rest, which are dimmed. */
function paintSpotlight(el: HTMLElement, frame: TileFrame): void {
  el.style.setProperty(GLOW_VAR, frame.glow.toFixed(3));
  // Cleared, not reset, so the layer class sets the order again.
  el.style.zIndex = isRaised(frame) ? RAISED_Z_INDEX : '';
  // Cleared at full brightness so an unlit wall carries no filter layer at all.
  el.style.filter = frame.brightness < 1 ? `brightness(${frame.brightness.toFixed(3)})` : '';
}

/** The single place tile DOM is written. */
function paint(input: WallInput): void {
  props.tiles.forEach((tile, index) => {
    const el = tileEls[index];
    if (!el) return;
    const frame = tileFrame(tile, input);
    el.style.transform = frameToTransform(frame);
    el.style.opacity = frame.opacity.toFixed(3);
    paintSpotlight(el, frame);
  });
}

function paintLive(): void {
  pointer.x += (pointerTarget.x - pointer.x) * POINTER_EASE;
  pointer.y += (pointerTarget.y - pointer.y) * POINTER_EASE;
  paint({ ...props.getProgress(), pointer, time: gsap.ticker.time });
}

function onPointerMove(event: PointerEvent): void {
  pointerTarget.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointerTarget.y = (event.clientY / window.innerHeight) * 2 - 1;
}

/** Runs the frame loop only while the wall is on screen. */
function observeVisibility(el: HTMLElement): () => void {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) gsap.ticker.add(paintLive);
    else gsap.ticker.remove(paintLive);
  });
  observer.observe(el);
  return () => {
    observer.disconnect();
    gsap.ticker.remove(paintLive);
  };
}

function listenToPointer(): () => void {
  if (!window.matchMedia(POINTER_FINE_QUERY).matches) return () => undefined;
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  return () => {
    window.removeEventListener('pointermove', onPointerMove);
    pointerTarget.x = 0;
    pointerTarget.y = 0;
  };
}

useSceneMotion(root, ({ isDesktop, motionOk }, el) => {
  if (!motionOk) {
    paint(STILL_INPUT);
    return;
  }
  const stopLoop = observeVisibility(el);
  const stopPointer = isDesktop ? listenToPointer() : () => undefined;
  return () => {
    stopLoop();
    stopPointer();
  };
});

onBeforeUpdate(() => {
  tileEls.length = 0;
});

// A new layout (desktop <-> mobile) mounts fresh tiles; give still walls their frame.
watch(
  () => props.tiles,
  () => {
    if (reduced.value) paint(STILL_INPUT);
  },
  { flush: 'post' },
);
</script>

<template>
  <div ref="root" class="wall" aria-hidden="true">
    <div class="wall__tiles">
      <div
        v-for="group in bands"
        :key="group.band"
        class="wall__band"
        :class="`wall__band--${group.band}`"
      >
        <div
          v-for="{ tile, index } in group.tiles"
          :key="tile.image.url"
          :ref="(el) => setTileEl(el, index)"
          class="wall__tile"
          :class="`wall__tile--layer-${tile.layer}`"
          :style="initialStyle(tile)"
        >
          <img
            class="wall__img"
            :src="tile.image.url"
            alt=""
            :loading="tile.order === 0 ? 'eager' : 'lazy'"
            :fetchpriority="tile.order === 0 ? 'high' : 'auto'"
            decoding="async"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.wall {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.wall__tiles {
  position: absolute;
  inset: 0;
}

@media (min-width: 900px) {
  /*
   * The hero clips its tiles so they never cover the next scene. A static
   * canvas-coloured feather over the bottom and sides turns that clip, and the
   * straight edges of grown tiles leaving sideways, into a fade instead of a
   * cut line.
   */
  .wall {
    --wall-feather-x: 6rem;
    --wall-feather-bottom: 9rem;
    /*
     * After the pin GSAP leaves the hero on a fractional translate, and the
     * composited tiles leak one row past whatever clip edge they get. Clipping
     * them a few px early and making the feather solid above that line hides it.
     */
    --wall-clip-guard: 3px;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(
          to right,
          rgb(var(--tw-canvas)),
          transparent var(--wall-feather-x),
          transparent calc(100% - var(--wall-feather-x)),
          rgb(var(--tw-canvas))
        ),
        linear-gradient(
          to bottom,
          transparent calc(100% - var(--wall-feather-bottom)),
          rgb(var(--tw-canvas)) calc(100% - 2 * var(--wall-clip-guard))
        );
    }
  }

  .wall__tiles {
    /* clip-path, not a shorter box, so the bottom band keeps its position. */
    clip-path: inset(0 0 var(--wall-clip-guard) 0);
  }
}

.wall__band {
  position: absolute;
  inset-inline: 0;
}

.wall__band--full {
  inset-block: 0;
}

.wall__band--top {
  top: 0;
  height: var(--hero-band-top);
}

.wall__band--bottom {
  bottom: 0;
  height: var(--hero-band-bottom);
}

.wall__tile {
  position: absolute;
  overflow: hidden;
  border-radius: 12px;
  background-color: rgb(var(--tw-surface-2));
  will-change: transform, opacity;
}

/* Depth reads through size, opacity and shadow weight, never blur. */
.wall__tile--layer-0 {
  z-index: 0;
  border-radius: 8px;
}

.wall__tile--layer-1 {
  z-index: 1;
  box-shadow: 0 12px 32px rgb(0 0 0 / 0.45);
}

.wall__tile--layer-2 {
  z-index: 2;
  border-radius: 16px;
  box-shadow: 0 30px 80px rgb(0 0 0 / 0.6);
}

/* The spotlight rim, drawn inside the tile so its rounded clip keeps it neat. */
.wall__tile::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow:
    inset 0 0 0 1.5px rgb(var(--tw-accent) / 0.85),
    inset 0 0 32px rgb(var(--tw-accent) / 0.3);
  opacity: var(--tile-glow, 0);
  pointer-events: none;
}

.wall__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
