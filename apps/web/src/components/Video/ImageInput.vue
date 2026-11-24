<script setup lang="ts">
import AttachedFile from '@/components/Video/AttachedFile.vue';
import UploadDropZone from '@/components/Video/UploadDropZone.vue';

import { type UploadedFile, useToolVideoUpload } from '@/composables/useToolVideoUpload';

const LABEL = 'Start image';
const HINT = 'Optional. Drop an image here to animate it.';

const uploaded = defineModel<UploadedFile | null>({ required: true });
const upload = useToolVideoUpload('video-image', uploaded);
</script>

<template>
  <AttachedFile
    v-if="uploaded"
    :label="LABEL"
    :name="uploaded.name"
    :preview-url="uploaded.previewUrl"
    test-id="video-image"
    @remove="upload.clear()"
  />
  <UploadDropZone
    v-else
    :label="LABEL"
    :hint="HINT"
    :accept="upload.rules.accept"
    button-label="Choose image"
    :dragging="upload.isDragging.value"
    :busy="upload.isUploading.value"
    :error="upload.error.value"
    test-id="video-image"
    @pick="upload.onPick"
    @dragover="upload.onDragOver"
    @dragleave="upload.onDragLeave"
    @drop="upload.onDrop"
  />
</template>
