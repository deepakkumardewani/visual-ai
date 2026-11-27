<script setup lang="ts">
// The "failed render": a gallery plate whose canvas never resolved out of noise.
// Purely decorative, so the whole figure is hidden from assistive tech; the page
// heading and copy carry the meaning.
const TOTAL_STEPS = 30;

defineProps<{
  /** The unmatched URL path, shown as the prompt that "returned nothing". */
  requestedPath: string;
}>();
</script>

<template>
  <figure class="frame" aria-hidden="true">
    <div class="frame__canvas">
      <div class="frame__grain" />
      <p class="frame__code">404</p>
    </div>
    <figcaption class="frame__plate">
      <p class="frame__prompt">
        <span class="frame__label">prompt</span>
        <span class="frame__path">{{ requestedPath }}</span>
      </p>
      <div class="frame__steps">
        <span class="frame__label">steps 0 / {{ TOTAL_STEPS }}</span>
        <span class="frame__track"><span class="frame__fill" /></span>
      </div>
    </figcaption>
  </figure>
</template>

<style scoped lang="scss">
$ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
// Fractal noise as a data URI: the "latent" a diffusion model starts from.
$noise: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.79  0 0 0 0 0.54  0 0 0 0 0.35  0 0 0 1.1 -0.18'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");

.frame {
  margin: 0;
  width: 100%;
  max-width: 28rem;
  padding: 0.75rem;
  border: 1px solid rgb(var(--tw-hairline));
  border-radius: 0.75rem;
  background: rgb(var(--tw-surface-1));
  animation: frame-settle 700ms $ease-out-expo both;

  &__canvas {
    position: relative;
    display: grid;
    place-items: center;
    // Shorter on phones so the heading stays above the fold.
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-radius: 0.375rem;
    background: rgb(var(--tw-surface-2));
  }

  &__grain {
    position: absolute;
    inset: 0;
    background-image: $noise;
    background-size: 220px 220px;
    opacity: 0.5;
    // Noise "denoises" once on arrival, then rests: it never loops.
    animation: grain-settle 1400ms $ease-out-expo both;
  }

  &__code {
    position: relative;
    margin: 0;
    font-family: 'Young Serif', Georgia, serif;
    font-size: clamp(5rem, 22vw, 8.5rem);
    line-height: 1;
    letter-spacing: -0.03em;
    color: rgb(var(--tw-ink));
    mix-blend-mode: normal;
  }

  &__plate {
    display: grid;
    gap: 0.75rem;
    padding: 0.875rem 0.25rem 0.25rem;
    font-size: 0.8125rem;
    color: rgb(var(--tw-ink-muted));
  }

  &__label {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgb(var(--tw-ink-faint));
  }

  &__prompt {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.25rem 0.75rem;
    margin: 0;
  }

  &__path {
    min-width: 0;
    overflow-wrap: anywhere;
    color: rgb(var(--tw-ink-secondary));
  }

  &__steps {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__track {
    flex: 1;
    height: 2px;
    border-radius: 1px;
    background: rgb(var(--tw-hairline));
  }

  // A sliver of fill: the render never really started.
  &__fill {
    display: block;
    width: 6%;
    height: 100%;
    border-radius: 1px;
    background: rgb(var(--tw-accent));
  }
}

@media (min-width: 768px) {
  .frame__canvas {
    aspect-ratio: 4 / 5;
  }
}

@keyframes frame-settle {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
}

@keyframes grain-settle {
  from {
    opacity: 1;
    transform: scale(1.08);
  }
}

@media (prefers-reduced-motion: reduce) {
  .frame,
  .frame__grain {
    animation: none;
  }
}
</style>
