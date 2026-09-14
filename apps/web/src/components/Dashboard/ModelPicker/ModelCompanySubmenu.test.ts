import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ModelCompanySubmenu from '@/components/Dashboard/ModelPicker/ModelCompanySubmenu.vue';
import { FLUX_MODES } from '@/utils/models';

describe('ModelCompanySubmenu', () => {
  it('renders company heading and model options', () => {
    const models = FLUX_MODES.slice(0, 2);
    const wrapper = mount(ModelCompanySubmenu, {
      props: {
        companyName: 'Black Forest Labs',
        models,
        selectedModel: models[0],
      },
      global: {
        stubs: {
          ModelOption: {
            props: ['model', 'selected'],
            template:
              '<button data-testid="model-option-stub" @click="$emit(\'select\', model)">{{ model.title }}</button>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Black Forest Labs models');
    expect(wrapper.findAll('[data-testid="model-option-stub"]')).toHaveLength(2);
  });

  it('forwards selectModel from a child option', async () => {
    const models = FLUX_MODES.slice(0, 2);
    const wrapper = mount(ModelCompanySubmenu, {
      props: {
        companyName: 'Black Forest Labs',
        models,
        selectedModel: models[0],
      },
      global: {
        stubs: {
          ModelOption: {
            props: ['model'],
            template:
              '<button data-testid="model-option-stub" @click="$emit(\'select\', model)">{{ model.title }}</button>',
          },
        },
      },
    });

    await wrapper.findAll('[data-testid="model-option-stub"]')[1].trigger('click');
    expect(wrapper.emitted('selectModel')?.[0]).toEqual([models[1]]);
  });
});
