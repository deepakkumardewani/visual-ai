<script setup lang="ts">
import { computed } from 'vue';

import type { CutoutFraming, CutoutPair } from '@/utils/landing';

import {
  STAGE_ASPECT_RATIO,
  cutoutCards,
  type CutoutCard,
  type CutoutLayout,
} from '@/components/Home/toolsMedia';

const props = withDefaults(
  defineProps<{
    pairs: readonly CutoutPair[];
    /** Card placement; the pinned desktop stage passes 'stage'. */
    layout?: CutoutLayout;
  }>(),
  { layout: 'spread' },
);

/** Both the photo and its cutout are 4:5 portraits. */
const CARD_ASPECT_RATIO = '4 / 5';
const CENTER_PERCENT = 50;

const cards = computed(() => cutoutCards(props.pairs, props.layout));

/** Resting place only; the stage timeline adds its entrance as a transform on top. */
function cardStyle(card: CutoutCard) {
  return {
    left: `${card.left}%`,
    top: `${card.top}%`,
    width: `${card.width}%`,
    aspectRatio: CARD_ASPECT_RATIO,
  };
}

/** Recentres the subject, then zooms about the card centre so a small subject fills the card. */
function framingStyle({ zoom, focusX, focusY }: CutoutFraming) {
  const shiftX = CENTER_PERCENT - focusX;
  const shiftY = CENTER_PERCENT - focusY;
  return { transform: `scale(${zoom}) translate(${shiftX}%, ${shiftY}%)` };
}
</script>

<template>
  <div class="cutouts" :style="{ aspectRatio: STAGE_ASPECT_RATIO }" data-entrance="rise">
    <figure
      v-for="card in cards"
      :key="card.pair.cutout"
      class="cutouts__card"
      :style="cardStyle(card)"
      data-cluster-card
    >
      <img
        class="cutouts__subject"
        :src="card.pair.cutout"
        :alt="`${card.pair.alt}, background removed`"
        :style="framingStyle(card.pair.framing)"
        loading="lazy"
        decoding="async"
        data-stage-img
      />
      <img
        class="cutouts__original"
        :src="card.pair.original"
        :alt="`${card.pair.alt}, original photo`"
        loading="lazy"
        decoding="async"
        data-stage-img
      />
    </figure>
  </div>
</template>

<style scoped lang="scss">
$checker-size: 14px;
$checker-alpha: 0.05;
$inset-border-alpha: 0.3;
$inset-width: 24%;
$inset-offset: 8px;
$card-radius: 12px;
$inset-radius: 6px;
$checker-tone: rgb(var(--tw-ink) / #{$checker-alpha});

.cutouts {
  position: relative;
  width: 100%;
}

.cutouts__card {
  position: absolute;
  margin: 0;
  overflow: hidden;
  border-radius: $card-radius;
  /* Low-contrast squares: enough to prove transparency without competing with the subject. */
  background:
    conic-gradient($checker-tone 25%, transparent 0 50%, $checker-tone 0 75%, transparent 0) 0 0 /
      #{$checker-size * 2} #{$checker-size * 2},
    rgb(var(--tw-surface-2));
  box-shadow: 0 14px 36px rgb(0 0 0 / 0.45);
  will-change: transform;
}

.cutouts__subject {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cutouts__original {
  position: absolute;
  top: $inset-offset;
  left: $inset-offset;
  width: $inset-width;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  border: 1px solid rgb(var(--tw-ink) / #{$inset-border-alpha});
  border-radius: $inset-radius;
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.5);
}
</style>
