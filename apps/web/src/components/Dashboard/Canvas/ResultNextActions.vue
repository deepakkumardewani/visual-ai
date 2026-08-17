<script setup lang="ts">
import { computed } from 'vue';

import type { IImageObject } from '@/types';

import { useImageChainActions } from '@/composables/useImageChainActions';
import { useShareActions } from '@/composables/useShareActions';
import { downloadImage, getDownloadImageUrl } from '@/utils/helpers';

const props = withDefaults(
  defineProps<{
    item: IImageObject;
    imageIndex?: number;
  }>(),
  { imageIndex: 0 },
);

const { shareLink, copyPrompt, showToast } = useShareActions();
const { useAsReference, sendToUpscale, sendToRemoveBg, moreLikeThis } = useImageChainActions();

const targetImage = computed(() => props.item.images?.[props.imageIndex] ?? props.item.images?.[0]);

const shareUrl = computed(() => {
  if (targetImage.value) return getDownloadImageUrl(targetImage.value);
  return typeof window !== 'undefined' ? window.location.href : '';
});

const hasPrompt = computed(() => Boolean(props.item.prompt?.trim()));

async function handleDownload(event: Event) {
  event.stopPropagation();
  if (!targetImage.value) {
    showToast('Nothing to download');
    return;
  }
  await downloadImage(event, getDownloadImageUrl(targetImage.value));
}

async function handleShare(event: Event) {
  event.stopPropagation();
  await shareLink({ title: 'Visual AI creation', url: shareUrl.value });
}

async function handleCopyPrompt(event: Event) {
  event.stopPropagation();
  await copyPrompt(props.item.prompt);
}

async function handleUseAsReference(event: Event) {
  event.stopPropagation();
  await useAsReference(targetImage.value);
}

async function handleUpscale(event: Event) {
  event.stopPropagation();
  await sendToUpscale(targetImage.value);
}

async function handleRemoveBg(event: Event) {
  event.stopPropagation();
  await sendToRemoveBg(targetImage.value);
}

async function handleMoreLikeThis(event: Event) {
  event.stopPropagation();
  await moreLikeThis(props.item);
}
</script>

<template>
  <div
    data-testid="result-next-actions"
    class="result-next-actions"
    role="group"
    aria-label="Next actions for this result"
    @click.stop
  >
    <button type="button" class="action-btn" @click="handleDownload">
      <font-awesome-icon icon="download" class="tw-h-3 tw-w-3" aria-hidden="true" />
      Download
    </button>
    <button type="button" class="action-btn" @click="handleShare">
      <font-awesome-icon icon="link" class="tw-h-3 tw-w-3" aria-hidden="true" />
      Share
    </button>
    <button v-if="hasPrompt" type="button" class="action-btn" @click="handleCopyPrompt">
      <font-awesome-icon icon="copy" class="tw-h-3 tw-w-3" aria-hidden="true" />
      Copy prompt
    </button>
    <button
      v-if="hasPrompt"
      type="button"
      class="action-btn action-btn--accent"
      @click="handleMoreLikeThis"
    >
      <font-awesome-icon icon="dice" class="tw-h-3 tw-w-3" aria-hidden="true" />
      More like this
    </button>
    <button type="button" class="action-btn action-btn--accent" @click="handleUseAsReference">
      <font-awesome-icon icon="upload" class="tw-h-3 tw-w-3" aria-hidden="true" />
      Use as reference
    </button>
    <button type="button" class="action-btn action-btn--accent" @click="handleUpscale">
      <font-awesome-icon icon="expand" class="tw-h-3 tw-w-3" aria-hidden="true" />
      Upscale this
    </button>
    <button type="button" class="action-btn action-btn--accent" @click="handleRemoveBg">
      <font-awesome-icon icon="object-ungroup" class="tw-h-3 tw-w-3" aria-hidden="true" />
      Remove background
    </button>
  </div>
</template>

<style scoped lang="scss">
.result-next-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.75rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 1.75rem;
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  border: 1px solid rgb(var(--tw-hairline) / 0.7);
  background: rgb(var(--tw-surface-1) / 0.85);
  color: rgb(var(--tw-ink-muted));
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease;

  &:hover {
    color: rgb(var(--tw-ink));
    border-color: rgb(var(--tw-accent) / 0.45);
    background: rgb(var(--tw-surface-2));
  }

  &:focus-visible {
    outline: 2px solid #c98a5a;
    outline-offset: 2px;
  }
}

.action-btn--accent {
  color: #c98a5a;
  border-color: rgb(201 138 90 / 0.35);

  &:hover {
    color: #d9996a;
    border-color: rgb(201 138 90 / 0.55);
  }
}
</style>
