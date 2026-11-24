<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { MediaAssetDto } from '@visual-ai/shared';

import ResultCard from '@/components/Studio/ResultCard.vue';

import { usePlayerStore } from '@/stores/player';

const props = defineProps<{
  asset: MediaAssetDto;
  /** True when this result was rendered as a draft. */
  draft: boolean;
  /** Full-price credits of a final render; undefined hides the action (no draft support). */
  finalCost?: number;
}>();

defineEmits<{ 'render-final': [] }>();

const player = usePlayerStore();
const root = ref<HTMLElement | null>(null);

const showRenderFinal = computed(() => props.draft && props.finalCost !== undefined);

/** `play` does not bubble, so it is caught on the way down to the native video element. */
function onVideoPlay() {
  player.pause();
}

// The reverse direction: audio starting stops the video, so the two never overlap.
watch(
  () => player.status,
  (status) => {
    if (status === 'playing') root.value?.querySelector('video')?.pause();
  },
);
</script>

<template>
  <div
    ref="root"
    class="tw-flex tw-flex-col tw-gap-3"
    data-testid="video-result"
    @play.capture="onVideoPlay"
  >
    <p v-if="draft" class="draft-label" data-testid="draft-label">Draft</p>
    <ResultCard :asset="asset" />
    <button
      v-if="showRenderFinal"
      type="button"
      class="render-final"
      data-testid="render-final"
      @click="$emit('render-final')"
    >
      Render final at full quality ({{ finalCost }} credits)
    </button>
  </div>
</template>

<style scoped lang="scss">
.draft-label {
  align-self: flex-start;
  margin: 0;
  padding: 0.125rem 0.75rem;
  border: 1px solid rgb(var(--studio-accent));
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(var(--studio-accent));
}

.render-final {
  align-self: flex-start;
  min-height: 44px;
  padding: 0 1.25rem;
  border-radius: 9999px;
  background: rgb(var(--studio-accent));
  color: rgb(var(--tw-canvas));
  font-weight: 600;

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 3px;
  }
}
</style>
