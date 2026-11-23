<script setup lang="ts">
import { faDownload } from '@/plugins/icons';
import { useMediaQuery } from '@vueuse/core';
import { computed, nextTick, onMounted, ref, watch } from 'vue';

import type { IImageObject } from '@/types';
import type { MediaAssetDto } from '@visual-ai/shared';

import TrackCard from '@/components/Audio/TrackCard.vue';
import UnsavedResultNotice from '@/components/Dashboard/Canvas/UnsavedResultNotice.vue';

import { useAppStore } from '@/stores/app';
import type { PlayerTrack } from '@/stores/player';

const PLAY_CONTROL_SELECTOR = '[data-testid="play-button"]';
const READY_TOAST = 'Your result is ready';

const props = defineProps<{ asset: MediaAssetDto }>();

const appStore = useAppStore();
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
const root = ref<HTMLElement | null>(null);
const videoEl = ref<HTMLVideoElement | null>(null);
const dismissedAssetId = ref<string | null>(null);

const track = computed<PlayerTrack>(() => ({
  id: props.asset.id,
  title: props.asset.title,
  src: props.asset.url,
  artworkUrl: props.asset.posterUrl,
}));

const showUnsavedNotice = computed(
  () => !props.asset.saved && dismissedAssetId.value !== props.asset.id,
);

// UnsavedResultNotice only reads the result's url for its download link, so a minimal shim suffices.
const unsavedResult = computed<IImageObject>(() => ({
  userId: '',
  prompt: props.asset.prompt ?? props.asset.title,
  featureType: props.asset.feature,
  images: [
    {
      name: props.asset.title,
      aiImageUrl: props.asset.url,
      resolution: '',
      aspectRatio: '',
      width: props.asset.width ?? 0,
      height: props.asset.height ?? 0,
      format: props.asset.format ?? '',
      bytes: props.asset.bytes ?? 0,
    },
  ],
}));

async function revealResult() {
  await nextTick();
  const target =
    props.asset.type === 'video'
      ? videoEl.value
      : root.value?.querySelector<HTMLElement>(PLAY_CONTROL_SELECTOR);
  // preventScroll so focus does not jump instantly; the smooth scroll below is the only movement.
  target?.focus({ preventScroll: true });
  root.value?.scrollIntoView({
    behavior: prefersReducedMotion.value ? 'auto' : 'smooth',
    block: 'center',
  });
  appStore.snackbarText = READY_TOAST;
  appStore.snackbar = true;
}

onMounted(revealResult);
watch(() => props.asset.id, revealResult);
</script>

<template>
  <section ref="root" data-testid="result-card" class="tw-flex tw-flex-col tw-gap-3">
    <UnsavedResultNotice
      v-if="showUnsavedNotice"
      :result="unsavedResult"
      @dismiss="dismissedAssetId = asset.id"
    />
    <TrackCard v-if="asset.type === 'audio'" :track="track" />
    <video
      v-else
      ref="videoEl"
      :src="asset.url"
      :poster="asset.posterUrl"
      :aria-label="asset.title"
      controls
      playsinline
      class="result-video"
    />
    <a
      :href="asset.url"
      :download="asset.title"
      data-testid="result-download"
      class="result-download"
    >
      <font-awesome-icon :icon="faDownload" aria-hidden="true" />
      Download
    </a>
  </section>
</template>

<style scoped lang="scss">
.result-video {
  width: 100%;
  border-radius: 0.75rem;
  background: #000;
}

.result-download {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0 1rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 9999px;
  font-size: 0.875rem;
  // Anchors take the browser link colour, which is near-black on the dark surface.
  color: rgb(var(--tw-ink-primary));
  text-decoration: none;

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent, var(--tw-ink-primary)));
    outline-offset: 2px;
  }
}
</style>
