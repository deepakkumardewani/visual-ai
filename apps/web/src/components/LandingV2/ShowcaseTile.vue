<script setup lang="ts">
import { computed } from 'vue';

import { toCssAspectRatio } from '@/components/LandingV2/showcaseLayout';
import { useShowcaseCopy } from '@/components/LandingV2/useShowcaseCopy';
import type { GalleryItem } from '@/utils/landing';

const props = withDefaults(
  defineProps<{
    item: GalleryItem;
    /**
     * `row`: desktop tile; the image is a button and the prompt is read on the
     * shared gallery label. `rail`: mobile tile with its prompt printed below.
     */
    variant: 'row' | 'rail';
    /** Holds the reveal open after a tap, for touch screens with no hover. */
    active?: boolean;
  }>(),
  { active: false },
);

const emit = defineEmits<{
  activate: [];
}>();

const { state: copyState, label: copyLabel, copy } = useShowcaseCopy();

/** Every rail image is cropped to one ratio so prompts and buttons line up across cards. */
const RAIL_RATIO = '4 / 5';

const ratio = computed(() =>
  props.variant === 'rail' ? RAIL_RATIO : toCssAspectRatio(props.item.aspectRatio),
);
</script>

<template>
  <figure
    class="tile"
    :class="[`tile--${variant}`, { 'is-active': active }]"
    :style="{ '--tile-ratio': ratio }"
  >
    <button
      v-if="variant === 'row'"
      type="button"
      class="tile__media"
      :aria-pressed="active"
      @pointerenter="emit('activate')"
      @focus="emit('activate')"
      @click="emit('activate')"
    >
      <img class="tile__img" :src="item.url" :alt="item.prompt" loading="lazy" decoding="async" />
    </button>
    <div v-else class="tile__media">
      <img class="tile__img" :src="item.url" alt="" loading="lazy" decoding="async" />
    </div>

    <figcaption v-if="variant === 'rail'" class="tile__caption">{{ item.prompt }}</figcaption>

    <button
      type="button"
      class="tile__copy"
      :class="`tile__copy--${copyState}`"
      @focus="emit('activate')"
      @click="copy(item.prompt)"
    >
      {{ copyLabel }}
    </button>
  </figure>
</template>

<style scoped lang="scss">
.tile {
  position: relative;
  flex: none;
  margin: 0;
}

.tile__media {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  overflow: hidden;
  border-radius: 12px;
  background-color: rgb(var(--tw-surface-2));
  aspect-ratio: var(--tile-ratio);
}

.tile__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition:
    opacity 420ms var(--lv2-ease-out),
    transform 900ms var(--lv2-ease-out);
}

.tile__copy {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 var(--lv2-space-md);
  /* Solid surface, brighter hairline and a static drop so it reads on any image. */
  border: 1px solid rgb(var(--tw-ink-primary) / 0.28);
  border-radius: 9999px;
  background-color: rgb(var(--tw-canvas));
  box-shadow: 0 6px 20px rgb(0 0 0 / 0.5);
  color: rgb(var(--tw-ink-primary));
  font: 600 var(--lv2-text-small) / 1 var(--lv2-font-body);
  cursor: pointer;
  transition:
    opacity 260ms var(--lv2-ease-out),
    transform 260ms var(--lv2-ease-out);

  &:hover {
    border-color: var(--lv2-copper);
  }
}

/* The one gold moment in this scene: a prompt has just landed on the clipboard. */
.tile__copy--copied {
  color: var(--lv2-gold);
  border-color: var(--lv2-gold);
}

.tile__copy--failed {
  color: var(--lv2-copper-text);
}

/* Desktop row tile: fixed height from the row, width from the image's real ratio. */
.tile--row {
  height: 100%;
  aspect-ratio: var(--tile-ratio);
  transition: transform 520ms var(--lv2-ease-out);

  .tile__media {
    height: 100%;
    cursor: pointer;
  }

  /* Shadow on a pseudo element so the lift animates opacity, never box-shadow. */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: 12px;
    box-shadow: 0 30px 70px rgb(0 0 0 / 0.65);
    opacity: 0;
    transition: opacity 520ms var(--lv2-ease-out);
    pointer-events: none;
  }

  .tile__copy {
    position: absolute;
    bottom: var(--lv2-space-sm);
    /* Centred and compact so it fits the narrowest portrait tile in the short row. */
    left: 50%;
    translate: -50% 0;
    padding-inline: var(--lv2-space-sm);
    white-space: nowrap;
    /* Hidden by opacity only, so keyboard users can still tab onto it. */
    opacity: 0;
    transform: translateY(6px);
  }

  &:hover,
  &:focus-within,
  &.is-active {
    .tile__copy {
      opacity: 1;
      transform: none;
    }
  }

  &:hover,
  &:focus-within {
    z-index: 1;
    transform: translateY(-10px);

    &::after {
      opacity: 1;
    }

    .tile__img {
      transform: scale(1.04);
    }
  }
}

/* Mobile rail tile: full prompt under the image, copy pinned to the card's foot. */
.tile--rail {
  display: flex;
  flex-direction: column;
  gap: var(--lv2-space-sm);
  align-items: flex-start;
  width: min(80vw, 22rem);
  height: 100%;

  .tile__copy {
    margin-top: auto;
  }
}

.tile__caption {
  font-size: var(--lv2-text-small);
  line-height: var(--lv2-leading-body);
  color: rgb(var(--tw-ink-secondary));
  text-wrap: pretty;
}

@media (hover: none) {
  .tile--row .tile__copy {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tile--row,
  .tile--row:hover,
  .tile--row:focus-within {
    transform: none;
  }

  .tile__img,
  .tile--row:hover .tile__img,
  .tile--row:focus-within .tile__img {
    transform: none;
  }
}
</style>
