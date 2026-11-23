import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick, ref, type Ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { JobStatus, MediaAssetDto } from '@visual-ai/shared';

import { useDialogStore } from '@/stores/dialog';
import { useHistoryStore } from '@/stores/history';
import { useUserStore } from '@/stores/user';

import { useFetch } from '@/composables/useFetch';
import {
  mapMediaError,
  NO_CHARGE_SENTENCE,
  STAGE_COPY,
  useMediaJob,
} from '@/composables/useMediaJob';

const eventSource = vi.hoisted(() => ({
  open: vi.fn(),
  close: vi.fn(),
  data: null as unknown,
  error: null as unknown,
}));
let jobCounter = 0;

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>();
  return {
    ...actual,
    useEventSource: () => eventSource,
  };
});
vi.mock('uuid', () => ({ v4: () => `job-${(jobCounter += 1)}` }));
vi.mock('@/composables/useFetch', () => ({ useFetch: vi.fn() }));
vi.mock('@/utils/logger', () => ({
  createLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }),
}));

const PATH = '/generate/song';
const BODY = { prompt: 'lofi', modelKey: 'MINIMAX_MUSIC_26' };

const dataRef = () => eventSource.data as Ref<string | null>;
const errorRef = () => eventSource.error as Ref<unknown>;

const asset = (overrides: Partial<MediaAssetDto> = {}): MediaAssetDto => ({
  id: 'asset-1',
  type: 'audio',
  feature: 'song' as MediaAssetDto['feature'],
  modelKey: 'MINIMAX_MUSIC_26',
  title: 'Lofi',
  url: 'https://cdn.test/a.mp3',
  creditsCharged: 4,
  saved: true,
  ...overrides,
});

function mockPost(statusCode: number | null, body: unknown = null) {
  vi.mocked(useFetch).mockImplementation((() => ({
    json: async () => ({ data: { value: body }, statusCode: { value: statusCode } }),
  })) as unknown as typeof useFetch);
}

function mountJob() {
  let job!: ReturnType<typeof useMediaJob>;
  const wrapper = mount({
    setup() {
      job = useMediaJob();
      return {};
    },
    template: '<div />',
  });
  return { job, wrapper };
}

async function emit(status: Partial<JobStatus>) {
  dataRef().value = JSON.stringify(status);
  await nextTick();
}

describe('mapMediaError', () => {
  it.each([
    ['FAILED', 'Generation failed.'],
    ['CANCELED', 'The job was canceled.'],
    ['MODERATED', "This text can't be used. Try rephrasing it."],
    ['CONTENT_SAFETY', "This request can't be completed. Try rephrasing it."],
    ['TIMEOUT', 'Generation took too long.'],
    ['VOICE_UNAVAILABLE', 'This voice is no longer available. Re-clone it to keep using it.'],
  ] as const)('explains a %s no-charge reason and says nothing was charged', (reason, copy) => {
    expect(mapMediaError({ reason })).toEqual({
      message: `${copy} ${NO_CHARGE_SENTENCE}`,
      noCharge: true,
    });
  });

  it('uses generic copy for a no-charge failure without a reason', () => {
    expect(mapMediaError({ noCharge: true }).message).toBe(
      'Generation failed. Please try again. No credits were used.',
    );
  });

  it('prefers the reason over the status', () => {
    expect(mapMediaError({ reason: 'TIMEOUT', status: 400 }).message).toContain('took too long');
  });

  it('reports a network failure when there is no status', () => {
    const expected = `Could not reach the server. Check your connection and try again. ${NO_CHARGE_SENTENCE}`;
    expect(mapMediaError({ status: null }).message).toBe(expected);
    expect(mapMediaError({}).message).toBe(expected);
  });

  it('asks for more credits on 402 without the no-charge sentence', () => {
    expect(mapMediaError({ status: 402 })).toEqual({
      message: 'You need more credits to run this.',
      noCharge: true,
    });
  });

  it('shows the server message for 400 because it names the field', () => {
    expect(mapMediaError({ status: 400, message: 'lyrics too long' }).message).toBe(
      `lyrics too long ${NO_CHARGE_SENTENCE}`,
    );
  });

  it('falls back to the standard 400 copy without a server message', () => {
    expect(mapMediaError({ status: 400 }).message).toBe(
      `Some inputs need attention. Check them and try again. ${NO_CHARGE_SENTENCE}`,
    );
  });

  it.each([
    [422, "This text can't be used. Try rephrasing it."],
    [429, 'Too many requests. Wait a moment and try again.'],
    [502, 'The generation service is unavailable right now. Try again shortly.'],
    [500, 'Generation failed. Please try again.'],
  ])('maps status %i', (status, copy) => {
    expect(mapMediaError({ status, message: 'ignored' })).toEqual({
      message: `${copy} ${NO_CHARGE_SENTENCE}`,
      noCharge: true,
    });
  });
});

describe('STAGE_COPY', () => {
  it('labels every pipeline stage', () => {
    expect(STAGE_COPY).toEqual({
      queued: 'Queued',
      composing: 'Composing',
      mastering: 'Mastering',
      saving: 'Saving',
    });
  });
});

describe('useMediaJob', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.stubEnv('VITE_API_BASEPATH', 'https://api.test');
    jobCounter = 0;
    eventSource.open.mockClear();
    eventSource.close.mockClear();
    eventSource.data = ref<string | null>(null);
    eventSource.error = ref<unknown>(null);
    vi.mocked(useFetch).mockReset();
    mockPost(202);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('starts idle and not busy', () => {
    const { job } = mountJob();
    expect(job.state.value).toEqual({ phase: 'idle' });
    expect(job.isBusy.value).toBe(false);
  });

  describe('submit', () => {
    it('opens the progress stream before the POST and sends the job id in the body', async () => {
      const { job } = mountJob();
      await job.submit(PATH, BODY);

      const [path, init, options] = vi.mocked(useFetch).mock.calls[0] as unknown as [
        string,
        { method: string; headers: Record<string, string>; body: string },
        { updateDataOnError: boolean },
      ];
      expect(path).toBe(PATH);
      expect(init.method).toBe('POST');
      expect(init.headers['Content-Type']).toBe('application/json');
      expect(JSON.parse(init.body)).toEqual({ ...BODY, jobId: 'job-1' });
      expect(options).toEqual({ updateDataOnError: true });
      expect(eventSource.open.mock.invocationCallOrder[0]).toBeLessThan(
        vi.mocked(useFetch).mock.invocationCallOrder[0],
      );
      expect(job.state.value).toEqual({ phase: 'queued' });
      expect(job.isBusy.value).toBe(true);
    });

    it('is submitting while the POST is in flight', async () => {
      let release: () => void = () => undefined;
      vi.mocked(useFetch).mockImplementation((() => ({
        json: () =>
          new Promise((resolve) => {
            release = () => resolve({ data: { value: null }, statusCode: { value: 202 } });
          }),
      })) as unknown as typeof useFetch);
      const { job } = mountJob();

      const pending = job.submit(PATH, BODY);
      expect(job.state.value).toEqual({ phase: 'submitting' });
      expect(job.isBusy.value).toBe(true);
      release();
      await pending;
    });

    it('ignores a second submit while a job is in flight', async () => {
      const { job } = mountJob();
      await job.submit(PATH, BODY);
      await job.submit(PATH, { prompt: 'other' });

      expect(vi.mocked(useFetch)).toHaveBeenCalledTimes(1);
    });

    it('ignores progress that arrives before the POST returns and settles on queued', async () => {
      vi.mocked(useFetch).mockImplementation((() => ({
        json: async () => {
          await emit({ status: 'processing', stage: 'composing', elapsedMs: 10 });
          return { data: { value: null }, statusCode: { value: 202 } };
        },
      })) as unknown as typeof useFetch);
      const { job } = mountJob();

      await job.submit(PATH, BODY);

      expect(job.state.value).toEqual({ phase: 'queued' });
    });
  });

  describe('progress events', () => {
    it('moves to queued and running with the stage and elapsed time', async () => {
      const { job } = mountJob();
      await job.submit(PATH, BODY);

      await emit({ status: 'processing', stage: 'composing', elapsedMs: 1500 });
      expect(job.state.value).toEqual({ phase: 'running', stage: 'composing', elapsedMs: 1500 });

      await emit({ status: 'processing', stage: 'mastering' });
      expect(job.state.value).toEqual({ phase: 'running', stage: 'mastering', elapsedMs: 0 });

      await emit({ status: 'processing', stage: 'queued' });
      expect(job.state.value).toEqual({ phase: 'queued' });
    });

    it('ignores processing events without a stage and empty payloads', async () => {
      const { job } = mountJob();
      await job.submit(PATH, BODY);

      await emit({ status: 'processing' });
      dataRef().value = null;
      await nextTick();

      expect(job.state.value).toEqual({ phase: 'queued' });
    });

    it('does not move on from idle for stray events', async () => {
      const { job } = mountJob();
      await emit({ status: 'processing', stage: 'saving' });
      expect(job.state.value).toEqual({ phase: 'running', stage: 'saving', elapsedMs: 0 });
    });
  });

  describe('completion', () => {
    it('succeeds, closes the stream, updates credits and prepends a saved asset to history', async () => {
      const { job } = mountJob();
      const history = useHistoryStore();
      history.mediaAssets = [asset({ id: 'older' })];
      await job.submit(PATH, BODY);

      const done = asset();
      await emit({ status: 'completed', asset: done, credits: 4, userCreditsRemaining: 21 });

      expect(job.state.value).toEqual({ phase: 'succeeded', asset: done, credits: 4 });
      expect(job.isBusy.value).toBe(false);
      expect(eventSource.close).toHaveBeenCalled();
      expect(useUserStore().credits).toBe(21);
      expect(history.mediaAssets.map((item) => item.id)).toEqual(['asset-1', 'older']);
    });

    it('does not add the asset twice', async () => {
      const { job } = mountJob();
      const history = useHistoryStore();
      history.mediaAssets = [asset()];
      await job.submit(PATH, BODY);

      await emit({ status: 'completed', asset: asset(), userCreditsRemaining: 1 });

      expect(history.mediaAssets).toHaveLength(1);
    });

    it('keeps an unsaved asset out of history', async () => {
      const { job } = mountJob();
      await job.submit(PATH, BODY);

      await emit({
        status: 'completed',
        asset: asset({ saved: false }),
        userCreditsRemaining: 1,
      });

      expect(useHistoryStore().mediaAssets).toEqual([]);
      expect(job.state.value.phase).toBe('succeeded');
    });

    it('sets zero credits but leaves them alone when the server sends none', async () => {
      const { job } = mountJob();
      const user = useUserStore();
      user.credits = 9;
      await job.submit(PATH, BODY);

      await emit({ status: 'completed', asset: asset(), userCreditsRemaining: null });
      expect(user.credits).toBe(9);

      await emit({ status: 'completed', asset: asset({ id: 'x' }), userCreditsRemaining: 0 });
      expect(user.credits).toBe(0);
    });

    it('fails without a charge claim when the completed status has no asset', async () => {
      const { job } = mountJob();
      await job.submit(PATH, BODY);

      await emit({ status: 'completed', userCreditsRemaining: 5 });

      expect(job.state.value).toEqual({
        phase: 'failed',
        message: 'Generation failed. Please try again.',
        noCharge: false,
      });
    });
  });

  describe('failure events', () => {
    it('explains a no-charge failure by its reason', async () => {
      const { job } = mountJob();
      await job.submit(PATH, BODY);

      await emit({ status: 'error', noCharge: true, reason: 'TIMEOUT' });

      expect(job.state.value).toEqual({
        phase: 'failed',
        message: `Generation took too long. ${NO_CHARGE_SENTENCE}`,
        noCharge: true,
        reason: 'TIMEOUT',
      });
      expect(eventSource.close).toHaveBeenCalled();
    });

    it('treats a reason alone as no-charge', async () => {
      const { job } = mountJob();
      await job.submit(PATH, BODY);

      await emit({ status: 'error', reason: 'MODERATED' });

      expect(job.state.value).toMatchObject({ phase: 'failed', noCharge: true });
    });

    it('shows the server message for an ordinary error, then generic copy without one', async () => {
      const { job } = mountJob();
      await job.submit(PATH, BODY);

      await emit({ status: 'error', message: 'Model crashed' });
      expect(job.state.value).toEqual({
        phase: 'failed',
        message: 'Model crashed',
        noCharge: false,
        reason: undefined,
      });

      await emit({ status: 'error' });
      expect(job.state.value).toMatchObject({
        message: 'Generation failed. Please try again.',
        noCharge: false,
      });
    });
  });

  describe('stream errors', () => {
    it('fails with the lost-connection copy while a job is running', async () => {
      const { job } = mountJob();
      await job.submit(PATH, BODY);

      errorRef().value = new Event('error');
      await nextTick();

      expect(job.state.value).toEqual({
        phase: 'failed',
        message: 'We lost the connection to this job. If it finishes, it will appear in History.',
        noCharge: false,
      });
      expect(eventSource.close).toHaveBeenCalled();
    });

    it('ignores a stream error when no job is active', async () => {
      const { job } = mountJob();

      errorRef().value = new Event('error');
      await nextTick();

      expect(job.state.value).toEqual({ phase: 'idle' });
    });

    it('ignores a stream error that was cleared', async () => {
      const { job } = mountJob();
      await job.submit(PATH, BODY);
      errorRef().value = new Event('error');
      await nextTick();
      errorRef().value = null;
      await nextTick();

      expect(job.state.value.phase).toBe('failed');
    });
  });

  describe('rejected submissions', () => {
    it('shows the low-credits dialog with the shortfall on 402', async () => {
      mockPost(402, { required: 12, available: 3 });
      const { job } = mountJob();

      await job.submit(PATH, BODY);

      expect(job.state.value).toEqual({ phase: 'insufficient', required: 12, available: 3 });
      expect(useDialogStore().showLowCreditsDialog).toBe(true);
      expect(useDialogStore().lowCreditsShortfall).toEqual({ required: 12, available: 3 });
      expect(eventSource.close).toHaveBeenCalled();
    });

    it('defaults the shortfall to zero when a 402 has no body', async () => {
      mockPost(402, null);
      const { job } = mountJob();

      await job.submit(PATH, BODY);

      expect(job.state.value).toEqual({ phase: 'insufficient', required: 0, available: 0 });
    });

    it('rejects a 422 with moderation copy', async () => {
      mockPost(422, { code: 'PROMPT_REJECTED' });
      const { job } = mountJob();

      await job.submit(PATH, BODY);

      expect(job.state.value).toEqual({
        phase: 'rejected',
        message: `This text can't be used. Try rephrasing it. ${NO_CHARGE_SENTENCE}`,
      });
      expect(useDialogStore().showLowCreditsDialog).toBe(false);
    });

    it('surfaces the server message for a 400', async () => {
      mockPost(400, { message: 'lyrics too long' });
      const { job } = mountJob();

      await job.submit(PATH, BODY);

      expect(job.state.value).toEqual({
        phase: 'rejected',
        message: `lyrics too long ${NO_CHARGE_SENTENCE}`,
      });
    });

    it('reports a network failure when no status came back', async () => {
      mockPost(null, null);
      const { job } = mountJob();

      await job.submit(PATH, BODY);

      expect(job.state.value).toMatchObject({ phase: 'rejected' });
      expect((job.state.value as { message: string }).message).toContain('Could not reach');
    });

    it('treats a redirect-range status as a rejection', async () => {
      mockPost(304, null);
      const { job } = mountJob();

      await job.submit(PATH, BODY);

      expect(job.state.value.phase).toBe('rejected');
    });

    it('lets the user submit again after a rejection', async () => {
      mockPost(429, null);
      const { job } = mountJob();
      await job.submit(PATH, BODY);
      mockPost(202);

      await job.submit(PATH, BODY);

      expect(job.state.value).toEqual({ phase: 'queued' });
    });
  });

  describe('retry', () => {
    it('does nothing before any submission', async () => {
      const { job } = mountJob();
      await job.retry();
      expect(vi.mocked(useFetch)).not.toHaveBeenCalled();
    });

    it('does nothing while a job is in flight', async () => {
      const { job } = mountJob();
      await job.submit(PATH, BODY);
      await job.retry();
      expect(vi.mocked(useFetch)).toHaveBeenCalledTimes(1);
    });

    it('resends the same request under a new job id after a failure', async () => {
      const { job } = mountJob();
      await job.submit(PATH, BODY);
      await emit({ status: 'error', message: 'nope' });

      await job.retry();

      const calls = vi.mocked(useFetch).mock.calls as unknown as Array<[string, { body: string }]>;
      expect(calls).toHaveLength(2);
      expect(calls[1][0]).toBe(PATH);
      expect(JSON.parse(calls[1][1].body)).toEqual({ ...BODY, jobId: 'job-2' });
      expect(job.state.value).toEqual({ phase: 'queued' });
    });
  });

  describe('reset and teardown', () => {
    it('returns to idle and closes the stream', async () => {
      const { job } = mountJob();
      await job.submit(PATH, BODY);
      eventSource.close.mockClear();

      job.reset();

      expect(job.state.value).toEqual({ phase: 'idle' });
      expect(job.isBusy.value).toBe(false);
      expect(eventSource.close).toHaveBeenCalledTimes(1);
    });

    it('closes the stream when the component unmounts', async () => {
      const { job, wrapper } = mountJob();
      await job.submit(PATH, BODY);
      eventSource.close.mockClear();

      wrapper.unmount();

      expect(eventSource.close).toHaveBeenCalledTimes(1);
    });
  });
});
