import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ModelOption from '@/components/Dashboard/ModelPicker/ModelOption.vue';
import { getTierCreditLabel } from '@/utils/generationCredits';
import { FLUX_MODES, getModelBestForHint, getModelSpeedHint } from '@/utils/models';

describe('ModelOption', () => {
  it('renders model name, best-for hint, and cost badge without tier badge', () => {
    const model = FLUX_MODES[2];
    const wrapper = mount(ModelOption, { props: { model } });

    expect(wrapper.text()).toContain(model.title);
    expect(wrapper.text()).toContain(`Best for ${getModelBestForHint(model)}`);
    expect(wrapper.text()).toContain(getTierCreditLabel(model.tier));
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
});
