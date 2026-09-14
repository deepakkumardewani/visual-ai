import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import FAQ from '@/components/FAQ.vue';

const faqs = [
  { question: 'Are credits free?', answer: 'Yes, daily credits refresh.', active: true },
  { question: 'Can I buy more?', answer: '<p>Yes, from Pricing.</p>' },
];

describe('FAQ', () => {
  it('renders an h2 heading by default', () => {
    const wrapper = mount(FAQ, { props: { faqs } });
    expect(wrapper.find('h2').text()).toBe('Frequently Asked Questions');
    expect(wrapper.find('h1').exists()).toBe(false);
  });

  it('renders an h1 heading when requested', () => {
    const wrapper = mount(FAQ, { props: { faqs, headingTag: 'h1' } });
    expect(wrapper.find('h1').text()).toBe('Frequently Asked Questions');
  });

  it('renders each FAQ and starts the active item open', async () => {
    const wrapper = mount(FAQ, { props: { faqs } });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Are credits free?');
    expect(wrapper.text()).toContain('Can I buy more?');
    expect(wrapper.text()).toContain('Yes, daily credits refresh.');
    const buttons = wrapper.findAll('button');
    expect(buttons[0].attributes('aria-expanded')).toBe('true');
    expect(buttons[1].attributes('aria-expanded')).toBe('false');
  });

  it('renders an empty list without accordions', () => {
    const wrapper = mount(FAQ, { props: { faqs: [] } });
    expect(wrapper.findAllComponents({ name: 'Accordion' })).toHaveLength(0);
    expect(wrapper.find('h2').exists()).toBe(true);
  });
});
