import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import StudioShell from '@/components/Studio/StudioShell.vue';

describe('StudioShell', () => {
  it('renders the compose column and tags the studio accent', () => {
    const wrapper = mount(StudioShell, {
      props: { studio: 'music' },
      slots: { default: '<p>compose</p>' },
    });

    expect(wrapper.get('[data-testid="studio-shell"]').attributes('data-studio')).toBe('music');
    expect(wrapper.get('[data-testid="studio-compose"]').text()).toBe('compose');
    expect(wrapper.find('[data-testid="studio-result"]').exists()).toBe(false);
  });

  it('renders the result column only when the result slot is provided', () => {
    const wrapper = mount(StudioShell, {
      props: { studio: 'speech' },
      slots: { default: 'compose', result: '<p>result</p>' },
    });

    expect(wrapper.get('[data-testid="studio-result"]').text()).toBe('result');
  });
});
