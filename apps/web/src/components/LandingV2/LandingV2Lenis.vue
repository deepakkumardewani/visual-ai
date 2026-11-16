<script setup lang="ts">
/*
 * Renderless. Lives after <main> in LandingV2Page because Vue fires a parent's
 * onBeforeUnmount before its children's: calling useLenis() in the page itself
 * would destroy Lenis before the scenes revert their pins. As the last child,
 * this unmounts after every scene.
 */
import { useLenis } from '@/composables/useLenis';

useLenis();
</script>

<template>
  <span hidden></span>
</template>
