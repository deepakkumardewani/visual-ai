import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import FeatureList from './FeatureList.vue';
import { INTRO_SLIDES } from './slides';

function mountList(activeIndex = 0) {
  return mount(FeatureList, { props: { slides: INTRO_SLIDES, activeIndex } });
}

describe('FeatureList', () => {
  it('renders one numbered button per slide', () => {
    const wrapper = mountList();
    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(10);
    expect(buttons[0].text()).toContain('1');
    expect(buttons[0].text()).toContain('New models');
    expect(buttons[9].text()).toContain('Remove background');
  });

  it('marks only the active item with aria-current', () => {
    const wrapper = mountList(3);
    const current = wrapper.findAll('[aria-current="true"]');
    expect(current).toHaveLength(1);
    expect(current[0].attributes('data-testid')).toBe('intro-feature-4');
  });

  it('emits select with the zero-based index when an item is clicked', async () => {
    const wrapper = mountList();
    await wrapper.get('[data-testid="intro-feature-7"]').trigger('click');
    expect(wrapper.emitted('select')).toEqual([[6]]);
  });

  it('renders nothing for an empty slide list', () => {
    const wrapper = mount(FeatureList, { props: { slides: [], activeIndex: 0 } });
    expect(wrapper.findAll('button')).toHaveLength(0);
  });
});
