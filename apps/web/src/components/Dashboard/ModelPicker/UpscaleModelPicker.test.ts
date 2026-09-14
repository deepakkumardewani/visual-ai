import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import UpscaleModelPicker from '@/components/Dashboard/ModelPicker/UpscaleModelPicker.vue';
import { UPSCALER_MODELS } from '@/utils/models';

describe('UpscaleModelPicker', () => {
  it('renders the picker trigger', () => {
    const wrapper = mount(UpscaleModelPicker, {
      props: {
        models: UPSCALER_MODELS,
        selected: UPSCALER_MODELS[0],
        fallback: UPSCALER_MODELS[0],
      },
      global: {
        stubs: {
          Popover: {
            template: '<div><slot name="trigger" :open="false" /><slot /></div>',
          },
          ModelPickerTrigger: {
            props: ['model'],
            template: '<button data-testid="upscale-trigger">{{ model.title }}</button>',
          },
          ModelOption: {
            props: ['model'],
            template: '<button data-testid="upscale-option">{{ model.title }}</button>',
          },
        },
      },
    });

    expect(wrapper.get('[data-testid="upscale-model-picker"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="upscale-trigger"]').text()).toContain(
      UPSCALER_MODELS[0].title,
    );
  });

  it('emits update:selected when an option is chosen', async () => {
    const wrapper = mount(UpscaleModelPicker, {
      props: {
        models: UPSCALER_MODELS,
        selected: UPSCALER_MODELS[0],
        fallback: UPSCALER_MODELS[0],
      },
      global: {
        stubs: {
          Popover: {
            template: '<div><slot name="trigger" :open="true" /><slot /></div>',
          },
          ModelPickerTrigger: true,
          ModelOption: {
            props: ['model'],
            template:
              '<button :data-testid="`upscale-option-${model.id}`" @click="$emit(\'select\', model)">{{ model.title }}</button>',
          },
        },
      },
    });

    await wrapper.get(`[data-testid="upscale-option-${UPSCALER_MODELS[0].id}"]`).trigger('click');
    expect(wrapper.emitted('update:selected')?.[0]).toEqual([UPSCALER_MODELS[0]]);
  });
});
