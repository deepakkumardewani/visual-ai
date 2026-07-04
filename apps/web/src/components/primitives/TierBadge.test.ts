import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import TierBadge from '@/components/primitives/TierBadge.vue';

describe('TierBadge', () => {
  it('renders all tier labels', () => {
    const budget = mount(TierBadge, { props: { tier: 'budget' } });
    const standard = mount(TierBadge, { props: { tier: 'standard' } });
    const premium = mount(TierBadge, { props: { tier: 'premium' } });

    expect(budget.text()).toBe('Budget');
    expect(standard.text()).toBe('Standard');
    expect(premium.text()).toBe('Premium');
  });

  it('uses gold gradient styling for premium tier', () => {
    const wrapper = mount(TierBadge, { props: { tier: 'premium' } });
    expect(wrapper.classes().join(' ')).toContain('tw-bg-gradient-gold');
  });

  it('uses accent styling for standard tier', () => {
    const wrapper = mount(TierBadge, { props: { tier: 'standard' } });
    expect(wrapper.classes().join(' ')).toContain('tw-text-accent');
  });
});
