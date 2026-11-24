import { MAX_VIDEO_AUDIO_BYTES, WAN_FIRST_FRAME_MAX_BYTES } from '@visual-ai/shared';
import { computed, onBeforeUnmount, ref, type Ref } from 'vue';

import { useFetch } from '@/composables/useFetch';
import { createLogger } from '@/utils/logger';

const log = createLogger('toolVideoUpload');

export type VideoUploadPurpose = 'video-image' | 'video-audio';

/** An attachment the server has stored; only `uploadId` is ever sent with a video request. */
export interface UploadedFile {
  uploadId: string;
  name: string;
  durationSec?: number;
  /** Local object URL for the thumbnail; revoked when the file is removed. */
  previewUrl?: string;
}

interface UploadResponse {
  uploadId: string;
  durationSec?: number;
}

interface UploadErrorBody {
  error?: string;
  message?: string;
}

interface PurposeRules {
  accept: string;
  maxBytes: number;
  /** Mime prefix the browser reports; the server still sniffs the real content. */
  mimePrefix: string;
  tooLargeCopy: string;
  wrongTypeCopy: string;
}

const BYTES_PER_MB = 1024 * 1024;
const mb = (bytes: number) => Math.round(bytes / BYTES_PER_MB);

export const VIDEO_UPLOAD_RULES: Record<VideoUploadPurpose, PurposeRules> = {
  'video-image': {
    accept: 'image/jpeg,image/png,image/webp,image/bmp',
    maxBytes: WAN_FIRST_FRAME_MAX_BYTES,
    mimePrefix: 'image/',
    tooLargeCopy: `Image must be ${mb(WAN_FIRST_FRAME_MAX_BYTES)} MB or smaller.`,
    wrongTypeCopy: 'Choose a JPG, PNG, WEBP or BMP image.',
  },
  'video-audio': {
    accept: 'audio/flac,audio/mpeg,audio/wav,.flac,.mp3,.wav',
    maxBytes: MAX_VIDEO_AUDIO_BYTES,
    mimePrefix: 'audio/',
    tooLargeCopy: `Audio must be ${mb(MAX_VIDEO_AUDIO_BYTES)} MB or smaller.`,
    wrongTypeCopy: 'Choose an MP3, WAV or FLAC file.',
  },
};

const UPLOAD_FAILED_COPY = 'The upload failed. Try again.';
const NETWORK_COPY = 'Could not reach the server. Try again.';
const HTTP_CLIENT_ERROR_MIN = 400;
const HTTP_SERVER_ERROR_MIN = 500;

export type UploadStatus = 'idle' | 'uploading' | 'ready' | 'error';

/** The server's own message for a rejected file (it names the real problem, e.g. a renamed file). */
function rejectionCopy(status: number | null, body: UploadErrorBody | null): string {
  if (status === null) return NETWORK_COPY;
  const isClientError = status >= HTTP_CLIENT_ERROR_MIN && status < HTTP_SERVER_ERROR_MIN;
  return (isClientError && (body?.error ?? body?.message)) || UPLOAD_FAILED_COPY;
}

/**
 * Validates, uploads and tracks one video attachment. The server decides what the file really
 * is (magic bytes); the checks here only spare the user a pointless upload.
 */
export function useToolVideoUpload(
  purpose: VideoUploadPurpose,
  uploaded: Ref<UploadedFile | null>,
) {
  const rules = VIDEO_UPLOAD_RULES[purpose];
  const status = ref<UploadStatus>(uploaded.value ? 'ready' : 'idle');
  const error = ref('');
  const isDragging = ref(false);
  const isUploading = computed(() => status.value === 'uploading');

  function revokePreview() {
    if (uploaded.value?.previewUrl) URL.revokeObjectURL(uploaded.value.previewUrl);
  }

  function fail(message: string) {
    status.value = 'error';
    error.value = message;
  }

  function validate(file: File): string {
    if (!file.type.startsWith(rules.mimePrefix)) return rules.wrongTypeCopy;
    return file.size > rules.maxBytes ? rules.tooLargeCopy : '';
  }

  async function upload(file: File) {
    const problem = validate(file);
    if (problem) {
      fail(problem);
      return;
    }
    status.value = 'uploading';
    error.value = '';
    const form = new FormData();
    form.append('file', file, file.name);
    const { data, statusCode } = await useFetch(
      `/media/uploads?purpose=${purpose}`,
      { method: 'POST', body: form },
      { updateDataOnError: true },
    ).json<UploadResponse & UploadErrorBody>();
    const code = statusCode.value;
    if (!data.value?.uploadId || code === null || code >= HTTP_CLIENT_ERROR_MIN) {
      log.warn('video upload rejected', { purpose, status: code });
      fail(rejectionCopy(code, data.value));
      return;
    }
    revokePreview();
    uploaded.value = {
      uploadId: data.value.uploadId,
      name: file.name,
      durationSec: data.value.durationSec,
      previewUrl: purpose === 'video-image' ? URL.createObjectURL(file) : undefined,
    };
    status.value = 'ready';
  }

  /** Forgets the attachment; the stored file expires on its own if it is never used. */
  function clear() {
    revokePreview();
    uploaded.value = null;
    status.value = 'idle';
    error.value = '';
  }

  function onPick(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Reset so choosing the same file again after removing it still fires `change`.
    input.value = '';
    if (file) void upload(file);
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault();
    isDragging.value = true;
  }

  function onDragLeave() {
    isDragging.value = false;
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    isDragging.value = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) void upload(file);
  }

  onBeforeUnmount(revokePreview);

  return {
    rules,
    status,
    error,
    isDragging,
    isUploading,
    upload,
    clear,
    onPick,
    onDragOver,
    onDragLeave,
    onDrop,
  };
}
