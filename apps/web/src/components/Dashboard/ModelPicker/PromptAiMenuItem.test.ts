import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PromptAiMenuItem from '@/components/Dashboard/ModelPicker/PromptAiMenuItem.vue';

const stubs = { 'font-awesome-icon': true };

describe('PromptAiMenuItem', () => {
  it('renders title and description', () => {
    const wrapper = mount(PromptAiMenuItem, {
      props: {
        icon: 'wand-magic-sparkles',
        title: 'Enhance prompt',
        description: 'Add more detail',
        testId: 'enhance-item',
      },
      global: { stubs },
    });

    expect(wrapper.get('[data-testid="enhance-item"]').text()).toContain('Enhance prompt');
    expect(wrapper.text()).toContain('Add more detail');
    expect(wrapper.get('button').attributes('role')).toBe('menuitem');
  });

  it('shows working state and disables when loading', () => {
    const wrapper = mount(PromptAiMenuItem, {
      props: {
        icon: 'wand-magic-sparkles',
        title: 'Enhance prompt',
        description: 'Add more detail',
        testId: 'enhance-item',
        loadingTestId: 'enhance-loading',
        loading: true,
        disabled: true,
      },
      global: { stubs },
    });

    expect(wrapper.get('[data-testid="enhance-loading"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Working…');
    expect(wrapper.get('button').attributes('disabled')).toBeDefined();
  });

  it('emits click', async () => {
    const wrapper = mount(PromptAiMenuItem, {
      props: {
        icon: 'plus',
        title: 'Save',
        description: 'Keep this prompt',
        testId: 'save-item',
      },
      global: { stubs },
    });

    await wrapper.get('[data-testid="save-item"]').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });
});
