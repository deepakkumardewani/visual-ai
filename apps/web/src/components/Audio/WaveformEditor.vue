<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, { type Region } from 'wavesurfer.js/dist/plugins/regions.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';

import {
  MIN_REGION_SEC,
  outputDuration,
  type EditState,
  type TimeRange,
} from '@/utils/audioEditMath';

import TimeCode from '@/components/Audio/TimeCode.vue';

const WAVEFORM_HEIGHT_PX = 96;
const MIN_ZOOM = 1;
const MAX_ZOOM = 20;
const SELECTION_ID = 'selection';
const STATIC_PREFIX = 'static-';
const BAR_WIDTH_PX = 2;
const BAR_GAP_PX = 1;
const FALLBACK_WIDTH_PX = 320;

const props = defineProps<{
  media: HTMLAudioElement;
  peaks: number[];
  /** Duration of the original file; positions are always in original time. */
  sourceDuration: number;
  edit: EditState;
  region: TimeRange | null;
  title: string;
}>();

const emit = defineEmits<{ 'update:region': [region: TimeRange | null] }>();

const host = ref<HTMLElement | null>(null);
const zoom = ref(MIN_ZOOM);
const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

let surface: WaveSurfer | null = null;
let regions: ReturnType<typeof RegionsPlugin.create> | null = null;

/** Design tokens are `r g b` triplets, so the canvas gets the same colours as the page. */
function token(name: string, alpha = 1): string {
  const value = getComputedStyle(host.value ?? document.body)
    .getPropertyValue(name)
    .trim();
  return `rgb(${value} / ${alpha})`;
}

function selectionRegion(): Region | undefined {
  return regions?.getRegions().find((item) => item.id === SELECTION_ID);
}

function publishRegion(region: Region) {
  emit('update:region', { start: region.start, end: region.end });
}

function drawSelection() {
  if (!regions) return;
  const existing = selectionRegion();
  if (!props.region) {
    existing?.remove();
    return;
  }
  if (existing) {
    if (existing.start !== props.region.start || existing.end !== props.region.end) {
      existing.setOptions(props.region);
    }
    return;
  }
  regions.addRegion({ ...props.region, id: SELECTION_ID, color: token('--tw-accent', 0.25) });
}

/** Removed ranges and fades are drawn as passive overlays; the selection stays the only handle. */
function drawStaticRegions() {
  if (!regions) return;
  regions
    .getRegions()
    .filter((item) => item.id.startsWith(STATIC_PREFIX))
    .forEach((item) => item.remove());
  const removed = removedRanges(props.edit, props.sourceDuration);
  const overlays = [
    ...removed.map((range) => ({ ...range, color: token('--tw-canvas', 0.8) })),
    ...props.edit.fades.map((fade) => ({
      start: fade.start,
      end: fade.end,
      color: token('--tw-ink-muted', 0.18),
    })),
  ];
  overlays.forEach((overlay, index) => {
    const region = regions!.addRegion({
      ...overlay,
      id: `${STATIC_PREFIX}${index}`,
      drag: false,
      resize: false,
    });
    if (region.element) region.element.style.pointerEvents = 'none';
  });
}

function removedRanges(edit: EditState, duration: number): TimeRange[] {
  const gaps: TimeRange[] = [];
  let cursor = 0;
  for (const segment of edit.segments) {
    if (segment.start > cursor) gaps.push({ start: cursor, end: segment.start });
    cursor = segment.end;
  }
  if (cursor < duration) gaps.push({ start: cursor, end: duration });
  return gaps;
}

function applyZoom() {
  const width = host.value?.clientWidth || FALLBACK_WIDTH_PX;
  surface?.zoom((width / props.sourceDuration) * zoom.value);
}

function create() {
  if (!host.value) return;
  regions = RegionsPlugin.create();
  surface = WaveSurfer.create({
    container: host.value,
    media: props.media,
    peaks: [props.peaks],
    duration: props.sourceDuration,
    height: WAVEFORM_HEIGHT_PX,
    waveColor: token('--tw-ink-muted', 0.55),
    progressColor: token('--tw-accent'),
    cursorColor: token('--tw-ink-primary'),
    barWidth: BAR_WIDTH_PX,
    barGap: BAR_GAP_PX,
    autoplay: false,
    autoScroll: !reducedMotion.value,
    plugins: [regions, TimelinePlugin.create({ height: 20 })],
  });
  regions.enableDragSelection({
    id: SELECTION_ID,
    color: token('--tw-accent', 0.25),
    minLength: MIN_REGION_SEC,
  });
  regions.on('region-created', (region) => {
    if (region.id !== SELECTION_ID) return;
    regions
      ?.getRegions()
      .filter((item) => item.id === SELECTION_ID && item !== region)
      .forEach((item) => item.remove());
    publishRegion(region);
  });
  regions.on('region-updated', (region) => region.id === SELECTION_ID && publishRegion(region));
  surface.on('ready', () => {
    applyZoom();
    drawStaticRegions();
    drawSelection();
  });
}

onMounted(create);
onBeforeUnmount(() => {
  // destroy() leaves the shared media element alone: it belongs to the player store.
  surface?.destroy();
  surface = null;
  regions = null;
});

watch(() => props.region, drawSelection, { deep: true });
watch(() => [props.edit.segments, props.edit.fades], drawStaticRegions, { deep: true });
watch(zoom, applyZoom);
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-2" data-testid="waveform-editor">
    <div class="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-text-xs tw-text-ink-muted">
      <span>
        Length
        <TimeCode data-testid="editor-duration" :seconds="outputDuration(edit)" />
      </span>
      <label class="tw-flex tw-min-h-11 tw-items-center tw-gap-2">
        Zoom
        <input
          v-model.number="zoom"
          type="range"
          :min="MIN_ZOOM"
          :max="MAX_ZOOM"
          step="0.5"
          aria-label="Zoom waveform"
          class="waveform-editor__zoom tw-h-11 tw-w-28 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent"
        />
      </label>
    </div>
    <div
      ref="host"
      role="group"
      :aria-label="`Waveform of ${title}. Press [ and ] to set the selection start and end at the playhead.`"
      class="waveform-editor__host tw-w-full tw-overflow-hidden tw-rounded-card tw-bg-surface-2"
    />
  </div>
</template>

<style scoped lang="scss">
.waveform-editor__host {
  touch-action: pan-y;

  // Wavesurfer renders into a shadow root on a child div it creates, so ::part must target that
  // child (:deep) rather than the host. 44px keeps handles draggable by thumb, and !important
  // beats the inline 6px width the plugin sets.
  :deep(div)::part(region-handle) {
    width: 44px !important;
  }

  :deep(div)::part(region-handle):focus-visible {
    outline: 2px solid rgb(var(--tw-accent));
  }
}
</style>
