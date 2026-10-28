import { STT_MAX_CLIP_SECONDS } from '@visual-ai/shared';
import { ref } from 'vue';

import { useAuthStore } from '@/stores/auth';

import { appendPromptText } from '@/composables/voicePromptText';

const COUNTDOWN_FROM_SECONDS = 10;
const PREFERRED_MIME = 'audio/webm;codecs=opus';
const FALLBACK_MIME = 'audio/mp4';

export type GrokRecorderErrorCode =
  | 'permission_denied'
  | 'no_device'
  | 'empty_text'
  | 'network'
  | 'upstream'
  | 'rate_limit'
  | 'unsupported';

export type GrokRecorderError = {
  code: GrokRecorderErrorCode;
  retryAfterMinutes?: number;
};

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') {
    return undefined;
  }
  if (MediaRecorder.isTypeSupported(PREFERRED_MIME)) {
    return PREFERRED_MIME;
  }
  if (MediaRecorder.isTypeSupported(FALLBACK_MIME)) {
    return FALLBACK_MIME;
  }
  return undefined;
}

function mapHttpError(status: number, retryAfterHeader: string | null): GrokRecorderError {
  if (status === 429) {
    const retryAfterSeconds = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : 600;
    const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
    return { code: 'rate_limit', retryAfterMinutes: minutes };
  }
  if (status >= 500) {
    return { code: 'upstream' };
  }
  return { code: 'network' };
}

function mapGetUserMediaError(error: unknown): GrokRecorderError {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return { code: 'permission_denied' };
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return { code: 'no_device' };
  }
  return { code: 'unsupported' };
}

export function grokErrorMessage(error: GrokRecorderError): string {
  switch (error.code) {
    case 'permission_denied':
      return 'Microphone access is blocked. Allow it in your browser settings.';
    case 'no_device':
      return 'No microphone found. Connect a mic and try again.';
    case 'empty_text':
      return 'No speech detected. Try speaking closer to the mic.';
    case 'rate_limit':
      return `Too many voice requests. Try again in ${error.retryAfterMinutes ?? 10} minutes.`;
    case 'upstream':
      return 'Transcription failed, try again.';
    case 'network':
      return 'Network error while transcribing. Check your connection.';
    default:
      return 'Voice input is not supported in this browser.';
  }
}

export function useGrokRecorder(options: {
  onAppend: (text: string) => void;
  onError: (message: string) => void;
  onCountdown: (secondsLeft: number | null) => void;
}) {
  const isRecording = ref(false);
  const isTranscribing = ref(false);

  let mediaRecorder: MediaRecorder | null = null;
  let mediaStream: MediaStream | null = null;
  let chunks: Blob[] = [];
  let autoStopTimer: ReturnType<typeof setTimeout> | null = null;
  let countdownTimer: ReturnType<typeof setInterval> | null = null;
  let startedAt = 0;

  function clearTimers() {
    if (autoStopTimer) {
      clearTimeout(autoStopTimer);
      autoStopTimer = null;
    }
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    options.onCountdown(null);
  }

  function stopStream() {
    mediaStream?.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  async function upload(blob: Blob, mimeType: string) {
    isTranscribing.value = true;
    try {
      const { getToken } = useAuthStore();
      const token = await getToken();
      const formData = new FormData();
      formData.append('file', blob, mimeType.includes('mp4') ? 'recording.mp4' : 'recording.webm');

      const response = await fetch(`${import.meta.env.VITE_API_BASEPATH}/stt`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const mapped = mapHttpError(response.status, response.headers.get('Retry-After'));
        options.onError(grokErrorMessage(mapped));
        return;
      }

      const payload = (await response.json()) as { text?: string };
      const text = typeof payload.text === 'string' ? payload.text.trim() : '';
      if (!text) {
        options.onError(grokErrorMessage({ code: 'empty_text' }));
        return;
      }
      options.onAppend(text);
    } catch {
      options.onError(grokErrorMessage({ code: 'network' }));
    } finally {
      isTranscribing.value = false;
    }
  }

  async function stopRecording() {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      return;
    }
    clearTimers();
    await new Promise<void>((resolve) => {
      mediaRecorder!.addEventListener('stop', () => resolve(), { once: true });
      mediaRecorder!.stop();
    });
  }

  function cancelRecording() {
    clearTimers();
    chunks = [];
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    stopStream();
    mediaRecorder = null;
    isRecording.value = false;
  }

  async function startRecording(): Promise<boolean> {
    if (isRecording.value || isTranscribing.value) {
      return false;
    }

    const mimeType = pickMimeType();
    if (!mimeType) {
      options.onError(grokErrorMessage({ code: 'unsupported' }));
      return false;
    }

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      options.onError(grokErrorMessage(mapGetUserMediaError(error)));
      return false;
    }

    chunks = [];
    mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
    mediaRecorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    });
    mediaRecorder.addEventListener('stop', () => {
      stopStream();
      const blob = new Blob(chunks, { type: mimeType });
      chunks = [];
      mediaRecorder = null;
      isRecording.value = false;
      if (blob.size > 0) {
        void upload(blob, mimeType);
      }
    });

    mediaRecorder.start();
    isRecording.value = true;
    startedAt = Date.now();

    autoStopTimer = setTimeout(() => {
      void stopRecording();
    }, STT_MAX_CLIP_SECONDS * 1000);

    countdownTimer = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const remaining = STT_MAX_CLIP_SECONDS - elapsed;
      if (remaining <= COUNTDOWN_FROM_SECONDS) {
        options.onCountdown(Math.max(0, Math.ceil(remaining)));
      }
    }, 250);

    return true;
  }

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    cancelRecording,
    getStream: () => mediaStream,
  };
}

export { appendPromptText };
