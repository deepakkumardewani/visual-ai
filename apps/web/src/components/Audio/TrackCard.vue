<script setup lang="ts">
import { computed } from 'vue';

import { usePlayerStore, type PlayerTrack } from '@/stores/player';

import AudioPlayer from '@/components/Audio/AudioPlayer.vue';
import PlayButton from '@/components/Audio/PlayButton.vue';

const props = defineProps<{ track: PlayerTrack }>();

const player = usePlayerStore();

const isActive = computed(() => player.track?.id === props.track.id);
const isPlaying = computed(() => isActive.value && player.status === 'playing');

function onToggle() {
  if (isActive.value) {
    player.toggle();
    return;
  }
  void player.play(props.track);
}
</script>

<template>
  <article
    data-testid="track-card"
    class="tw-flex tw-flex-col tw-gap-3 tw-rounded-card tw-border tw-border-border tw-bg-surface-1 tw-p-3"
  >
    <div class="tw-flex tw-items-center tw-gap-3">
      <PlayButton :playing="isPlaying" :label="`Play ${track.title}`" @toggle="onToggle" />
      <div class="tw-min-w-0 tw-flex-1">
        <h3 class="tw-m-0 tw-truncate tw-text-sm tw-font-medium tw-text-ink-primary">
          {{ track.title }}
        </h3>
        <p v-if="track.artist" class="tw-m-0 tw-truncate tw-text-xs tw-text-ink-muted">
          {{ track.artist }}
        </p>
      </div>
    </div>
    <!-- Only the active card mounts a player, so a long list never holds N controllers. -->
    <AudioPlayer v-if="isActive" :title="track.title" />
  </article>
</template>
