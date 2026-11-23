import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { ref } from 'vue';

import type { MediaCostInput, MediaModelKey } from '@visual-ai/shared';

import { useMediaCost } from '@/composables/useMediaCost';
import { useUserStore } from '@/stores/user';

const RUN_INPUT: MediaCostInput = { kind: 'run' };
const SPEECH_INPUT: MediaCostInput = { kind: 'chars', chars: 2000 };
const VIDEO_INPUT: MediaCostInput = { kind: 'seconds', durationSec: 5, resolution: '720p' };

describe('useMediaCost', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('prices a flat run with the shared cost function', () => {
    const { cost, estimated } = useMediaCost({ modelKey: 'IMAGE_WATERMARK', input: RUN_INPUT });

    expect(cost.value).toBeGreaterThan(0);
    expect(Number.isInteger(cost.value)).toBe(true);
    expect(estimated.value).toBe(false);
  });

  it.each<MediaModelKey>(['MINIMAX_SPEECH_28_HD', 'MINIMAX_SPEECH_28_TURBO'])(
    'flags %s as an estimated cost',
    (modelKey) => {
      const { cost, estimated } = useMediaCost({ modelKey, input: SPEECH_INPUT });

      expect(cost.value).not.toBeNull();
      expect(estimated.value).toBe(true);
    },
  );

  it('flags P-Video as estimated only when audio driven', () => {
    const audioDriven = ref(false);
    const { estimated } = useMediaCost({
      modelKey: 'P_VIDEO',
      input: VIDEO_INPUT,
      audioDriven,
    });
    expect(estimated.value).toBe(false);

    audioDriven.value = true;
    expect(estimated.value).toBe(true);
  });

  it('does not flag P-Video as estimated when audioDriven is omitted', () => {
    const { estimated } = useMediaCost({ modelKey: 'P_VIDEO', input: VIDEO_INPUT });

    expect(estimated.value).toBe(false);
  });

  it('returns a null cost and cannot afford when the input does not fit the pricing unit', () => {
    useUserStore().setCredits(100000);
    const { cost, canAfford } = useMediaCost({ modelKey: 'IMAGE_WATERMARK', input: SPEECH_INPUT });

    expect(cost.value).toBeNull();
    expect(canAfford.value).toBe(false);
  });

  it('returns a null cost for a model that is not priced', () => {
    const { cost } = useMediaCost({
      modelKey: 'NOT_A_MODEL' as MediaModelKey,
      input: RUN_INPUT,
    });

    expect(cost.value).toBeNull();
  });

  it('sums daily and purchased credits into the balance', () => {
    const userStore = useUserStore();
    userStore.dailyCredits = 7;
    userStore.setCredits(5);
    const { balance } = useMediaCost({ modelKey: 'IMAGE_WATERMARK', input: RUN_INPUT });

    expect(balance.value).toBe(12);
  });

  it('treats missing balances as zero', () => {
    const userStore = useUserStore();
    (userStore as unknown as { dailyCredits: unknown }).dailyCredits = undefined;
    (userStore as unknown as { credits: unknown }).credits = undefined;
    const { balance } = useMediaCost({ modelKey: 'IMAGE_WATERMARK', input: RUN_INPUT });

    expect(balance.value).toBe(0);
  });

  it('reflects affordability at the exact cost boundary and reacts to model changes', () => {
    const userStore = useUserStore();
    const modelKey = ref<MediaModelKey>('IMAGE_WATERMARK');
    const input = ref<MediaCostInput>(RUN_INPUT);
    const { cost, canAfford } = useMediaCost({ modelKey, input });
    const price = cost.value as number;

    userStore.setCredits(price - 1);
    expect(canAfford.value).toBe(false);
    userStore.setCredits(price);
    expect(canAfford.value).toBe(true);

    modelKey.value = 'MINIMAX_SPEECH_28_HD';
    input.value = { kind: 'chars', chars: 100000 };
    expect(cost.value).toBeGreaterThan(price);
    userStore.setCredits(price);
    expect(canAfford.value).toBe(false);
  });

  it('accepts getters for model and input', () => {
    const { cost } = useMediaCost({ modelKey: () => 'IMAGE_WATERMARK', input: () => RUN_INPUT });

    expect(cost.value).toBeGreaterThan(0);
  });
});
