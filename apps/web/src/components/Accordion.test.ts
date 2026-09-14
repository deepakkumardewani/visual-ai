import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Accordion from '@/components/Accordion.vue';

describe('Accordion', () => {
  it('renders the title and starts closed by default', () => {
    const wrapper = mount(Accordion, {
      props: { title: 'How credits work', id: 'credits' },
      slots: { default: 'Fifty credits at signup.' },
    });

    expect(wrapper.text()).toContain('How credits work');
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('false');
  });

  it('opens when active and toggles on click', async () => {
    const wrapper = mount(Accordion, {
      props: { title: 'Billing', id: 'billing', active: true },
      slots: { default: 'Refunds are reviewed case by case.' },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('true');
    await wrapper.get('button').trigger('click');
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('false');
  });
});
