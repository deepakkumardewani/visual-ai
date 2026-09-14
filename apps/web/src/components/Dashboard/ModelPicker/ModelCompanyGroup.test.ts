import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ModelCompanyGroup from '@/components/Dashboard/ModelPicker/ModelCompanyGroup.vue';
import { FLUX_MODES } from '@/utils/models';

describe('ModelCompanyGroup', () => {
  it('renders the company name', () => {
    const models = FLUX_MODES.slice(0, 2);
    const wrapper = mount(ModelCompanyGroup, {
      props: {
        companyName: 'Black Forest Labs',
        models,
        selectedModel: models[0],
      },
      global: {
        stubs: {
          ProviderIcon: true,
          ModelCompanySubmenu: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Black Forest Labs');
  });

  it('opens the submenu on hover and forwards selectModel', async () => {
    const models = FLUX_MODES.slice(0, 2);
    const wrapper = mount(ModelCompanyGroup, {
      props: {
        companyName: 'Black Forest Labs',
        models,
        selectedModel: models[0],
      },
      global: {
        stubs: {
          ProviderIcon: true,
          ModelCompanySubmenu: {
            props: ['companyName', 'models', 'selectedModel'],
            template:
              '<button data-testid="submenu-select" @click="$emit(\'select-model\', models[1])">submenu</button>',
          },
        },
      },
    });

    expect(wrapper.find('[data-testid="submenu-select"]').exists()).toBe(false);
    await wrapper.find('div').trigger('mouseenter');
    expect(wrapper.find('[data-testid="submenu-select"]').exists()).toBe(true);

    await wrapper.get('[data-testid="submenu-select"]').trigger('click');
    expect(wrapper.emitted('selectModel')?.[0]).toEqual([models[1]]);
  });
});
