<script setup lang="ts">
import { computed } from 'vue';
import { VIDEO_WATERMARK_SIZE, VIDEO_WATERMARK_TEXT_LIMIT } from '@visual-ai/shared';

import ToolFileInput from '@/components/Tools/ToolFileInput.vue';

import type { UploadedFile } from '@/composables/useToolVideoUpload';

const TEXT_ID = 'video-watermark-text';
const POSITION_CAPTION = 'Position is fixed by this tool; you can change the text and size.';
const PREVIEW_PX_PER_SIZE = 0.5;
const PREVIEW_MIN_PX = 12;
const PREVIEW_MAX_PX = 64;

const video = defineModel<UploadedFile | null>('video', { required: true });
const text = defineModel<string>('text', { required: true });
const size = defineModel<number>('size', { required: true });

// Position is unverified, so the text is previewed beside the frame, not placed on it.
const previewFontPx = computed(() =>
  Math.min(PREVIEW_MAX_PX, Math.max(PREVIEW_MIN_PX, size.value * PREVIEW_PX_PER_SIZE)),
);
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-6" data-testid="video-watermark-form">
    <ToolFileInput
      v-model="video"
      purpose="tool-video"
      label="Video"
      hint="Videos up to 2 minutes and 100 MB."
      button-label="Choose video"
      test-id="video-watermark-file"
    />

    <div class="tw-flex tw-flex-col tw-gap-2">
      <div class="tw-flex tw-items-baseline tw-justify-between tw-gap-3">
        <label :for="TEXT_ID" class="tw-text-sm tw-font-semibold tw-text-ink-primary">
          Watermark text
        </label>
        <span class="tw-text-xs tw-text-ink-muted">
          {{ text.length }}/{{ VIDEO_WATERMARK_TEXT_LIMIT }}
        </span>
      </div>
      <input
        :id="TEXT_ID"
        v-model="text"
        type="text"
        class="field"
        :maxlength="VIDEO_WATERMARK_TEXT_LIMIT"
        data-testid="video-watermark-text"
      />
    </div>

    <label class="tw-flex tw-flex-col tw-gap-2 tw-text-sm tw-font-semibold tw-text-ink-primary">
      <span class="tw-flex tw-justify-between">
        Text size
        <span class="tw-font-normal tw-text-ink-muted">{{ size }}</span>
      </span>
      <input
        v-model.number="size"
        type="range"
        class="slider"
        :min="VIDEO_WATERMARK_SIZE.min"
        :max="VIDEO_WATERMARK_SIZE.max"
        step="1"
        data-testid="video-watermark-size"
      />
    </label>

    <figure v-if="video?.previewUrl" class="preview" data-testid="video-watermark-preview">
      <div class="preview__frame">
        <video
          :src="`${video.previewUrl}#t=0.1`"
          class="preview__video"
          preload="metadata"
          controls
          muted
          playsinline
          aria-label="Your video, for previewing the watermark"
        />
      </div>
      <p
        v-if="text.trim()"
        class="preview__text"
        :style="{ fontSize: `${previewFontPx}px` }"
        data-testid="video-watermark-text-preview"
      >
        {{ text }}
      </p>
      <figcaption
        class="tw-mt-2 tw-text-xs tw-text-ink-muted"
        data-testid="video-watermark-caption"
      >
        {{ POSITION_CAPTION }}
      </figcaption>
    </figure>
    <p v-else class="tw-m-0 tw-text-xs tw-text-ink-muted" data-testid="video-watermark-caption">
      {{ POSITION_CAPTION }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.field {
  width: 100%;
  min-height: 44px;
  padding: 0.625rem 1rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 0.75rem;
  background: rgb(var(--tw-surface-1));
  color: rgb(var(--tw-ink-primary));

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }
}

.slider {
  width: 100%;
  min-height: 44px;
  accent-color: rgb(var(--studio-accent));

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }
}

.preview {
  margin: 0;

  &__frame {
    position: relative;
    container-type: size;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 0.75rem;
    background: #000;
  }

  &__text {
    margin: 0.5rem 0 0;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    background: rgb(var(--tw-surface-1));
    color: rgb(var(--tw-ink-primary));
    font-weight: 600;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }

  &__video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
</style>
