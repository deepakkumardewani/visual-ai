import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Heading from '@/components/Dashboard/ModelPicker/Heading.vue';

describe('Heading', () => {
  it('renders the title prop', () => {
    const wrapper = mount(Heading, { props: { title: 'Featured models' } });
    expect(wrapper.text()).toBe('Featured models');
  });
});
