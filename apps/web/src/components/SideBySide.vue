<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

import { ImgComparisonSlider } from '@img-comparison-slider/vue';

const props = withDefaults(
  defineProps<{
    originalImage: string;
    enhancedImage: string;
    /** Preserve transparency (checkerboard behind After). */
    transparent?: boolean;
    maxHeight?: string;
  }>(),
  {
    transparent: false,
    maxHeight: 'min(78vh, 42rem)',
  },
);

const originalImageLoaded = ref(false);
const enhancedImageLoaded = ref(false);
const ready = ref(false);
const naturalWidth = ref(1);
const naturalHeight = ref(1);
const hostRef = ref<HTMLElement | null>(null);
const hostWidth = ref(0);
const hostHeight = ref(0);

let resizeObserver: ResizeObserver | null = null;

const aspectRatio = computed(() => `${naturalWidth.value} / ${naturalHeight.value}`);

/**
 * Size the comparison to the artwork: height capped, width from aspect,
 * never wider than the host. Prefer measured host box (object-contain)
 * so portrait results don't overflow/clip when the parent has a fixed stage.
 */
const frameStyle = computed(() => {
  const ratio = naturalWidth.value / Math.max(naturalHeight.value, 1);
  const maxW = hostWidth.value;
  const maxH = hostHeight.value;

  if (maxW > 0 && maxH > 0) {
    const heightIfFullWidth = maxW / ratio;
    if (heightIfFullWidth <= maxH) {
      return {
        width: `${maxW}px`,
        height: `${heightIfFullWidth}px`,
        aspectRatio: aspectRatio.value,
      };
    }
    return {
      width: `${maxH * ratio}px`,
      height: `${maxH}px`,
      aspectRatio: aspectRatio.value,
    };
  }

  // Fallback before host is measured (Examples, etc.).
  return {
    maxHeight: props.maxHeight,
    aspectRatio: aspectRatio.value,
    width: maxW ? `min(100%, ${maxW}px, calc(${props.maxHeight} * ${ratio}))` : '100%',
    height: 'auto',
  };
});

function onOriginalLoad(event: Event) {
  const img = event.target as HTMLImageElement;
  naturalWidth.value = img.naturalWidth || 1;
  naturalHeight.value = img.naturalHeight || 1;
  originalImageLoaded.value = true;
  maybeReady();
}

function onEnhancedLoad() {
  enhancedImageLoaded.value = true;
  maybeReady();
}

function maybeReady() {
  if (originalImageLoaded.value && enhancedImageLoaded.value) {
    ready.value = true;
  }
}

function syncHostSize(el: HTMLElement) {
  hostWidth.value = el.clientWidth;
  hostHeight.value = el.clientHeight;
}

watch(
  () => [props.originalImage, props.enhancedImage] as const,
  () => {
    originalImageLoaded.value = false;
    enhancedImageLoaded.value = false;
    ready.value = false;
    naturalWidth.value = 1;
    naturalHeight.value = 1;
  },
);

watch(hostRef, async (el) => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  await nextTick();
  if (!el || typeof ResizeObserver === 'undefined') return;
  syncHostSize(el);
  resizeObserver = new ResizeObserver(() => {
    syncHostSize(el);
  });
  resizeObserver.observe(el);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});
</script>

<template>
  <div
    ref="hostRef"
    class="compare"
    :class="{ 'compare--ready': ready, 'compare--transparent': transparent }"
    data-testid="side-by-side-compare"
  >
    <div class="compare__frame" :style="frameStyle">
      <ImgComparisonSlider
        class="compare__slider"
        :class="{ 'tw-outline-none': ready }"
        hover="hover"
        value="50"
      >
        <figure slot="first" class="compare__pane">
          <img
            class="compare__img"
            :src="originalImage"
            alt="Before"
            draggable="false"
            @load="onOriginalLoad"
          />
          <figcaption class="compare__label compare__label--before">Before</figcaption>
        </figure>
        <figure slot="second" class="compare__pane">
          <img
            class="compare__img"
            :class="{ 'compare__img--transparent': transparent }"
            :src="enhancedImage"
            alt="After"
            draggable="false"
            @load="onEnhancedLoad"
          />
          <figcaption class="compare__label compare__label--after">After</figcaption>
        </figure>
      </ImgComparisonSlider>
    </div>
  </div>
</template>

<style scoped lang="scss">
.compare {
  display: flex;
  width: 100%;
  min-height: 0;
  justify-content: center;
  align-items: center;
}

.compare__frame {
  position: relative;
  max-width: 100%;
  margin-inline: auto;
  overflow: hidden;
  border-radius: 0.5rem;
}

.compare__slider {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.compare__pane {
  margin: 0;
  width: 100%;
  height: 100%;
}

.compare__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  user-select: none;
  pointer-events: none;
  background: rgb(var(--tw-surface-2));
}

.compare__img--transparent {
  background-color: #161411;
  background-image:
    linear-gradient(45deg, #2a2622 25%, transparent 25%),
    linear-gradient(-45deg, #2a2622 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #2a2622 75%),
    linear-gradient(-45deg, transparent 75%, #2a2622 75%);
  background-size: 16px 16px;
  background-position:
    0 0,
    0 8px,
    8px -8px,
    -8px 0;
}

.compare__label {
  position: absolute;
  top: 50%;
  z-index: 2;
  transform: translateY(-50%);
  border-radius: 999px;
  border: 1px solid rgb(var(--tw-hairline) / 0.7);
  background: rgb(var(--tw-surface-1) / 0.92);
  padding: 0.35rem 0.7rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgb(var(--tw-ink));
  line-height: 1;
  pointer-events: none;
  backdrop-filter: blur(6px);
}

.compare__label--before {
  left: 0.65rem;
}

.compare__label--after {
  right: 0.65rem;
}

:global(html:not(.tw-dark)) .compare__img--transparent {
  background-color: #ece7df;
  background-image:
    linear-gradient(45deg, #ddd6cb 25%, transparent 25%),
    linear-gradient(-45deg, #ddd6cb 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ddd6cb 75%),
    linear-gradient(-45deg, transparent 75%, #ddd6cb 75%);
}
</style>
