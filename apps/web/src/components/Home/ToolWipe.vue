<script setup lang="ts">
import { STAGE_ASPECT_RATIO } from '@/components/LandingV2/toolsMedia';

defineProps<{
  before: string;
  after: string;
  /** The tool's name, used in the image descriptions. */
  label: string;
}>();
</script>

<!--
  Scroll-driven before/after. The mask slides in from the left while the after
  image inside it slides the opposite way by the same amount, so the image holds
  still and only the reveal edge moves. Transform only: no clip-path, no width.
  Without the stage timeline it rests fully revealed.
-->
<template>
  <figure class="wipe" :style="{ aspectRatio: STAGE_ASPECT_RATIO }">
    <img
      class="wipe__img"
      :src="before"
      :alt="`${label}: the original, before`"
      loading="lazy"
      decoding="async"
      data-stage-img
    />
    <span class="wipe__tag wipe__tag--before" aria-hidden="true">Before</span>

    <div class="wipe__mask" data-wipe-mask>
      <div class="wipe__inner" data-wipe-inner>
        <img
          class="wipe__img wipe__img--after"
          :src="after"
          :alt="`${label}: the result, after`"
          loading="lazy"
          decoding="async"
          data-stage-img
          data-wipe-after
        />
        <span class="wipe__tag wipe__tag--after" aria-hidden="true">After</span>
      </div>
      <span class="wipe__edge" aria-hidden="true"></span>
    </div>
  </figure>
</template>

<style scoped lang="scss">
.wipe {
  position: relative;
  width: 100%;
  margin: 0;
  overflow: hidden;
  border-radius: 14px;
  background-color: rgb(var(--tw-surface-2));
  box-shadow: 0 40px 100px rgb(0 0 0 / 0.6);
}

.wipe__img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.wipe__mask,
.wipe__inner {
  position: absolute;
  inset: 0;
  will-change: transform;
}

.wipe__mask {
  overflow: hidden;
}

/* Rides the mask's leading edge, so it needs no tween of its own. */
.wipe__edge {
  position: absolute;
  top: 0;
  right: 0;
  width: 2px;
  height: 100%;
  background-color: var(--lv2-copper);
  box-shadow: 0 0 24px rgb(201 138 90 / 0.55);
}

.wipe__tag {
  position: absolute;
  bottom: var(--lv2-space-md);
  padding: var(--lv2-space-2xs) var(--lv2-space-xs);
  border-radius: 4px;
  background-color: rgb(var(--tw-canvas) / 0.78);
  font-size: var(--lv2-text-label);
  font-weight: 600;
  letter-spacing: var(--lv2-tracking-label);
  text-transform: uppercase;
  color: rgb(var(--tw-ink-secondary));
}

.wipe__tag--before {
  right: var(--lv2-space-md);
}

.wipe__tag--after {
  left: var(--lv2-space-md);
  color: var(--lv2-copper-text);
}
</style>
