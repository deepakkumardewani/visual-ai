<script setup lang="ts">
import {
  getVideoModelOptions,
  MEDIA_PROMPT_MAX_CHARS,
  type VideoStudioModelKey,
} from '@visual-ai/shared';
import { computed } from 'vue';

import AudioInput from '@/components/Video/AudioInput.vue';
import ImageInput from '@/components/Video/ImageInput.vue';
import VideoSettings from '@/components/Video/VideoSettings.vue';

import type { UploadedFile } from '@/composables/useToolVideoUpload';

const PROMPT_ID = 'video-prompt';

const modelKey = defineModel<VideoStudioModelKey>('modelKey', { required: true });
const prompt = defineModel<string>('prompt', { required: true });
const durationSec = defineModel<number>('durationSec', { required: true });
const resolution = defineModel<string>('resolution', { required: true });
const image = defineModel<UploadedFile | null>('image', { required: true });
const audio = defineModel<UploadedFile | null>('audio', { required: true });

const supportsAudio = computed(() => getVideoModelOptions(modelKey.value)?.supportsAudio ?? false);
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-6" data-testid="video-composer">
    <div class="tw-flex tw-flex-col tw-gap-2">
      <div class="tw-flex tw-items-baseline tw-justify-between tw-gap-3">
        <label :for="PROMPT_ID" class="tw-text-sm tw-font-semibold tw-text-ink-primary">
          Describe the scene
        </label>
        <span class="tw-text-xs tw-text-ink-muted">
          {{ prompt.length }}/{{ MEDIA_PROMPT_MAX_CHARS }}
        </span>
      </div>
      <textarea
        :id="PROMPT_ID"
        v-model="prompt"
        class="field"
        rows="4"
        :maxlength="MEDIA_PROMPT_MAX_CHARS"
        placeholder="Subject, action, camera movement, light"
        data-testid="video-prompt"
      />
    </div>

    <VideoSettings
      v-model:model-key="modelKey"
      v-model:duration-sec="durationSec"
      v-model:resolution="resolution"
      :audio-driven="Boolean(audio)"
    />

    <ImageInput v-model="image" />
    <AudioInput v-if="supportsAudio" v-model="audio" />
  </div>
</template>

<style scoped lang="scss">
.field {
  width: 100%;
  padding: 0.625rem 1rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 0.75rem;
  background: rgb(var(--tw-surface-1));
  color: rgb(var(--tw-ink-primary));
  resize: vertical;

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }
}
</style>
