import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import FaqSection from '@/components/Landing/FaqSection.vue';

describe('FaqSection', () => {
  it('renders the heading and toggles an item', async () => {
    const wrapper = mount(FaqSection, {
      props: {
        heading: 'Questions people ask',
        faqs: [
          { question: 'Are credits free?', answer: 'Yes, daily credits refresh.' },
          { question: 'Can I buy more?', answer: 'Yes, from Pricing.' },
        ],
      },
    });

    expect(wrapper.text()).toContain('Questions people ask');
    expect(wrapper.text()).toContain('Are credits free?');
    const first = wrapper.find('.faq__q');
    await first.trigger('click');
    expect(first.attributes('aria-expanded')).toBeDefined();
  });
});
