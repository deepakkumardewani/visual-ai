import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PricingComparison from '@/components/Pricing/PricingComparison.vue';
import { DAILY_CREDITS, HISTORY_CAP, PLAN } from '@visual-ai/shared';

const row = (planId: string, label: string) =>
  mount(PricingComparison)
    .get(`[data-testid="plan-${planId}"]`)
    .findAll('.plan__row')
    .find((r) => r.get('dt').text() === label)
    ?.get('dd')
    .text();

describe('PricingComparison', () => {
  it('renders a Free and a Pro column', () => {
    const wrapper = mount(PricingComparison);
    expect(wrapper.get(`[data-testid="plan-${PLAN.FREE}"]`).text()).toContain('Free');
    expect(wrapper.get(`[data-testid="plan-${PLAN.PRO}"]`).text()).toContain('Pro');
  });

  it('shows 30 and 50 daily credits', () => {
    expect(row(PLAN.FREE, 'Daily credits')).toBe('30 per day');
    expect(row(PLAN.PRO, 'Daily credits')).toBe('50 per day');
    expect(DAILY_CREDITS).toEqual({ free: 30, pro: 50 });
  });

  it('shows 100 and 500 history images', () => {
    expect(row(PLAN.FREE, 'History')).toBe('100 images');
    expect(row(PLAN.PRO, 'History')).toBe('500 images');
    expect(HISTORY_CAP).toEqual({ [PLAN.FREE]: 100, [PLAN.PRO]: 500 });
  });

  it('marks only the Pro column as featured', () => {
    const wrapper = mount(PricingComparison);
    expect(wrapper.get(`[data-testid="plan-${PLAN.PRO}"]`).classes()).toContain('plan--featured');
    expect(wrapper.get(`[data-testid="plan-${PLAN.FREE}"]`).classes()).not.toContain(
      'plan--featured',
    );
  });

  it('contrasts privacy and queue between the plans', () => {
    expect(row(PLAN.FREE, 'Privacy')).toContain('Explore');
    expect(row(PLAN.PRO, 'Privacy')).toContain('private');
    expect(row(PLAN.PRO, 'Queue')).toContain('Priority');
  });

  it('does not render the removed approximate-price note', () => {
    expect(mount(PricingComparison).text()).not.toContain('Approx. price');
  });
});
