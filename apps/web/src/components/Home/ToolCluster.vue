<script setup lang="ts">
import { computed } from 'vue';

import type { ToolChapter } from '@/utils/landing';

import {
  STAGE_ASPECT_RATIO,
  clusterLayout,
  type ClusterCard,
} from '@/components/LandingV2/toolsMedia';

const props = defineProps<{
  tool: ToolChapter;
}>();

const layout = computed(() => clusterLayout(props.tool));

/** Resting place only; the stage timeline adds its entrance as a transform on top. */
function cardStyle(card: ClusterCard) {
  return {
    left: `${card.left}%`,
    top: `${card.top}%`,
    width: `${card.width}%`,
    aspectRatio: card.aspectRatio,
    rotate: `${card.rotation}deg`,
  };
}
</script>

<template>
  <div
    class="cluster"
    :class="`cluster--${layout.entrance}`"
    :style="{ aspectRatio: STAGE_ASPECT_RATIO }"
    :data-entrance="layout.entrance"
  >
    <div
      v-for="(card, index) in layout.cards"
      :key="card.item.url"
      class="cluster__card"
      :class="`cluster__card--${index}`"
      :style="cardStyle(card)"
      data-cluster-card
    >
      <img
        class="cluster__img"
        :src="card.item.url"
        :alt="card.item.prompt"
        loading="lazy"
        decoding="async"
        data-stage-img
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.cluster {
  position: relative;
  width: 100%;
}

.cluster__card {
  position: absolute;
  overflow: hidden;
  border-radius: 10px;
  background-color: rgb(var(--tw-surface-2));
  box-shadow: 0 24px 60px rgb(0 0 0 / 0.55);
  will-change: transform;
}

/* The dealt hand overlaps; the landscape print lands on top, nearest the viewer. */
.cluster--deal .cluster__card--2 {
  z-index: 1;
}

.cluster__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
