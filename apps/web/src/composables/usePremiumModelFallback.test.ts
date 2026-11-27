import { PLAN, requiresPro } from '@visual-ai/shared';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import { usePremiumModelFallback } from '@/composables/usePremiumModelFallback';
import { useAppStore } from '@/stores/app';
import { DEFAULT_MODE, useAsideStore } from '@/stores/aside';
import { useUserStore } from '@/stores/user';
import { MODELS } from '@/utils/models';

const PREMIUM_MODEL = MODELS.find((m) => requiresPro(m.id))!;
const OPEN_MODEL = MODELS.find((m) => !requiresPro(m.id) && m.id !== DEFAULT_MODE.id)!;

function mountFallback() {
  return mount({
    setup() {
      usePremiumModelFallback();
      return {};
    },
    template: '<div />',
  });
}

describe('usePremiumModelFallback', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('keeps a premium model while the plan is still loading', async () => {
    useAsideStore().mode = PREMIUM_MODEL;
    mountFallback();
    await nextTick();
    expect(useAsideStore().mode.id).toBe(PREMIUM_MODEL.id);
  });

  it('swaps a premium model for the default once a free plan is known, with a toast', async () => {
    const aside = useAsideStore();
    const user = useUserStore();
    aside.mode = PREMIUM_MODEL;
    mountFallback();

    user.isReady = true;
    await nextTick();

    expect(aside.mode.id).toBe(DEFAULT_MODE.id);
    expect(useAppStore().snackbar).toBe(true);
    expect(useAppStore().snackbarText).toContain(PREMIUM_MODEL.title);
  });

  it('swaps a premium model set later, e.g. by a remix', async () => {
    const aside = useAsideStore();
    useUserStore().isReady = true;
    mountFallback();

    aside.mode = PREMIUM_MODEL;
    await nextTick();

    expect(aside.mode.id).toBe(DEFAULT_MODE.id);
  });

  it('leaves a Pro user on a premium model', async () => {
    const aside = useAsideStore();
    const user = useUserStore();
    user.plan = PLAN.PRO;
    user.isReady = true;
    aside.mode = PREMIUM_MODEL;
    mountFallback();
    await nextTick();

    expect(aside.mode.id).toBe(PREMIUM_MODEL.id);
  });

  it('leaves a free user on a non-premium model', async () => {
    const aside = useAsideStore();
    useUserStore().isReady = true;
    aside.mode = OPEN_MODEL;
    mountFallback();
    await nextTick();

    expect(aside.mode.id).toBe(OPEN_MODEL.id);
    expect(useAppStore().snackbar).toBe(false);
  });
});
