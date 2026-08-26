import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ModelPickerTrigger from '@/components/Dashboard/ModelPicker/ModelPickerTrigger.vue';
import { FLUX_MODES } from '@/utils/models';

describe('ModelPickerTrigger', () => {
  it('renders selected model title and provider icon', () => {
    const wrapper = mount(ModelPickerTrigger, {
      props: { model: FLUX_MODES[0], open: false },
    });

    expect(wrapper.get('[data-testid="model-picker-trigger"]').text()).toContain('Flux Lightning');
    expect(wrapper.get('img').attributes('alt')).toContain('Flux Lightning');
  });

  it('shows premium tier badge for premium models', () => {
    const wrapper = mount(ModelPickerTrigger, {
      props: { model: FLUX_MODES[2], open: false },
    });

    expect(wrapper.text()).toContain('Premium');
  });
});
