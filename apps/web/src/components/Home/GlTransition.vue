<script setup lang="ts">
import { ref } from 'vue';

import { useSceneMotion } from '@/components/Home/composables/useSceneMotion';

import { startTransitionSession } from '@/components/Home/glTransitionSession';
import { useWebglSupport } from '@/components/Home/useWebglSupport';

/**
 * Home scene-handover veil: a fixed film-grain layer that fades in while a scene
 * boundary crosses the middle of the screen. Purely decorative and never in the
 * way of input; mobile, reduced-motion and no-WebGL visitors get nothing here.
 */
const root = ref<HTMLElement | null>(null);

useSceneMotion(root, ({ isDesktop, motionOk }, el) => {
  // Checked first so mobile and reduced-motion visitors never probe WebGL or fetch ogl.
  if (!isDesktop || !motionOk || !useWebglSupport()) return;
  // Rendered as the page shell's child, next to the scenes' <main>.
  const main = el.parentElement?.querySelector<HTMLElement>(':scope > main');
  if (!main) throw new Error('GlTransition: the page has no <main> next to the veil');
  return startTransitionSession({ main, host: el });
});
</script>

<template>
  <div ref="root" class="gl-transition" aria-hidden="true"></div>
</template>

<style scoped lang="scss">
/* Over the scenes, under the nav (z-index 50) so its links read clean. */
.gl-transition {
  position: fixed;
  inset: 0;
  z-index: 45;
  pointer-events: none;
}

.gl-transition :deep(canvas) {
  position: absolute;
  inset: 0;
  display: block;
  pointer-events: none;
}
</style>
