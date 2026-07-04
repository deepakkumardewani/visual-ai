<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

import { useReducedMotion } from "@/composables/useReducedMotion";

/**
 * Warm ambient mesh-gradient that drifts slowly behind the landing canvas.
 * Soft copper/ember light sources move on independent lissajous paths and are
 * additively blended over the near-black canvas. Under prefers-reduced-motion a
 * single static frame is drawn (no rAF loop).
 */
const canvasEl = ref<HTMLCanvasElement | null>(null);
const reduced = useReducedMotion();

interface Light {
  /** Center as a fraction of viewport (0..1). */
  cx: number;
  cy: number;
  /** Radius as a fraction of the larger viewport edge. */
  radius: number;
  color: string;
  /** Drift amplitude + speed per axis. */
  ax: number;
  ay: number;
  sx: number;
  sy: number;
  phase: number;
}

const LIGHTS: Light[] = [
  // Warm amber — ambient left-top, recedes
  {
    cx: 0.28,
    cy: 0.22,
    radius: 0.5,
    color: "201,138,90",
    ax: 0.05,
    ay: 0.04,
    sx: 0.06,
    sy: 0.045,
    phase: 0,
  },
  // Gold-tinted light — subtle precious highlight, right-mid (two-tier accent system)
  {
    cx: 0.78,
    cy: 0.35,
    radius: 0.42,
    color: "201,168,76",
    ax: 0.06,
    ay: 0.05,
    sx: 0.05,
    sy: 0.07,
    phase: 1.7,
  },
  // Deep warm ground — anchors the canvas in near-black warmth
  {
    cx: 0.5,
    cy: 0.82,
    radius: 0.55,
    color: "120,64,30",
    ax: 0.07,
    ay: 0.04,
    sx: 0.04,
    sy: 0.05,
    phase: 3.4,
  },
];

let ctx: CanvasRenderingContext2D | null = null;
let raf = 0;
let width = 0;
let height = 0;
let dpr = 1;

function resize() {
  const el = canvasEl.value;
  if (!el || !ctx) return;
  dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  width = el.clientWidth;
  height = el.clientHeight;
  el.width = Math.round(width * dpr);
  el.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function render(timeMs: number) {
  if (!ctx) return;
  const t = timeMs / 1000;
  const major = Math.max(width, height);

  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";

  for (const light of LIGHTS) {
    const x = (light.cx + Math.sin(t * light.sx + light.phase) * light.ax) * width;
    const y = (light.cy + Math.cos(t * light.sy + light.phase) * light.ay) * height;
    const r = light.radius * major;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    // Additive blend: three lights compound — keep each source very dim
    gradient.addColorStop(0, `rgba(${light.color},0.06)`);
    gradient.addColorStop(0.5, `rgba(${light.color},0.02)`);
    gradient.addColorStop(1, `rgba(${light.color},0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.globalCompositeOperation = "source-over";
}

function loop(time: number) {
  render(time);
  raf = requestAnimationFrame(loop);
}

onMounted(() => {
  const el = canvasEl.value;
  if (!el) return;
  ctx = el.getContext("2d");
  if (!ctx) return;

  resize();
  window.addEventListener("resize", resize, { passive: true });

  if (reduced.value) {
    render(0);
  } else {
    raf = requestAnimationFrame(loop);
  }
});

onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  window.removeEventListener("resize", resize);
});
</script>

<template>
  <div class="ambient" aria-hidden="true">
    <canvas ref="canvasEl" class="ambient__canvas"></canvas>
    <div class="ambient__grain"></div>
    <div class="ambient__vignette"></div>
  </div>
</template>

<style scoped lang="scss">
.ambient {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;

  &__canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  // Fine film grain keeps large dark fields from banding / looking flat.
  &__grain {
    position: absolute;
    inset: -50%;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
    opacity: 0.035;
    mix-blend-mode: overlay;
  }

  // Subtle darkening at the edges focuses attention toward the centre.
  &__vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(120% 90% at 50% 35%, transparent 55%, rgba(10, 7, 5, 0.55) 100%);
  }
}
</style>
