import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SegmentedControl from '@/components/primitives/SegmentedControl.vue';

describe('SegmentedControl', () => {
  const options = [
    { label: '1:1', value: '1:1' },
    { label: '16:9', value: '16:9' },
  ];

  it('renders options and highlights active value', () => {
    const wrapper = mount(SegmentedControl, {
      props: { modelValue: '1:1', options, label: 'Aspect' },
    });

    const active = wrapper.find('[aria-checked="true"]');
    expect(active.text()).toBe('1:1');
    expect(active.classes().join(' ')).toContain('tw-text-accent');
  });

  it('emits update:modelValue when selecting another option', async () => {
    const wrapper = mount(SegmentedControl, {
      props: { modelValue: '1:1', options },
    });

    await wrapper.findAll('button')[1].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['16:9']);
  });
});
