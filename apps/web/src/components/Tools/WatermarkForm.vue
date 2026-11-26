<script setup lang="ts">
import {
  IMAGE_WATERMARK_OPACITY,
  IMAGE_WATERMARK_POSITIONS,
  IMAGE_WATERMARK_SCALE,
  IMAGE_WATERMARK_TEXT_LIMIT,
  type ImageWatermarkPosition,
} from '@visual-ai/shared';
import { computed } from 'vue';

import ToolFileInput from '@/components/Tools/ToolFileInput.vue';

import type { UploadedFile } from '@/composables/useToolVideoUpload';

const SLIDER_STEP = 0.01;
const TEXT_ID = 'watermark-text';
/** The preview text is sized as a share of the image width; the model's own sizing is authoritative. */
const PREVIEW_TEXT_WIDTH_SHARE = 30;

const image = defineModel<UploadedFile | null>('image', { required: true });
const text = defineModel<string>('text', { required: true });
const position = defineModel<ImageWatermarkPosition>('position', {
  required: true,
});
const scale = defineModel<number>('scale', { required: true });
const opacity = defineModel<number>('opacity', { required: true });

const previewStyle = computed(() => ({
  fontSize: `${scale.value * PREVIEW_TEXT_WIDTH_SHARE}cqw`,
  opacity: opacity.value,
}));

function positionLabel(value: string): string {
  return value.replace('-', ' ');
}
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-6" data-testid="watermark-form">
    <ToolFileInput
      v-model="image"
      purpose="tool-image"
      label="Image"
      hint="Drop a JPG, PNG or WEBP image here."
      button-label="Choose image"
      test-id="watermark-image"
    />

    <div class="tw-flex tw-flex-col tw-gap-2">
      <div class="tw-flex tw-items-baseline tw-justify-between tw-gap-3">
        <label :for="TEXT_ID" class="tw-text-sm tw-font-semibold tw-text-ink-primary">
          Watermark text
        </label>
        <span class="tw-text-xs tw-text-ink-muted">
          {{ text.length }}/{{ IMAGE_WATERMARK_TEXT_LIMIT }}
        </span>
      </div>
      <input
        :id="TEXT_ID"
        v-model="text"
        type="text"
        class="field"
        :maxlength="IMAGE_WATERMARK_TEXT_LIMIT"
        data-testid="watermark-text"
      />
    </div>

    <fieldset class="tw-m-0 tw-flex tw-flex-col tw-gap-2 tw-border-0 tw-p-0">
      <legend class="tw-mb-2 tw-p-0 tw-text-sm tw-font-semibold tw-text-ink-primary">
        Position
      </legend>
      <div class="positions" role="radiogroup" aria-label="Watermark position">
        <button
          v-for="option in IMAGE_WATERMARK_POSITIONS"
          :key="option"
          type="button"
          role="radio"
          class="position"
          :class="{ 'position--on': position === option }"
          :aria-checked="position === option"
          :aria-label="positionLabel(option)"
          :data-testid="`watermark-position-${option}`"
          @click="position = option"
        >
          <span class="position__dot" aria-hidden="true" />
        </button>
      </div>
    </fieldset>

    <div class="tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2">
      <label class="tw-flex tw-flex-col tw-gap-2 tw-text-sm tw-font-semibold tw-text-ink-primary">
        Size
        <input
          v-model.number="scale"
          type="range"
          class="slider"
          :min="IMAGE_WATERMARK_SCALE.min"
          :max="IMAGE_WATERMARK_SCALE.max"
          :step="SLIDER_STEP"
          data-testid="watermark-scale"
        />
      </label>
      <label class="tw-flex tw-flex-col tw-gap-2 tw-text-sm tw-font-semibold tw-text-ink-primary">
        Opacity
        <input
          v-model.number="opacity"
          type="range"
          class="slider"
          :min="IMAGE_WATERMARK_OPACITY.min"
          :max="IMAGE_WATERMARK_OPACITY.max"
          :step="SLIDER_STEP"
          data-testid="watermark-opacity"
        />
      </label>
    </div>

    <figure v-if="image?.previewUrl" class="preview" data-testid="watermark-preview">
      <img :src="image.previewUrl" alt="Your image with the watermark preview" />
      <span
        v-if="text.trim()"
        class="preview__mark"
        :class="`preview__mark--${position}`"
        :style="previewStyle"
        aria-hidden="true"
      >
        {{ text }}
      </span>
      <figcaption class="tw-text-xs tw-text-ink-muted">
        The preview is an approximation. The finished image is authoritative.
      </figcaption>
    </figure>
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

.positions {
  display: grid;
  grid-template-columns: repeat(3, 44px);
  gap: 0.5rem;
}

.position {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 0.5rem;
  background: rgb(var(--tw-surface-1));

  &__dot {
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 9999px;
    background: rgb(var(--tw-ink-muted));
  }

  &--on {
    border-color: rgb(var(--studio-accent));

    .position__dot {
      background: rgb(var(--studio-accent));
    }
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }
}

.preview {
  position: relative;
  margin: 0;
  container-type: inline-size;

  img {
    display: block;
    width: 100%;
    max-height: 24rem;
    border-radius: 0.75rem;
    object-fit: contain;
    background: rgb(var(--tw-surface-2));
  }

  &__mark {
    position: absolute;
    max-width: 90%;
    padding: 0.5rem;
    overflow: hidden;
    color: #fff;
    font-weight: 700;
    line-height: 1.1;
    text-shadow: 0 1px 3px rgb(0 0 0 / 0.6);
    white-space: nowrap;
    text-overflow: ellipsis;
    pointer-events: none;

    &--top-left,
    &--top-center,
    &--top-right {
      top: 0;
    }
    &--center-left,
    &--center,
    &--center-right {
      top: 50%;
      transform: translateY(-50%);
    }
    &--bottom-left,
    &--bottom-center,
    &--bottom-right {
      bottom: 2rem;
    }
    &--top-left,
    &--center-left,
    &--bottom-left {
      left: 0;
    }
    &--top-right,
    &--center-right,
    &--bottom-right {
      right: 0;
    }
    &--top-center,
    &--bottom-center {
      left: 50%;
      transform: translateX(-50%);
    }
    &--center {
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }
}
</style>
