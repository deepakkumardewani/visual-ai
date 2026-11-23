import { useEventSource } from '@vueuse/core';
import { v4 as uuidv4 } from 'uuid';
import { computed, onBeforeUnmount, ref, watch } from 'vue';

import type { JobStatus, MediaAssetDto, MediaJobStage, NoChargeReason } from '@visual-ai/shared';

import { useDialogStore } from '@/stores/dialog';
import { useHistoryStore } from '@/stores/history';
import { useUserStore } from '@/stores/user';

import { useFetch } from '@/composables/useFetch';
import { createLogger } from '@/utils/logger';

const log = createLogger('mediaJob');

const HTTP_BAD_REQUEST = 400;
const HTTP_INSUFFICIENT_CREDITS = 402;
const HTTP_UNPROCESSABLE = 422;
const HTTP_RATE_LIMITED = 429;
const HTTP_BAD_GATEWAY = 502;

export const NO_CHARGE_SENTENCE = 'No credits were used.';

/** Stage labels shown while a job runs. */
export const STAGE_COPY: Record<MediaJobStage, string> = {
  queued: 'Queued',
  composing: 'Composing',
  mastering: 'Mastering',
  saving: 'Saving',
};

const NO_CHARGE_REASON_COPY: Record<NoChargeReason, string> = {
  FAILED: 'Generation failed.',
  CANCELED: 'The job was canceled.',
  MODERATED: "This text can't be used. Try rephrasing it.",
  CONTENT_SAFETY: "This request can't be completed. Try rephrasing it.",
  TIMEOUT: 'Generation took too long.',
  VOICE_UNAVAILABLE: 'This voice is no longer available. Re-clone it to keep using it.',
};

const STATUS_COPY: Record<number, string> = {
  [HTTP_BAD_REQUEST]: 'Some inputs need attention. Check them and try again.',
  [HTTP_UNPROCESSABLE]: "This text can't be used. Try rephrasing it.",
  [HTTP_RATE_LIMITED]: 'Too many requests. Wait a moment and try again.',
  [HTTP_BAD_GATEWAY]: 'The generation service is unavailable right now. Try again shortly.',
};

const NETWORK_ERROR_COPY = 'Could not reach the server. Check your connection and try again.';
const CONNECTION_LOST_COPY =
  'We lost the connection to this job. If it finishes, it will appear in History.';
const GENERIC_FAILURE_COPY = 'Generation failed. Please try again.';

export interface MediaErrorInput {
  status?: number | null;
  /** Server message; shown for 400 because it names the offending field. */
  message?: string | null;
  reason?: NoChargeReason;
  noCharge?: boolean;
}

export interface MappedMediaError {
  message: string;
  /** True when the copy promises the user was not charged. */
  noCharge: boolean;
}

/** Maps an HTTP status or a no-charge job failure to the copy the UI shows. */
export function mapMediaError(input: MediaErrorInput): MappedMediaError {
  if (input.reason || input.noCharge) {
    const reasonCopy = input.reason ? NO_CHARGE_REASON_COPY[input.reason] : GENERIC_FAILURE_COPY;
    return { message: `${reasonCopy} ${NO_CHARGE_SENTENCE}`, noCharge: true };
  }
  const status = input.status;
  if (status === null || status === undefined) {
    return {
      message: `${NETWORK_ERROR_COPY} ${NO_CHARGE_SENTENCE}`,
      noCharge: true,
    };
  }
  if (status === HTTP_INSUFFICIENT_CREDITS) {
    return { message: 'You need more credits to run this.', noCharge: true };
  }
  const base =
    (status === HTTP_BAD_REQUEST && input.message) || STATUS_COPY[status] || GENERIC_FAILURE_COPY;
  return { message: `${base} ${NO_CHARGE_SENTENCE}`, noCharge: true };
}

export type MediaJobState =
  | { phase: 'idle' }
  | { phase: 'submitting' }
  | { phase: 'queued' }
  | { phase: 'running'; stage: MediaJobStage; elapsedMs: number }
  | { phase: 'succeeded'; asset: MediaAssetDto; credits?: number }
  | {
      phase: 'failed';
      message: string;
      noCharge: boolean;
      reason?: NoChargeReason;
    }
  | { phase: 'rejected'; message: string }
  | { phase: 'insufficient'; required: number; available: number };

type MediaJobPhase = MediaJobState['phase'];

const ACTIVE_PHASES: readonly MediaJobPhase[] = ['submitting', 'queued', 'running'];

interface SubmittedRequest {
  path: string;
  body: Record<string, unknown>;
}

interface PaidResponseBody {
  code?: string;
  message?: string;
  required?: number;
  available?: number;
}

/** The one state machine every media surface drives; surfaces never write their own SSE or fetch code. */
export function useMediaJob() {
  const dialogStore = useDialogStore();
  const historyStore = useHistoryStore();
  const userStore = useUserStore();

  const state = ref<MediaJobState>({ phase: 'idle' });
  const progressUrl = ref('');
  let lastRequest: SubmittedRequest | null = null;
  let lastJobId = '';

  const { open, close, data, error } = useEventSource(progressUrl, [], {
    immediate: false,
    autoReconnect: false,
  });

  const isBusy = computed(() => ACTIVE_PHASES.includes(state.value.phase));

  function stopListening() {
    close();
  }

  function applyProgress(status: JobStatus) {
    if (status.status === 'processing' && status.stage && state.value.phase !== 'submitting') {
      state.value =
        status.stage === 'queued'
          ? { phase: 'queued' }
          : {
              phase: 'running',
              stage: status.stage,
              elapsedMs: status.elapsedMs ?? 0,
            };
    }
  }

  function applyCompleted(status: JobStatus) {
    stopListening();
    if (status.userCreditsRemaining !== null && status.userCreditsRemaining !== undefined) {
      userStore.setCredits(status.userCreditsRemaining);
    }
    const asset = status.asset;
    if (!asset) {
      log.error('completed status carried no asset', { jobId: lastJobId });
      state.value = {
        phase: 'failed',
        message: GENERIC_FAILURE_COPY,
        noCharge: false,
      };
      return;
    }
    if (asset.saved && !historyStore.mediaAssets.some((item) => item.id === asset.id)) {
      historyStore.mediaAssets.unshift(asset);
    }
    state.value = { phase: 'succeeded', asset, credits: status.credits };
  }

  function applyFailed(status: JobStatus) {
    stopListening();
    const isNoCharge = Boolean(status.noCharge || status.reason);
    state.value = {
      phase: 'failed',
      message: isNoCharge
        ? mapMediaError({ reason: status.reason, noCharge: true }).message
        : (status.message ?? GENERIC_FAILURE_COPY),
      noCharge: isNoCharge,
      reason: status.reason,
    };
  }

  watch(data, (raw) => {
    if (!raw) return;
    const status = JSON.parse(raw) as JobStatus;
    if (status.status === 'completed') applyCompleted(status);
    else if (status.status === 'error') applyFailed(status);
    else applyProgress(status);
  });

  watch(error, (streamError) => {
    if (!streamError || !isBusy.value) return;
    log.error('progress stream error', {
      jobId: lastJobId,
      error: streamError,
    });
    stopListening();
    state.value = {
      phase: 'failed',
      message: CONNECTION_LOST_COPY,
      noCharge: false,
    };
  });

  function reject(status: number | null, response: PaidResponseBody | null) {
    stopListening();
    if (status === HTTP_INSUFFICIENT_CREDITS) {
      const required = response?.required ?? 0;
      const available = response?.available ?? 0;
      state.value = { phase: 'insufficient', required, available };
      dialogStore.showLowCredits({ required, available });
      return;
    }
    state.value = {
      phase: 'rejected',
      message: mapMediaError({ status, message: response?.message }).message,
    };
  }

  async function send(request: SubmittedRequest) {
    lastRequest = request;
    lastJobId = uuidv4();
    state.value = { phase: 'submitting' };
    progressUrl.value = `${import.meta.env.VITE_API_BASEPATH}/progress?jobId=${lastJobId}`;
    // Opened before the POST like the image flow, so a fast job cannot finish unheard.
    open();

    const { data: response, statusCode } = await useFetch(
      request.path,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', mode: 'cors' },
        body: JSON.stringify({ ...request.body, jobId: lastJobId }),
      },
      { updateDataOnError: true },
    ).json<PaidResponseBody>();

    const status = statusCode.value;
    if (status === null || status < 200 || status >= 300) {
      log.warn('media submit rejected', {
        path: request.path,
        status,
        jobId: lastJobId,
      });
      reject(status, response.value);
      return;
    }
    if (state.value.phase === 'submitting') state.value = { phase: 'queued' };
  }

  /** Ignored while a job is in flight, which is what makes a second click a no-op. */
  async function submit(path: string, body: Record<string, unknown>) {
    if (isBusy.value) return;
    await send({ path, body });
  }

  /** Same inputs, new job id. */
  async function retry() {
    if (isBusy.value || !lastRequest) return;
    await send(lastRequest);
  }

  function reset() {
    stopListening();
    state.value = { phase: 'idle' };
  }

  onBeforeUnmount(stopListening);

  return { state, isBusy, submit, retry, reset };
}
