<script setup lang="ts">
import { computed, onBeforeUpdate, ref, shallowRef, type ComponentPublicInstance } from 'vue';

import { useReducedMotion } from '@/composables/useReducedMotion';
import { useSceneMotion } from '@/components/LandingV2/composables/useSceneMotion';
import ShowcaseLabel from '@/components/LandingV2/ShowcaseLabel.vue';
import ShowcaseTile from '@/components/LandingV2/ShowcaseTile.vue';
import { startRowDrift, type DriftRowEls } from '@/components/LandingV2/showcaseDrift';
import { bindRowScrub } from '@/components/LandingV2/showcaseScrub';
import {
  aspectValue,
  rowAspectSum,
  splitRows,
  type ShowcaseEntry,
  type ShowcaseMediaProps,
} from '@/components/LandingV2/showcaseLayout';

const props = defineProps<ShowcaseMediaProps>();

const emit = defineEmits<{
  open: [index: number, trigger: HTMLElement];
}>();

const root = ref<HTMLElement | null>(null);
const reduced = useReducedMotion();
const active = shallowRef<ShowcaseEntry | null>(null);
const rows = computed(() => splitRows(props.items));
const idleEntry = computed(() => rows.value[0].entries[0] ?? null);

/**
 * Static layout gives every row one height, sized so the widest row (most
 * aspect, most gaps) fits the container exactly. Narrower rows then end short
 * instead of growing taller, so the rows read as a matched set.
 */
const staticFitStyle = computed(() => ({
  '--row-aspect': Math.max(...rows.value.map((row) => rowAspectSum(row.entries))),
  '--row-gap-count': Math.max(...rows.value.map((row) => Math.max(0, row.entries.length - 1))),
}));

const viewportEls: HTMLElement[] = [];
const focusEls: HTMLElement[] = [];
const trackEls: HTMLElement[] = [];

function collect(list: HTMLElement[], index: number) {
  return (el: Element | ComponentPublicInstance | null) => {
    if (el instanceof HTMLElement) list[index] = el;
  };
}

function driftRows(): DriftRowEls[] {
  return rows.value.flatMap((row, index) => {
    const viewport = viewportEls[index];
    const focus = focusEls[index];
    const track = trackEls[index];
    return viewport && focus && track ? [{ direction: row.direction, viewport, focus, track }] : [];
  });
}

/** Drift plus drag and sideways-wheel input; the static reduced-motion layout needs neither. */
useSceneMotion(root, ({ isDesktop, motionOk }, el) => {
  if (!isDesktop || !motionOk) return;
  const drift = driftRows();
  const control = startRowDrift({ rows: drift, root: el, getProgress: props.getProgress });
  const unbindScrub = bindRowScrub({ viewports: drift.map((row) => row.viewport), control });
  return () => {
    unbindScrub();
    control.stop();
  };
});

onBeforeUpdate(() => {
  viewportEls.length = 0;
  focusEls.length = 0;
  trackEls.length = 0;
});
</script>

<template>
  <div ref="root" class="rows" :class="{ 'is-static': reduced }" :style="staticFitStyle">
    <template v-for="(row, rowIndex) in rows" :key="row.direction">
      <ShowcaseLabel
        v-if="rowIndex === 1 && idleEntry"
        :entry="active"
        :idle-entry="idleEntry"
        :total="items.length"
      />
      <div
        :ref="collect(viewportEls, rowIndex)"
        class="rows__viewport"
        :class="`rows__viewport--${rowIndex === 0 ? 'tall' : 'short'}`"
      >
        <div :ref="collect(focusEls, rowIndex)" class="rows__focus">
          <ul :ref="collect(trackEls, rowIndex)" class="rows__track" role="list">
            <li
              v-for="entry in row.entries"
              :key="entry.item.url"
              class="rows__cell"
              :style="{ '--cell-aspect': aspectValue(entry.item.aspectRatio) }"
            >
              <ShowcaseTile
                :item="entry.item"
                variant="row"
                :active="active?.index === entry.index"
                @activate="active = entry"
                @open="(trigger) => emit('open', entry.index, trigger)"
              />
            </li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.rows {
  /*
   * Drift heights scale with the viewport width so six tiles always overfill
   * it (row width is about 4.7x the tall height). Keep the 0.75 ratio in step
   * with ROW_SCALES in showcaseLayout.ts.
   */
  --row-height-tall: clamp(14rem, 26vw, 44rem);
  --row-height-short: calc(var(--row-height-tall) * 0.75);
  --row-gap: var(--lv2-space-md);

  display: grid;
  /* minmax(0, ...) so the max-content tracks cannot widen the grid past the viewport. */
  grid-template-columns: minmax(0, 1fr);
  gap: var(--lv2-space-xl);
}

.rows__viewport {
  /* Room above each row so a lifted tile and its shadow are not clipped. */
  padding-block: var(--lv2-space-lg);
  margin-block: calc(-1 * var(--lv2-space-lg));
  overflow: clip;
  container-type: inline-size;
  /* Sideways touch moves the row (showcaseScrub.ts); vertical touch still scrolls the page. */
  touch-action: pan-y;
  cursor: grab;
}

/* Set by showcaseScrub.ts while a drag is in progress. */
.rows__viewport.is-dragging {
  cursor: grabbing;
  user-select: none;

  :deep(.tile__media) {
    cursor: grabbing;
  }
}

.rows.is-static .rows__viewport {
  touch-action: auto;
  cursor: auto;
}

.rows__viewport--tall {
  --row-height: var(--row-height-tall);
}

.rows__viewport--short {
  --row-height: var(--row-height-short);
}

.rows__focus {
  transition: transform 480ms var(--lv2-ease-out);
}

/* Full bleed with no inline padding: the drift keeps tiles past both edges. */
.rows__track {
  display: flex;
  gap: var(--row-gap);
  width: max-content;
  height: var(--row-height);
  margin: 0;
  padding: 0;
  list-style: none;
  will-change: transform;
}

.rows__cell {
  height: 100%;
}

/*
 * Spotlight: the looked-at tile leads while its neighbours stay recognisable.
 * The pointer wins over keyboard focus, so a row never shows two leads; the
 * focused tile keeps its copper ring either way.
 */
.rows:has(.tile--row:hover) :deep(.tile--row:not(:hover) .tile__img),
.rows:not(:has(.tile--row:hover)):has(.tile--row :focus-visible)
  :deep(.tile--row:not(:has(:focus-visible)) .tile__img) {
  opacity: 0.62;
}

@media (hover: hover) {
  .rows:has(.tile--row:hover) :deep(.tile--row:not(:hover)) {
    z-index: auto;
    transform: none;

    &::after {
      opacity: 0;
    }

    .tile__img {
      transform: none;
    }

    .tile__copy {
      opacity: 0;
      transform: translateY(6px);
    }
  }
}

/*
 * Reduced motion: no drift, so each row is laid out inside the page container
 * with nothing clipped. Wide screens fit every row on one line at one shared
 * height (free width / the widest row's sum of aspect ratios); below the
 * height floor rows wrap, and each line is justified by growing tiles in
 * proportion to their ratio.
 */
.rows.is-static .rows__track {
  --fit-width: min(100cqi - 2 * var(--lv2-gutter), var(--lv2-max-width));
  /* 1px of slack absorbs sub-pixel rounding so the last tile never wraps alone. */
  --fit-height: calc(
    (var(--fit-width) - var(--row-gap-count) * var(--row-gap) - 1px) / var(--row-aspect)
  );
  /* Floor: the narrowest 2:3 tile must still hold the centred "Copy prompt" pill. */
  --static-height: max(11rem, var(--fit-height));

  flex-wrap: wrap;
  width: var(--fit-width);
  height: auto;
  margin-inline: auto;
  will-change: auto;

  /* Soaks up the last line's slack so its tiles keep their ratio instead of stretching. */
  &::after {
    content: '';
    flex: 999 1 0;
    margin-left: calc(-1 * var(--row-gap));
  }
}

.rows.is-static .rows__cell {
  flex: var(--cell-aspect) 1 calc(var(--cell-aspect) * var(--static-height));
  height: var(--static-height);

  :deep(.tile--row) {
    width: 100%;
    aspect-ratio: auto;
  }
}

.rows.is-static .rows__focus {
  transition: none;
}
</style>
