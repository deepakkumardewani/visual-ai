<script setup lang="ts">
import { computed } from 'vue';

import SideBySide from '@/components/SideBySide.vue';
import { faChevronLeft, faChevronRight } from '@/plugins/icons';

const props = defineProps<{
  imageUrl: string;
  alt: string;
  canPrev: boolean;
  canNext: boolean;
  processing?: boolean;
  processingLabel?: string;
  originalUrl?: string | null;
  resultUrl?: string | null;
  /** After image has alpha (remove-bg). */
  transparentResult?: boolean;
}>();

const emit = defineEmits<{
  prev: [];
  next: [];
}>();

const showCompare = computed(() => Boolean(props.originalUrl && props.resultUrl));
const glowUrl = computed(() => props.resultUrl || props.imageUrl);
const imageStyle = computed(() => ({
  backgroundImage: `url(${glowUrl.value})`,
}));
</script>

<template>
  <div
    data-testid="explore-viewer-stage"
    class="viewer-stage tw-relative tw-flex tw-min-h-0 tw-flex-1 tw-items-center tw-justify-center tw-overflow-hidden"
    :class="{ 'viewer-stage--processing': processing }"
  >
    <div class="viewer-stage__glow" aria-hidden="true" :style="imageStyle" />
    <div class="viewer-stage__vignette" aria-hidden="true" />

    <div v-if="showCompare" class="viewer-stage__frame">
      <SideBySide
        :original-image="originalUrl!"
        :enhanced-image="resultUrl!"
        :transparent="transparentResult"
      />
    </div>

    <div v-else class="viewer-stage__frame">
      <div class="viewer-stage__media">
        <img
          :src="imageUrl"
          :alt="alt"
          class="viewer-stage__image tw-shadow-elevated"
          decoding="async"
        />
        <div v-if="processing" class="viewer-stage__shimmer" aria-hidden="true" />
      </div>
    </div>

    <div
      v-if="processing"
      class="viewer-stage__status"
      role="status"
      aria-live="polite"
      data-testid="explore-viewer-processing"
    >
      <span class="viewer-stage__status-spinner" aria-hidden="true" />
      <span class="viewer-stage__status-text">
        {{ processingLabel || 'Enhancing…' }}
      </span>
    </div>

    <button
      type="button"
      data-testid="explore-viewer-prev"
      class="viewer-stage__nav viewer-stage__nav--prev"
      :disabled="!canPrev || processing"
      aria-label="Previous image"
      @click="emit('prev')"
    >
      <font-awesome-icon :icon="faChevronLeft" aria-hidden="true" />
    </button>
    <button
      type="button"
      data-testid="explore-viewer-next"
      class="viewer-stage__nav viewer-stage__nav--next"
      :disabled="!canNext || processing"
      aria-label="Next image"
      @click="emit('next')"
    >
      <font-awesome-icon :icon="faChevronRight" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.viewer-stage {
  background: rgb(var(--tw-canvas));
}

.viewer-stage__glow {
  position: absolute;
  inset: -10%;
  background-size: cover;
  background-position: center;
  filter: blur(48px) saturate(1.1);
  opacity: 0.22;
  transform: scale(1.05);
  pointer-events: none;
  transition: opacity 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

.viewer-stage--processing .viewer-stage__glow {
  opacity: 0.38;
  animation: viewer-glow-breathe 2.4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.viewer-stage__vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 40%,
    rgb(var(--tw-canvas) / 0.85) 100%
  );
  pointer-events: none;
}

/* Absolute frame so max-height % resolves against the stage box, not intrinsic img height. */
.viewer-stage__frame {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  /* Stable padding — do not change on processing (avoids image jump when pill appears). */
  padding: 1rem 3.25rem 3.25rem;
}

.viewer-stage__frame :deep(.compare) {
  width: 100%;
  height: 100%;
}

.viewer-stage__media {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
}

.viewer-stage__image {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 0.5rem;
  transition:
    filter 500ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 500ms cubic-bezier(0.16, 1, 0.3, 1);
}

.viewer-stage--processing .viewer-stage__image {
  filter: saturate(0.85) brightness(0.88);
}

.viewer-stage__shimmer {
  position: absolute;
  inset: 0;
  border-radius: 0.5rem;
  overflow: hidden;
  pointer-events: none;
  background: linear-gradient(
    105deg,
    transparent 30%,
    rgb(var(--tw-ink) / 0.04) 42%,
    rgb(201 168 76 / 0.18) 50%,
    rgb(var(--tw-ink) / 0.04) 58%,
    transparent 70%
  );
  background-size: 220% 100%;
  animation: viewer-shimmer 1.8s cubic-bezier(0.16, 1, 0.3, 1) infinite;
  mix-blend-mode: soft-light;
}

.viewer-stage__status {
  position: absolute;
  bottom: 0.85rem;
  left: 50%;
  z-index: 3;
  display: inline-flex;
  transform: translateX(-50%);
  align-items: center;
  gap: 0.6rem;
  border-radius: 999px;
  border: 1px solid rgb(var(--tw-hairline) / 0.55);
  background: rgb(var(--tw-surface-1) / 0.88);
  padding: 0.5rem 0.95rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.28);
}

.viewer-stage__status-spinner {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  border-radius: 999px;
  border: 2px solid rgb(var(--tw-ink) / 0.22);
  border-top-color: rgb(var(--tw-accent));
  animation: viewer-spin 0.75s linear infinite;
}

.viewer-stage__status-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(var(--tw-ink));
  white-space: nowrap;
}

.viewer-stage__nav {
  position: absolute;
  top: 50%;
  z-index: 2;
  display: flex;
  height: 2.75rem;
  width: 2.75rem;
  transform: translateY(-50%);
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid rgb(var(--tw-hairline) / 0.5);
  background: rgb(var(--tw-surface-1) / 0.85);
  color: rgb(var(--tw-ink));
  backdrop-filter: blur(8px);
  transition:
    opacity 150ms ease,
    background-color 150ms ease;

  &:hover:not(:disabled) {
    background: rgb(var(--tw-surface-2));
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--tw-accent));
    outline-offset: 3px;
  }
}

.viewer-stage__nav--prev {
  left: 0.75rem;
}

.viewer-stage__nav--next {
  right: 0.75rem;
}

@keyframes viewer-shimmer {
  0% {
    background-position: 120% 0;
  }
  100% {
    background-position: -120% 0;
  }
}

@keyframes viewer-glow-breathe {
  0%,
  100% {
    opacity: 0.28;
    transform: scale(1.04);
  }
  50% {
    opacity: 0.45;
    transform: scale(1.08);
  }
}

@keyframes viewer-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 767px) {
  .viewer-stage__frame {
    padding: 0.75rem 2.75rem 3rem;
  }

  .viewer-stage__nav--prev {
    left: 0.35rem;
  }

  .viewer-stage__nav--next {
    right: 0.35rem;
  }

  .viewer-stage__image {
    border-radius: 0;
  }

  .viewer-stage__status {
    bottom: 0.55rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .viewer-stage__glow,
  .viewer-stage--processing .viewer-stage__glow,
  .viewer-stage__shimmer,
  .viewer-stage__status-spinner,
  .viewer-stage__image {
    animation: none !important;
    transition: none !important;
  }

  .viewer-stage__glow {
    filter: none;
    opacity: 0.08;
  }

  .viewer-stage__shimmer {
    display: none;
  }

  .viewer-stage__status-spinner {
    border-color: rgb(var(--tw-accent));
    opacity: 0.85;
  }
}
</style>
