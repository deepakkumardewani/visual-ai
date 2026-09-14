import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import FeatureCta from '@/components/Dashboard/FeatureCta.vue';

const stubs = {
  'font-awesome-icon': true,
  CreditCostBadge: {
    props: ['cost'],
    template: '<span data-testid="credit-cost">{{ cost }}</span>',
  },
};

describe('FeatureCta', () => {
  it('renders label, cost, and test id', () => {
    const wrapper = mount(FeatureCta, {
      props: { label: 'Generate', cost: 4, testId: 'generate-cta' },
      global: { stubs },
    });

    expect(wrapper.get('[data-testid="generate-cta"]').text()).toContain('Generate');
    expect(wrapper.get('[data-testid="generate-cta"]').text()).toContain('4');
    expect(wrapper.get('button').attributes('disabled')).toBeUndefined();
  });

  it('shows Low credits when lowCredits is true', () => {
    const wrapper = mount(FeatureCta, {
      props: { label: 'Generate', cost: 8, testId: 'cta', lowCredits: true },
      global: { stubs },
    });

    expect(wrapper.text()).toContain('Low credits');
    expect(wrapper.get('button').attributes('title')).toBe('Needs 8 credits');
  });

  it('disables the button and hides the label while loading', () => {
    const wrapper = mount(FeatureCta, {
      props: { label: 'Generate', cost: 2, testId: 'cta', loading: true, disabled: true },
      global: { stubs },
    });

    expect(wrapper.get('button').attributes('disabled')).toBeDefined();
    expect(wrapper.get('button').attributes('aria-busy')).toBe('true');
    expect(wrapper.text()).not.toContain('Generate');
  });

  it('emits click when pressed', async () => {
    const wrapper = mount(FeatureCta, {
      props: { label: 'Colorize', cost: 2, testId: 'colorize-cta' },
      global: { stubs },
    });

    await wrapper.get('[data-testid="colorize-cta"]').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });
});
