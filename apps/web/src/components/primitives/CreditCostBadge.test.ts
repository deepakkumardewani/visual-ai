import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CreditCostBadge from '@/components/primitives/CreditCostBadge.vue';

describe('CreditCostBadge', () => {
  it('renders the credit cost', () => {
    const wrapper = mount(CreditCostBadge, {
      props: { cost: 3 },
      global: { stubs: { 'font-awesome-icon': true } },
    });
    expect(wrapper.text()).toContain('3');
    expect(wrapper.attributes('aria-label')).toBe('3 credits');
  });

  it('renders a zero cost', () => {
    const wrapper = mount(CreditCostBadge, {
      props: { cost: 0 },
      global: { stubs: { 'font-awesome-icon': true } },
    });
    expect(wrapper.attributes('aria-label')).toBe('0 credits');
  });
});
