import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import DurationControl from '@/components/Music/DurationControl.vue';

const mountControl = (modelValue = 30) =>
  mount(DurationControl, { props: { modelValue, min: 5, max: 190 } });

describe('DurationControl', () => {
  it('passes the range to the slider and labels it', () => {
    const slider = mountControl().get('[data-testid="duration-slider"]');
    expect(slider.attributes('min')).toBe('5');
    expect(slider.attributes('max')).toBe('190');
    expect(slider.attributes('id')).toBe('music-duration');
  });

  it('exposes the value as spoken seconds', () => {
    const slider = mountControl(42).get('[data-testid="duration-slider"]');
    expect(slider.attributes('aria-valuetext')).toBe('42 seconds');
  });

  it('emits a number when the slider moves', async () => {
    const wrapper = mountControl();
    await wrapper.get('[data-testid="duration-slider"]').setValue('120');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([120]);
  });

  it('emits when the stepper increments', async () => {
    const wrapper = mountControl(30);
    const buttons = wrapper.findAll('button');
    await buttons[buttons.length - 1].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([31]);
  });

  it('states that longer clips cost the same', () => {
    expect(mountControl().text()).toContain('Longer is the same price');
  });
});
