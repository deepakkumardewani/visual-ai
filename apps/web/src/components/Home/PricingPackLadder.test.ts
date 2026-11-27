import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { CREDIT_PACKS, formatPrice } from '@visual-ai/shared';
import type { CreditPack } from '@visual-ai/shared';

import PricingPackLadder from '@/components/Home/PricingPackLadder.vue';

const formatUsd = (pack: CreditPack) => formatPrice(pack.prices.USD, 'USD');

describe('PricingPackLadder', () => {
  it('lists every pack in order with the popular third row marked', () => {
    const wrapper = mount(PricingPackLadder, {
      props: { packs: CREDIT_PACKS, formatPrice: formatUsd },
    });
    const rows = wrapper.findAll('li');

    expect(rows).toHaveLength(CREDIT_PACKS.length);
    expect(rows[0].text()).toContain('300 credits');
    expect(rows[0].text()).toContain('$5.00');
    expect(rows[2].classes()).toContain('ladder__row--popular');
    expect(rows[2].text()).toContain('Most popular');
    expect(wrapper.findAll('.ladder__tag')).toHaveLength(1);
  });

  it('keeps prices in the DOM but hidden while the currency is unknown', () => {
    const wrapper = mount(PricingPackLadder, {
      props: { packs: CREDIT_PACKS, formatPrice: formatUsd, pricesHidden: true },
    });

    for (const price of wrapper.findAll('.ladder__price')) {
      expect(price.classes()).toContain('ladder__price--pending');
    }
  });
});
