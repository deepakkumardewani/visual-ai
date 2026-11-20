import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { PRICING_FAQS } from '@/utils/constants';
import PricingLayout from '@/components/Pricing/PricingLayout.vue';

const board = [{ id: 'board' }];
const packs = [{ id: 'pack' }];

vi.mock('@/composables/usePricingCatalog', () => ({
  usePricingCatalog: () => ({ pricingBoard: board, creditPacks: packs }),
}));

const stub = (name: string) => ({
  props: ['packs', 'board', 'faqs', 'heading'],
  template: `<div data-stub="${name}" />`,
});
const stubs = {
  PricingHero: stub('hero'),
  PricingComparison: stub('comparison'),
  PricingProCard: stub('pro'),
  PricingPacks: stub('packs'),
  PricingCreditStory: stub('story'),
  PricingModelCosts: stub('costs'),
  FaqSection: stub('faq'),
};

describe('PricingLayout', () => {
  const mountLayout = () => mount(PricingLayout, { global: { stubs } });

  it('renders every section in order with the FAQ last', () => {
    const order = mountLayout()
      .findAll('[data-stub]')
      .map((el) => el.attributes('data-stub'));
    expect(order).toEqual(['hero', 'comparison', 'pro', 'packs', 'story', 'costs', 'faq']);
  });

  it('passes catalog data to packs and model costs', () => {
    const wrapper = mountLayout();
    expect(wrapper.findComponent(stubs.PricingPacks).props('packs')).toEqual(packs);
    expect(wrapper.findComponent(stubs.PricingModelCosts).props('board')).toEqual(board);
  });

  it('serves the pricing FAQs with <br> converted to paragraph breaks', () => {
    const faq = mountLayout().findComponent(stubs.FaqSection);
    const served = faq.props('faqs') as { question: string; answer: string }[];
    expect(faq.props('heading')).toBe('Before you buy.');
    expect(served.map((f) => f.question)).toEqual(PRICING_FAQS.map((f) => f.question));
    expect(served.some((f) => /<br/i.test(f.answer))).toBe(false);
    const withBreak = PRICING_FAQS.findIndex((f) => /<br/i.test(f.answer));
    expect(withBreak).toBeGreaterThanOrEqual(0);
    expect(served[withBreak].answer).toContain('\n\n');
  });
});
