<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { usePlayerStore } from '@/stores/player';

import TimeCode from '@/components/Audio/TimeCode.vue';

/**
 * Inline seek row for the active track; play/pause stays on the TrackCard header button and the
 * audio element itself lives in the player store.
 */
defineProps<{ title: string }>();

const player = usePlayerStore();
const { status, currentTime, duration } = storeToRefs(player);

const isBlocked = computed(() => status.value === 'blocked');

function onScrub(event: Event) {
  player.seek(Number((event.target as HTMLInputElement).value));
}
</script>

<template>
  <div class="tw-flex tw-items-center tw-gap-3" data-testid="audio-player">
    <TimeCode class="tw-text-xs tw-text-ink-muted" :seconds="currentTime" />
    <input
      type="range"
      min="0"
      :max="duration || 0"
      step="0.1"
      :value="currentTime"
      :aria-label="`Seek ${title}`"
      class="audio-player__scrubber tw-h-11 tw-min-w-0 tw-flex-1 tw-cursor-pointer focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent"
      @input="onScrub"
    />
    <TimeCode class="tw-text-xs tw-text-ink-muted" :seconds="duration" />
    <span v-if="isBlocked" role="status" class="tw-text-xs tw-text-ink-muted">Tap to play</span>
  </div>
</template>

<style scoped lang="scss">
.audio-player__scrubber {
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
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
