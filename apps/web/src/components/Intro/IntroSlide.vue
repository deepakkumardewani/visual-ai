<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useReducedMotion } from '@/composables/useReducedMotion';

import type { IntroSlideData } from './slides';

const props = defineProps<{
  slide: IntroSlideData;
  /** Current or next slide: only these load media. */
  load: boolean;
  /** The visible slide: only this one plays. */
  playing: boolean;
}>();

const reducedMotion = useReducedMotion();
const videoRef = ref<HTMLVideoElement | null>(null);
const showVideo = computed(() => props.load && !reducedMotion.value);

watch(
  [() => props.playing, videoRef],
  ([isPlaying, video]) => {
    if (!video) return;
    if (!isPlaying) {
      video.pause();
      return;
    }
    // Autoplay can be refused by the browser; the poster stays as the fallback.
    video.play?.()?.catch(() => undefined);
  },
  { flush: 'post' },
);
</script>

<template>
  <div
    class="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-bg-surface-2"
    data-testid="intro-slide"
  >
    <video
      v-if="showVideo"
      ref="videoRef"
      muted
      loop
      playsinline
      preload="auto"
      :poster="slide.poster"
      :width="slide.width"
      :height="slide.height"
      :aria-label="slide.alt"
      class="tw-h-full tw-w-full tw-object-contain"
    >
      <source
        v-for="source in slide.sources"
        :key="source.type"
        :src="source.src"
        :type="source.type"
      />
    </video>
    <img
      v-else-if="load"
      :src="slide.poster"
      :alt="slide.alt"
      :width="slide.width"
      :height="slide.height"
      class="tw-h-full tw-w-full tw-object-contain"
    />
  </div>
</template>
