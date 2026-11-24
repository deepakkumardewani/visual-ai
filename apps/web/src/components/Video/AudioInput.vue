<script setup lang="ts">
import { computed } from 'vue';

import AttachedFile from '@/components/Video/AttachedFile.vue';
import UploadDropZone from '@/components/Video/UploadDropZone.vue';

import { type UploadedFile, useToolVideoUpload } from '@/composables/useToolVideoUpload';

const LABEL = 'Audio track';
const HINT = 'Optional. Your own audio sets the length of the video, up to 20 seconds.';

const uploaded = defineModel<UploadedFile | null>({ required: true });
const upload = useToolVideoUpload('video-audio', uploaded);

const detail = computed(() =>
  uploaded.value?.durationSec === undefined
    ? undefined
    : `${Math.round(uploaded.value.durationSec)} s`,
);
</script>

<template>
  <AttachedFile
    v-if="uploaded"
    :label="LABEL"
    :name="uploaded.name"
    :detail="detail"
    test-id="video-audio"
    @remove="upload.clear()"
  />
  <UploadDropZone
    v-else
    :label="LABEL"
    :hint="HINT"
    :accept="upload.rules.accept"
    button-label="Choose audio"
    :dragging="upload.isDragging.value"
    :busy="upload.isUploading.value"
    :error="upload.error.value"
    test-id="video-audio"
    @pick="upload.onPick"
    @dragover="upload.onDragOver"
    @dragleave="upload.onDragLeave"
    @drop="upload.onDrop"
  />
</template>
