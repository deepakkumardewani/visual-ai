import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PricingHero from '@/components/Pricing/PricingHero.vue';

const mountHero = () =>
  mount(PricingHero, {
    global: {
      stubs: {
        LandingButton: { template: '<a href="#comparison"><slot /></a>' },
      },
    },
  });

describe('PricingHero', () => {
  it('renders the Free-to-Pro title and compare CTA', () => {
    const wrapper = mountHero();

    expect(wrapper.find('h1').text()).toBe('Start free. Go further with Pro.');
    expect(wrapper.find('a').text()).toBe('Compare plans');
    expect(wrapper.find('a').attributes('href')).toBe('#comparison');
  });

  it('states signup, free daily and pro daily credit amounts', () => {
    const lede = mountHero().find('.hero__lede').text();

    expect(lede).toContain('30 persistent credits');
    expect(lede).toContain('30 new ones every day');
    expect(lede).toContain('Pro for 50 a day');
  });

  it('does not claim "Free Forever"', () => {
    const wrapper = mount(PricingHero, {
      global: {
        stubs: {
          LandingButton: { template: '<a href="#comparison"><slot /></a>' },
        },
      },
    });

    expect(wrapper.text()).not.toMatch(/free forever/i);
  });
});
