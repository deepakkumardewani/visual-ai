<script setup lang="ts">
import { ref, watch } from 'vue';

import HeroWall from '@/components/LandingV2/HeroWall.vue';
import { useSceneMotion } from '@/components/LandingV2/composables/useSceneMotion';
import type { HeroWallProps } from '@/components/LandingV2/heroWallLayout';

import { startHeroSession } from '@/components/LandingV3/glHeroSession';
import { useWebglSupport } from '@/components/LandingV3/useWebglSupport';

/**
 * /v3 hero wall. The DOM HeroWall always renders first (it is the LCP and the
 * fallback); on desktop with motion allowed and WebGL available, a canvas inside
 * its clip box takes over once every texture is ready.
 */
const props = defineProps<HeroWallProps>();

const root = ref<HTMLElement | null>(null);
/** Set while the motion gate allows WebGL; the tiles watch only restarts inside it. */
let activeRoot: HTMLElement | null = null;
let stopSession: (() => void) | null = null;

// Mobile layouts use banded tiles; only the full-bleed desktop set has a GL layout.
const isDesktopSet = (tiles: HeroWallProps['tiles']): boolean =>
  tiles.every((tile) => tile.band === 'full');

function restart(): void {
  stopSession?.();
  stopSession = null;
  if (!activeRoot || !isDesktopSet(props.tiles)) return;
  stopSession = startHeroSession({
    root: activeRoot,
    getTiles: () => props.tiles,
    getProgress: () => props.getProgress(),
  });
}

useSceneMotion(root, ({ isDesktop, motionOk }, el) => {
  // Checked first so mobile and reduced-motion visitors never probe WebGL or fetch ogl.
  if (!isDesktop || !motionOk || !useWebglSupport()) return;
  activeRoot = el;
  restart();
  return () => {
    activeRoot = null;
    restart();
  };
});

// A new tile set needs new meshes and textures (the desktop set can land after the gate opens).
watch(() => props.tiles, restart, { flush: 'post' });
</script>

<template>
  <div ref="root" class="gl-wall">
    <HeroWall :tiles="tiles" :get-progress="getProgress" />
  </div>
</template>

<style scoped lang="scss">
/* Stands in for HeroWall's own box, so its absolute wall still fills the hero. */
.gl-wall {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>
