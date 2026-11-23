<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { usePlayerStore } from '@/stores/player';

import PlayButton from '@/components/Audio/PlayButton.vue';
import TimeCode from '@/components/Audio/TimeCode.vue';

/** Published so sticky action bars can stack above the bar. */
const MINI_PLAYER_HEIGHT_VAR = '--mini-player-h';
const MINI_PLAYER_BAR_PX = 56;
const SEEK_STEP_SEC = 5;
const SEEK_FINE_STEP_SEC = 1;
const SPARKLINE_PLAYED_ALPHA = 1;
const SPARKLINE_UNPLAYED_ALPHA = 0.35;
const SPARKLINE_BAR_PX = 2;
const SPARKLINE_GAP_PX = 1;

const player = usePlayerStore();
const { track, status, currentTime, duration } = storeToRefs(player);

const isVisible = computed(() => track.value !== null);
const isPlaying = computed(() => status.value === 'playing');
const isBlocked = computed(() => status.value === 'blocked');
const playLabel = computed(() => (isBlocked.value ? 'Tap to play' : 'Play'));
const progress = computed(() => (duration.value > 0 ? currentTime.value / duration.value : 0));

watch(
  isVisible,
  (visible) => {
    const root = document.documentElement.style;
    if (visible) {
      root.setProperty(
        MINI_PLAYER_HEIGHT_VAR,
        `calc(${MINI_PLAYER_BAR_PX}px + env(safe-area-inset-bottom, 0px))`,
      );
    } else {
      root.removeProperty(MINI_PLAYER_HEIGHT_VAR);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => document.documentElement.style.removeProperty(MINI_PLAYER_HEIGHT_VAR));

function onScrub(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  player.seek(value);
}

/** Space, arrows and Escape act on the player while focus is anywhere inside the bar. */
function onKeydown(event: KeyboardEvent) {
  const step = event.shiftKey ? SEEK_FINE_STEP_SEC : SEEK_STEP_SEC;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    player.seek(currentTime.value + (event.key === 'ArrowRight' ? step : -step));
  } else if (event.key === 'Escape') {
    event.preventDefault();
    player.close();
  } else if (event.key === ' ' && !(event.target instanceof HTMLButtonElement)) {
    // Buttons already activate on Space; handling it again would toggle twice.
    event.preventDefault();
    player.toggle();
  }
}

const canvasEl = ref<HTMLCanvasElement | null>(null);

function drawSparkline() {
  const canvas = canvasEl.value;
  const peaks = track.value?.peaks;
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx || !peaks?.length) return;

  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = getComputedStyle(canvas).color;
  const slot = SPARKLINE_BAR_PX + SPARKLINE_GAP_PX;
  const bars = Math.floor(width / slot);
  for (let i = 0; i < bars; i++) {
    const peak = peaks[Math.floor((i / bars) * peaks.length)] ?? 0;
    const barHeight = Math.max(SPARKLINE_BAR_PX, peak * height);
    ctx.globalAlpha =
      i / bars <= progress.value ? SPARKLINE_PLAYED_ALPHA : SPARKLINE_UNPLAYED_ALPHA;
    ctx.fillRect(i * slot, (height - barHeight) / 2, SPARKLINE_BAR_PX, barHeight);
  }
  ctx.globalAlpha = 1;
}

onMounted(drawSparkline);
watch([track, progress], () => void Promise.resolve().then(drawSparkline));
</script>

<template>
  <Transition name="mini-player">
    <div
      v-if="track"
      role="region"
      aria-label="Audio player"
      data-testid="mini-player"
      class="mini-player tw-fixed tw-inset-x-0 tw-bottom-0 tw-z-40 tw-border-t tw-border-border tw-bg-surface-1 tw-text-ink-primary"
      @keydown="onKeydown"
    >
      <div class="tw-mx-auto tw-flex tw-h-14 tw-max-w-6xl tw-items-center tw-gap-3 tw-px-3">
        <PlayButton :playing="isPlaying" :label="playLabel" @toggle="player.toggle()" />
        <div class="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-justify-center">
          <p
            data-testid="mini-player-title"
            class="tw-m-0 tw-truncate tw-text-sm tw-font-medium"
            :title="track.title"
          >
            {{ track.title }}
          </p>
          <p
            v-if="isBlocked"
            role="status"
            data-testid="mini-player-blocked"
            class="tw-m-0 tw-text-xs tw-text-ink-muted"
          >
            Tap to play
          </p>
          <div v-else class="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-ink-muted">
            <TimeCode :seconds="currentTime" />
            <div class="tw-relative tw-h-4 tw-flex-1">
              <canvas
                v-if="track.peaks?.length"
                ref="canvasEl"
                width="320"
                height="16"
                aria-hidden="true"
                class="tw-pointer-events-none tw-absolute tw-inset-0 tw-h-full tw-w-full tw-text-accent"
              />
              <input
                type="range"
                min="0"
                :max="duration || 0"
                step="0.1"
                :value="currentTime"
                aria-label="Seek"
                data-testid="mini-player-scrubber"
                class="mini-player__scrubber tw-absolute tw-inset-0 tw-m-0 tw-h-full tw-w-full tw-cursor-pointer tw-bg-transparent focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent"
                @input="onScrub"
              />
            </div>
            <TimeCode :seconds="duration" />
          </div>
        </div>
        <button
          type="button"
          aria-label="Close player"
          data-testid="mini-player-close"
          class="tw-inline-flex tw-h-11 tw-w-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-ink-muted tw-transition-colors tw-duration-fast hover:tw-text-ink-primary focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent motion-reduce:tw-transition-none"
          @click="player.close()"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
/* Sits above the iOS home indicator; --mini-player-h already includes the same inset. */
.mini-player {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.mini-player-enter-active,
.mini-player-leave-active {
  transition: transform 200ms ease-out;
}

.mini-player-enter-from,
.mini-player-leave-to {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .mini-player-enter-active,
  .mini-player-leave-active {
    transition: none;
  }
}

/* The range sits over the peaks canvas, so only the thumb is drawn. */
.mini-player__scrubber {
  appearance: none;
  -webkit-appearance: none;
  &::-webkit-slider-runnable-track {
    background: rgb(var(--tw-border) / 0.6);
    height: 2px;
  }
  &::-moz-range-track {
    background: rgb(var(--tw-border) / 0.6);
    height: 2px;
  }
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    margin-top: -5px;
    border-radius: 9999px;
    background: rgb(var(--tw-accent));
  }
  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border: 0;
    border-radius: 9999px;
    background: rgb(var(--tw-accent));
  }
}
</style>
