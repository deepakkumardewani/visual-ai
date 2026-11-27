import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

const requestEligibility = vi.fn();
vi.mock('@/utils/feedbackApi', () => ({
  requestEligibility: (...args: unknown[]) => requestEligibility(...args),
}));

import { useFeedbackStore } from '@/stores/feedback';
import { useGenerateStore } from '@/stores/generate';
import { useUserStore } from '@/stores/user';

async function flush() {
  await nextTick();
  await Promise.resolve();
  await Promise.resolve();
}

describe('feedback store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    requestEligibility.mockReset().mockResolvedValue(true);
    useUserStore().userId = 'user_1';
  });

  it('does nothing when signed out', async () => {
    useUserStore().userId = '';
    await useFeedbackStore().maybePrompt('generation');
    expect(requestEligibility).not.toHaveBeenCalled();
  });

  it('opens the popup when the server says eligible', async () => {
    const store = useFeedbackStore();
    await store.maybePrompt('generation');
    expect(requestEligibility).toHaveBeenCalledWith('generation');
    expect(store.popupOpen).toBe(true);
  });

  it('defers while generating and asks once idle', async () => {
    const generate = useGenerateStore();
    const store = useFeedbackStore();
    generate.isLoading = true;
    await store.maybePrompt('generation');
    expect(requestEligibility).not.toHaveBeenCalled();

    generate.isLoading = false;
    await flush();
    expect(requestEligibility).toHaveBeenCalledTimes(1);
    expect(store.popupOpen).toBe(true);
  });

  it('asks at most once per trigger, even after a failure or a no', async () => {
    requestEligibility.mockResolvedValue(false);
    const store = useFeedbackStore();
    await store.maybePrompt('download');
    await store.maybePrompt('download');
    expect(requestEligibility).toHaveBeenCalledTimes(1);
    expect(store.popupOpen).toBe(false);
  });

  it('can still ask for the other trigger after a no', async () => {
    requestEligibility.mockResolvedValue(false);
    const store = useFeedbackStore();
    await store.maybePrompt('generation');
    await store.maybePrompt('download');
    expect(requestEligibility).toHaveBeenCalledTimes(2);
  });

  it('stops asking once the prompt was claimed', async () => {
    const store = useFeedbackStore();
    await store.maybePrompt('generation');
    store.closePopup();
    await store.maybePrompt('download');
    expect(requestEligibility).toHaveBeenCalledTimes(1);
  });

  it('swallows request failures', async () => {
    requestEligibility.mockRejectedValue(new Error('boom'));
    const store = useFeedbackStore();
    await expect(store.maybePrompt('generation')).resolves.toBeUndefined();
    expect(store.popupOpen).toBe(false);
  });

  it('does not send a second request while one is in flight', async () => {
    let resolve!: (value: boolean) => void;
    requestEligibility.mockReturnValue(new Promise<boolean>((r) => (resolve = r)));
    const store = useFeedbackStore();
    const first = store.maybePrompt('generation');
    await store.maybePrompt('download');
    resolve(false);
    await first;
    expect(requestEligibility).toHaveBeenCalledTimes(1);
  });

  it('defers opening when a generation starts during the eligibility round-trip', async () => {
    let resolve!: (value: boolean) => void;
    requestEligibility.mockReturnValue(new Promise<boolean>((r) => (resolve = r)));
    const generate = useGenerateStore();
    const store = useFeedbackStore();
    const asking = store.maybePrompt('download');
    generate.isLoading = true;
    resolve(true);
    await asking;
    expect(store.popupOpen).toBe(false);

    generate.isLoading = false;
    await flush();
    expect(store.popupOpen).toBe(true);
    expect(requestEligibility).toHaveBeenCalledTimes(1);
  });
});
