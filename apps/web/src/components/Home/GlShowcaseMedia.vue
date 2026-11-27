<script setup lang="ts">
import { ref } from 'vue';

import ShowcaseMedia from '@/components/Home/ShowcaseMedia.vue';
import { useSceneMotion } from '@/components/Home/composables/useSceneMotion';
import type { ShowcaseMediaProps } from '@/components/Home/showcaseLayout';

import { startShowcaseSession } from '@/components/Home/glShowcaseSession';
import { useWebglSupport } from '@/components/Home/useWebglSupport';

/**
 * Home showcase media. The DOM media always renders (drifting rows on desktop, the
 * swipe rail on mobile) and keeps layout, focus and labels; on desktop with motion
 * allowed and WebGL available, a canvas under the rows paints the prints instead.
 */
defineProps<ShowcaseMediaProps>();

const root = ref<HTMLElement | null>(null);
const host = ref<HTMLElement | null>(null);

useSceneMotion(root, ({ isDesktop, motionOk }, el) => {
  // Checked first so mobile and reduced-motion visitors never probe WebGL or fetch ogl.
  if (!isDesktop || !motionOk || !useWebglSupport()) return;
  if (!host.value) throw new Error('GlShowcaseMedia: stage host is not mounted');
  return startShowcaseSession({ root: el, host: host.value });
});
</script>

<template>
  <div ref="root" class="gl-showcase">
    <ShowcaseMedia :items="items" :get-progress="getProgress" />
    <div ref="host" class="gl-showcase__stage" aria-hidden="true"></div>
  </div>
</template>

<style scoped lang="scss">
/* Own stacking context, so the stage can sit under the rows without leaving the scene. */
.gl-showcase {
  position: relative;
  isolation: isolate;
}

/*
 * Under the tiles, so the copy pill, focus ring and lift shadow stay DOM on top.
 * Grown by the rows' lift room so a raised print is not cut at the top edge.
 */
.gl-showcase__stage {
  position: absolute;
  inset: calc(-1 * var(--home-space-lg)) 0;
  z-index: -1;
  pointer-events: none;
}
</style>
