import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import StudioEmptyState from '@/components/Studio/StudioEmptyState.vue';

const props = {
  title: 'Nothing yet',
  description: 'Describe a song to begin.',
  exampleLabel: 'Try an example',
};

describe('StudioEmptyState', () => {
  it('renders the title, description and one example action', () => {
    const wrapper = mount(StudioEmptyState, { props });

    expect(wrapper.get('h3').text()).toBe('Nothing yet');
    expect(wrapper.text()).toContain('Describe a song to begin.');
    expect(wrapper.findAll('button')).toHaveLength(1);
    expect(wrapper.get('button').text()).toBe('Try an example');
  });

  it('emits example when the action is clicked', async () => {
    const wrapper = mount(StudioEmptyState, { props });

    await wrapper.get('[data-testid="studio-empty-example"]').trigger('click');

    expect(wrapper.emitted('example')).toHaveLength(1);
  });
});
