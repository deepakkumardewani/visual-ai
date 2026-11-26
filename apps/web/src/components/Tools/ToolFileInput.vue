<script setup lang="ts">
import { computed } from 'vue';

import AttachedFile from '@/components/Video/AttachedFile.vue';
import UploadDropZone from '@/components/Video/UploadDropZone.vue';

import {
  type UploadedFile,
  useToolVideoUpload,
  type VideoUploadPurpose,
} from '@/composables/useToolVideoUpload';

const props = defineProps<{
  purpose: Extract<VideoUploadPurpose, 'tool-image' | 'tool-video'>;
  label: string;
  hint: string;
  buttonLabel: string;
  testId: string;
}>();

const uploaded = defineModel<UploadedFile | null>({ required: true });
const upload = useToolVideoUpload(props.purpose, uploaded);

const detail = computed(() =>
  uploaded.value?.durationSec ? `${Math.round(uploaded.value.durationSec)} s` : undefined,
);
</script>

<template>
  <AttachedFile
    v-if="uploaded"
    :label="label"
    :name="uploaded.name"
    :detail="detail"
    :preview-url="purpose === 'tool-image' ? uploaded.previewUrl : undefined"
    :test-id="testId"
    @remove="upload.clear()"
  />
  <UploadDropZone
    v-else
    :label="label"
    :hint="hint"
    :accept="upload.rules.accept"
    :button-label="buttonLabel"
    :dragging="upload.isDragging.value"
    :busy="upload.isUploading.value"
    :error="upload.error.value"
    :test-id="testId"
    @pick="upload.onPick"
    @dragover="upload.onDragOver"
    @dragleave="upload.onDragLeave"
    @drop="upload.onDrop"
  />
</template>
