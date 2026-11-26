<script setup lang="ts">
import type { MediaAssetDto } from '@visual-ai/shared';
import { onBeforeUnmount, ref, watch } from 'vue';

import ResultCard from '@/components/Studio/ResultCard.vue';

import { createLogger } from '@/utils/logger';

const log = createLogger('captionResult');

const TRANSCRIPT_FILE_NAME = 'transcript.txt';
const TRANSCRIPT_MIME = 'text/plain;charset=utf-8';
const COPIED_FLASH_MS = 2000;
const LOAD_FAILED_COPY = 'The transcript could not be loaded. Download it instead.';

const props = defineProps<{ asset: MediaAssetDto }>();

const transcript = ref('');
const loadFailed = ref(false);
const copied = ref(false);
let copiedTimer: ReturnType<typeof setTimeout> | undefined;

onBeforeUnmount(() => clearTimeout(copiedTimer));

async function loadTranscript(url: string | undefined) {
  transcript.value = '';
  loadFailed.value = false;
  if (!url) return;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    transcript.value = await response.text();
  } catch (error) {
    log.warn('transcript load failed', { error });
    loadFailed.value = true;
  }
}

watch(() => props.asset.transcriptUrl, loadTranscript, { immediate: true });

async function copyTranscript() {
  try {
    await navigator.clipboard.writeText(transcript.value);
    copied.value = true;
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => (copied.value = false), COPIED_FLASH_MS);
  } catch (error) {
    log.warn('transcript copy failed', { error });
  }
}

function downloadTranscript() {
  const href = URL.createObjectURL(new Blob([transcript.value], { type: TRANSCRIPT_MIME }));
  const link = document.createElement('a');
  link.href = href;
  link.download = TRANSCRIPT_FILE_NAME;
  link.click();
  URL.revokeObjectURL(href);
}
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-6" data-testid="caption-result">
    <ResultCard :asset="asset" />
    <section v-if="asset.transcriptUrl" aria-labelledby="transcript-heading" class="transcript">
      <div class="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <h2
          id="transcript-heading"
          class="tw-m-0 tw-text-base tw-font-semibold tw-text-ink-primary"
        >
          Transcript
        </h2>
        <div class="tw-flex tw-gap-2">
          <button
            type="button"
            class="action"
            :disabled="!transcript"
            data-testid="transcript-copy"
            @click="copyTranscript"
          >
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
          <a
            v-if="loadFailed"
            :href="asset.transcriptUrl"
            :download="TRANSCRIPT_FILE_NAME"
            target="_blank"
            rel="noopener"
            class="action action--link"
            data-testid="transcript-download-link"
          >
            Download
          </a>
          <button
            v-else
            type="button"
            class="action"
            :disabled="!transcript"
            data-testid="transcript-download"
            @click="downloadTranscript"
          >
            Download
          </button>
        </div>
      </div>
      <!-- Interpolation, never v-html: transcript text is untrusted. -->
      <pre v-if="transcript" class="transcript__text" data-testid="transcript-text">{{
        transcript
      }}</pre>
      <p v-else-if="loadFailed" class="tw-m-0 tw-text-sm tw-text-ink-muted" role="status">
        {{ LOAD_FAILED_COPY }}
      </p>
    </section>
  </div>
</template>

<style scoped lang="scss">
.transcript {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  &__text {
    max-height: 16rem;
    margin: 0;
    padding: 1rem;
    overflow: auto;
    border: 1px solid rgb(var(--tw-border));
    border-radius: 0.75rem;
    background: rgb(var(--tw-surface-1));
    color: rgb(var(--tw-ink-primary));
    font: inherit;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
}

.action {
  min-width: 44px;
  min-height: 44px;
  padding: 0 1rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 0.75rem;
  background: transparent;
  color: rgb(var(--tw-ink-primary));
  cursor: pointer;

  &--link {
    display: inline-flex;
    align-items: center;
    text-decoration: none;
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}
</style>
