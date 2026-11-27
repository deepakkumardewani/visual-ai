<script setup lang="ts">
import { computed } from 'vue';

import { toCssAspectRatio } from '@/components/Home/showcaseLayout';
import { useShowcaseCopy } from '@/components/Home/useShowcaseCopy';
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
    /**
     * Accessible name for the image button when its image is not described by
     * an alt (rail tiles), so each button in a list of them is distinct.
     */
    openLabel?: string;
  }>(),
  { active: false, openLabel: undefined },
);

const emit = defineEmits<{
  activate: [];
  /** Asks for the enlarged view; `trigger` gets focus back when it closes. */
  open: [trigger: HTMLElement];
}>();

/**
 * Only keyboard focus picks a tile. Chromium also focuses a button on
 * mousedown, and treating that as a choice would keep a clicked tile raised
 * while the pointer lifts another.
 */
function onFocus(event: FocusEvent): void {
  if (event.target instanceof HTMLElement && event.target.matches(':focus-visible')) {
    emit('activate');
  }
}

function requestOpen(event: MouseEvent): void {
  if (!(event.currentTarget instanceof HTMLElement)) return;
  emit('activate');
  emit('open', event.currentTarget);
}

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
    <!-- Row tiles name the image by its prompt; rail tiles print it below, so the button says what it does and which one it is. -->
    <button
      type="button"
      class="tile__media"
      aria-haspopup="dialog"
      :aria-label="openLabel"
      @pointerenter="emit('activate')"
      @focus="onFocus"
      @click="requestOpen"
    >
      <img
        class="tile__img"
        :src="item.url"
        :alt="variant === 'row' ? item.prompt : ''"
        loading="lazy"
        decoding="async"
        draggable="false"
      />
    </button>

    <figcaption v-if="variant === 'rail'" class="tile__caption">{{ item.prompt }}</figcaption>

    <button
      type="button"
      class="tile__copy"
      :class="`tile__copy--${copyState}`"
      @focus="onFocus"
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
  cursor: zoom-in;
}

.tile__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition:
    opacity 420ms var(--home-ease-out),
    transform 900ms var(--home-ease-out);
}

.tile__copy {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 var(--home-space-md);
  /* Solid surface, brighter hairline and a static drop so it reads on any image. */
  border: 1px solid rgb(var(--tw-ink-primary) / 0.28);
  border-radius: 9999px;
  background-color: rgb(var(--tw-canvas));
  box-shadow: 0 6px 20px rgb(0 0 0 / 0.5);
  color: rgb(var(--tw-ink-primary));
  font: 600 var(--home-text-small) / 1 var(--home-font-body);
  cursor: pointer;
  transition:
    opacity 260ms var(--home-ease-out),
    transform 260ms var(--home-ease-out);

  &:hover {
    border-color: var(--home-copper);
  }
}

/* The one gold moment in this scene: a prompt has just landed on the clipboard. */
.tile__copy--copied {
  color: var(--home-gold);
  border-color: var(--home-gold);
}

.tile__copy--failed {
  color: var(--home-copper-text);
}

/* Desktop row tile: fixed height from the row, width from the image's real ratio. */
.tile--row {
  height: 100%;
  aspect-ratio: var(--tile-ratio);
  transition: transform 520ms var(--home-ease-out);

  .tile__media {
    height: 100%;
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
    transition: opacity 520ms var(--home-ease-out);
    pointer-events: none;
  }

  .tile__copy {
    position: absolute;
    bottom: var(--home-space-sm);
    /* Centred and compact so it fits the narrowest portrait tile in the short row. */
    left: 50%;
    translate: -50% 0;
    padding-inline: var(--home-space-sm);
    white-space: nowrap;
    /* Hidden by opacity only, so keyboard users can still tab onto it. */
    opacity: 0;
    transform: translateY(6px);
  }

  /* Keyboard focus only: a mouse press also focuses, and must not hold the reveal. */
  &:hover,
  &:has(:focus-visible),
  &.is-active {
    .tile__copy {
      opacity: 1;
      transform: none;
    }
  }

  &:hover,
  &:has(:focus-visible) {
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
  gap: var(--home-space-sm);
  align-items: flex-start;
  width: min(80vw, 22rem);
  height: 100%;

  .tile__copy {
    margin-top: auto;
  }
}

.tile__caption {
  font-size: var(--home-text-small);
  line-height: var(--home-leading-body);
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
  .tile--row:has(:focus-visible) {
    transform: none;
  }

  .tile__img,
  .tile--row:hover .tile__img,
  .tile--row:has(:focus-visible) .tile__img {
    transform: none;
  }
}
</style>
