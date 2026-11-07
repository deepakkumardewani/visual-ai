import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import ModelOption from '@/components/Dashboard/ModelPicker/ModelOption.vue';
import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';
import { MODELS, FLUX_MODES, getModelBestForHint, getModelSpeedHint } from '@/utils/models';
import type { Model } from '@/types/model';
import { PLAN, PREMIUM_MODEL_KEYS, type ModelKey } from '@visual-ai/shared';

const premiumModel = MODELS.find((m) => m.id === 'GPT_IMAGE_2')!;
const PRO_BADGE = '[data-testid="premium-lock-badge"]';

const TABLE_KEYS = [
  'FLUX_REALISM',
  'FLUX_KONTEXT_PRO',
  'FLUX_KONTEXT_MAX',
  'IMAGEN_4_ULTRA',
  'NANO_BANANA_PRO',
  'GPT_IMAGE_2',
  'FLUX_2_PRO',
  'FLUX_1_1_PRO',
  'FLUX_2_MAX',
  'FLUX_PRO',
] as const;

describe('ModelOption lock per table key', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it.each(TABLE_KEYS)(
    '%s is locked for free exactly when it is Pro-only; Pro never locked',
    async (key) => {
      const model = MODELS.find((m) => m.id === key)!;
      expect(model).toBeDefined();
      const proOnly = PREMIUM_MODEL_KEYS.includes(key as ModelKey);

      const free = mount(ModelOption, { props: { model } });
      expect(free.find(PRO_BADGE).exists()).toBe(proOnly);
      await free.get('[data-testid="model-option"]').trigger('click');
      expect(free.emitted('select')?.length ?? 0).toBe(proOnly ? 0 : 1);
      expect(useDialogStore().showPricingDialog).toBe(proOnly);

      useUserStore().plan = PLAN.PRO;
      const pro = mount(ModelOption, { props: { model } });
      expect(pro.find(PRO_BADGE).exists()).toBe(false);
    },
  );
});

describe('ModelOption', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders model name, best-for hint, and cost badge with credit cost', () => {
    const model = FLUX_MODES[2];
    const wrapper = mount(ModelOption, { props: { model } });

    expect(wrapper.text()).toContain(model.title);
    expect(wrapper.text()).toContain(getModelBestForHint(model));
    expect(wrapper.text()).toContain(String(model.creditCost));
    expect(wrapper.text()).not.toContain('cr');
    const speedHint = getModelSpeedHint(model.id);
    if (speedHint) {
      expect(wrapper.text()).toContain(speedHint);
    }
    expect(wrapper.text()).not.toContain('Premium');
  });

  it('displays logo image when iconUrl is provided', () => {
    const model = FLUX_MODES[2]; // Has iconUrl
    const wrapper = mount(ModelOption, { props: { model } });

    const img = wrapper.find('img[alt*="logo"]');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBeDefined();
  });

  it('emits select on click', async () => {
    const wrapper = mount(ModelOption, { props: { model: FLUX_MODES[0] } });
    await wrapper.get('[data-testid="model-option"]').trigger('click');
    expect(wrapper.emitted('select')).toHaveLength(1);
  });

  it('shows the lock badge and data-locked for a premium model on the free plan', () => {
    const wrapper = mount(ModelOption, { props: { model: premiumModel } });
    expect(wrapper.find(PRO_BADGE).exists()).toBe(true);
    expect(wrapper.get('[data-testid="model-option"]').attributes('data-locked')).toBe('true');
  });

  it('opens pricing instead of selecting when a free user clicks a premium model', async () => {
    const wrapper = mount(ModelOption, { props: { model: premiumModel } });
    await wrapper.get('[data-testid="model-option"]').trigger('click');
    expect(useDialogStore().showPricingDialog).toBe(true);
    expect(wrapper.emitted('select')).toBeUndefined();
  });

  it('does not lock a premium model for a Pro user and selects it', async () => {
    useUserStore().plan = PLAN.PRO;
    const wrapper = mount(ModelOption, { props: { model: premiumModel } });
    expect(wrapper.find(PRO_BADGE).exists()).toBe(false);
    expect(wrapper.get('[data-testid="model-option"]').attributes('data-locked')).toBeUndefined();
    await wrapper.get('[data-testid="model-option"]').trigger('click');
    expect(wrapper.emitted('select')).toHaveLength(1);
    expect(useDialogStore().showPricingDialog).toBe(false);
  });

  it('never locks a non-premium model on the free plan', () => {
    const wrapper = mount(ModelOption, { props: { model: FLUX_MODES[0] } });
    expect(wrapper.find(PRO_BADGE).exists()).toBe(false);
  });

  it('falls back to the provider icon and 1 credit when there is no logo or cost', () => {
    const model = { ...FLUX_MODES[0], iconUrl: undefined, creditCost: undefined };
    const wrapper = mount(ModelOption, { props: { model } });
    expect(wrapper.find(`img[alt="${model.title} logo"]`).exists()).toBe(false);
    expect(wrapper.get('[aria-label="1 credits"]').text()).toBe('1');
  });

  it('marks the selected option with aria-selected', () => {
    const wrapper = mount(ModelOption, { props: { model: FLUX_MODES[0], selected: true } });
    expect(wrapper.get('[data-testid="model-option"]').attributes('aria-selected')).toBe('true');
  });

  it('omits the speed hint for a model without one', () => {
    const model = { ...FLUX_MODES[0], id: 'UNKNOWN_MODEL' } as unknown as Model;
    const wrapper = mount(ModelOption, { props: { model } });
    expect(wrapper.find('.tw-uppercase').exists()).toBe(false);
  });
});
