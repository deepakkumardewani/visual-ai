<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { SKETCH_CANVAS_SIZE, type useSketchCanvas } from '@/composables/useSketchCanvas';

const canvasEl = defineModel<HTMLCanvasElement | null>('canvas', {
  required: true,
});
const props = defineProps<{ sketch: ReturnType<typeof useSketchCanvas> }>();

const localRef = ref<HTMLCanvasElement | null>(null);

onMounted(() => {
  canvasEl.value = localRef.value;
  props.sketch.redraw();
});
</script>

<template>
  <!-- touch-action none keeps a finger or pen drawing instead of scrolling the page. -->
  <canvas
    ref="localRef"
    class="sketch-canvas"
    :width="SKETCH_CANVAS_SIZE"
    :height="SKETCH_CANVAS_SIZE"
    role="img"
    aria-label="Sketch canvas. Draw with a mouse, finger or pen; tools are in the toolbar."
    data-testid="sketch-canvas"
    @pointerdown.prevent="sketch.start"
    @pointermove="sketch.move"
    @pointerup="sketch.end"
    @pointercancel="sketch.end"
  />
</template>

<style scoped lang="scss">
.sketch-canvas {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 0.75rem;
  background: #fff;
  cursor: crosshair;
  touch-action: none;
}
</style>
