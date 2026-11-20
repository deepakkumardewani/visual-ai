import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PricingModelCosts from '@/components/Pricing/PricingModelCosts.vue';
import type { PricingBoardColumn } from '@/composables/usePricingCatalog';

const board: PricingBoardColumn[] = [
  {
    category: 'Image Generation',
    blurb: 'Make pictures',
    bands: [
      {
        title: 'Everyday generation',
        hint: 'Fast models',
        rows: [{ names: 'Alpha, Beta', cost: 1 }],
      },
      {
        title: 'Premium generation',
        rows: [
          { names: 'Gamma', cost: 5 },
          { names: 'Delta', cost: 3 },
          { names: '', cost: 4 },
        ],
      },
    ],
  },
  {
    category: 'Utilities',
    blurb: 'Fix pictures',
    bands: [{ title: 'Remove background', rows: [{ names: 'Cutout', cost: 2 }] }],
  },
];

function mountBoard(props: { board: PricingBoardColumn[] } = { board }) {
  return mount(PricingModelCosts, {
    props,
    global: {
      stubs: {
        CreditCostBadge: {
          props: ['cost'],
          template: '<span data-testid="badge">{{ cost }}</span>',
        },
        'font-awesome-icon': { template: '<i data-testid="coins" />' },
      },
    },
  });
}

describe('PricingModelCosts', () => {
  it('renders the section heading and one column per category', () => {
    const wrapper = mountBoard();
    expect(wrapper.get('h2').text()).toBe('Model Credit Costs');
    expect(wrapper.findAll('h3').map((h) => h.text())).toEqual(['Image Generation', 'Utilities']);
    expect(wrapper.text()).toContain('Make pictures');
  });

  it('renders nothing in the board for an empty catalog', () => {
    const wrapper = mountBoard({ board: [] });
    expect(wrapper.findAll('article')).toHaveLength(0);
  });

  it('shows a single-cost band with a badge, aria label, and no per-name chip', () => {
    const wrapper = mountBoard();
    const band = wrapper.findAll('.band')[0];
    expect(band.text()).toContain('Everyday generation');
    expect(band.text()).toContain('Fast models');
    expect(band.text()).toContain('Alpha, Beta');
    expect(band.find('.band__cost-chip').exists()).toBe(false);
    expect(band.get('[data-testid="badge"]').text()).toBe('1');
    expect(band.get('.band__rate').attributes('aria-label')).toBe('1 credits');
  });

  it('shows a split-cost band as a min-max range with per-row chips', () => {
    const wrapper = mountBoard();
    const band = wrapper.findAll('.band')[1];
    const rate = band.get('.band__rate');
    expect(rate.attributes('aria-label')).toBe('3–5 credits');
    expect(rate.text()).toBe('3–5');
    expect(band.find('[data-testid="badge"]').exists()).toBe(false);
    expect(band.find('[data-testid="coins"]').exists()).toBe(true);
    expect(band.findAll('.band__cost-chip').map((c) => c.text())).toEqual(['5', '3']);
  });

  it('omits the hint and skips rows without names', () => {
    const wrapper = mountBoard();
    const band = wrapper.findAll('.band')[1];
    expect(band.find('.band__hint').exists()).toBe(false);
    expect(band.findAll('.band__names')).toHaveLength(2);
  });
});
