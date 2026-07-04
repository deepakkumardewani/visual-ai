import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ModelPickerTrigger from '@/components/Dashboard/ControlRail/ModelPickerTrigger.vue';
import { FLUX_MODES } from '@/utils/models';

describe('ModelPickerTrigger', () => {
  it('renders selected model title and provider icon', () => {
    const wrapper = mount(ModelPickerTrigger, {
      props: { model: FLUX_MODES[0], open: false },
    });

    expect(wrapper.get('[data-testid="model-picker-trigger"]').text()).toContain('Flux Lightening');
    expect(wrapper.find('[role="img"]').exists()).toBe(true);
  });

  it('shows premium tier badge for premium models', () => {
    const wrapper = mount(ModelPickerTrigger, {
      props: { model: FLUX_MODES[2], open: false },
    });

    expect(wrapper.text()).toContain('Premium');
  });
});
