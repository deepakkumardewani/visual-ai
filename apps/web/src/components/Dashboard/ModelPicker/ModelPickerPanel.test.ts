import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ModelPickerPanel from '@/components/Dashboard/ModelPicker/ModelPickerPanel.vue';
import { FLUX_MODES } from '@/utils/models';

describe('ModelPickerPanel', () => {
  it('renders Featured and All Models sections', () => {
    const wrapper = mount(ModelPickerPanel, {
      props: {
        models: FLUX_MODES,
        selectedModel: FLUX_MODES[0],
      },
      global: {
        stubs: {
          ModelOption: {
            props: ['model'],
            template: '<div data-testid="featured-option">{{ model.title }}</div>',
          },
          ModelCompanyGroup: {
            props: ['companyName'],
            template: '<div data-testid="company-group">{{ companyName }}</div>',
          },
        },
      },
    });

    expect(wrapper.get('[role="listbox"]').attributes('aria-label')).toBe('Select a model');
    expect(wrapper.text()).toContain('All Models');
    expect(wrapper.find('[data-testid="company-group"]').exists()).toBe(true);
  });

  it('emits selectModel from a company group', async () => {
    const wrapper = mount(ModelPickerPanel, {
      props: {
        models: FLUX_MODES,
        selectedModel: FLUX_MODES[0],
      },
      global: {
        stubs: {
          ModelOption: true,
          ModelCompanyGroup: {
            props: ['companyName', 'models'],
            template:
              '<button data-testid="company-group" @click="$emit(\'select-model\', models[0])">{{ companyName }}</button>',
          },
        },
      },
    });

    await wrapper.get('[data-testid="company-group"]').trigger('click');
    expect(wrapper.emitted('selectModel')?.[0]?.[0]).toEqual(
      expect.objectContaining({ id: expect.any(String) }),
    );
  });
});
