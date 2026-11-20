import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import TourPopover from './TourPopover.vue';

const base = { step: 2, total: 5, title: 'Pick a model', description: 'Choose how it looks.' };

function mountPopover(props = {}) {
  return mount(TourPopover, {
    props: { ...base, ...props },
    global: { stubs: { FontAwesomeIcon: true } },
  });
}

describe('TourPopover', () => {
  it('renders title, description and the "x / y" counter', () => {
    const wrapper = mountPopover();
    expect(wrapper.text()).toContain('Pick a model');
    expect(wrapper.text()).toContain('Choose how it looks.');
    expect(wrapper.get('[data-testid="tour-step-counter"]').text()).toBe('2 / 5');
  });

  it('exposes progress as an accessible progressbar', () => {
    const bar = mountPopover().get('[role="progressbar"]');
    expect(bar.attributes('aria-valuenow')).toBe('2');
    expect(bar.attributes('aria-valuemin')).toBe('1');
    expect(bar.attributes('aria-valuemax')).toBe('5');
    expect(bar.get('div').attributes('style')).toContain('width: 40%');
  });

  it('disables Previous on the first step only', () => {
    expect(
      mountPopover({ step: 1 }).get('[data-testid="tour-prev"]').attributes('disabled'),
    ).toBeDefined();
    expect(
      mountPopover({ step: 2 }).get('[data-testid="tour-prev"]').attributes('disabled'),
    ).toBeUndefined();
  });

  it('labels the primary button Next, then Finish on the last step', () => {
    expect(mountPopover().get('[data-testid="tour-next"]').attributes('aria-label')).toBe(
      'Next step',
    );
    expect(
      mountPopover({ step: 5 }).get('[data-testid="tour-next"]').attributes('aria-label'),
    ).toBe('Finish tour');
  });

  it('emits prev, next, skip and close from their buttons', async () => {
    const wrapper = mountPopover();
    await wrapper.get('[data-testid="tour-prev"]').trigger('click');
    await wrapper.get('[data-testid="tour-next"]').trigger('click');
    await wrapper.get('[data-testid="tour-skip"]').trigger('click');
    await wrapper.get('[data-testid="tour-close"]').trigger('click');
    expect(wrapper.emitted('prev')).toHaveLength(1);
    expect(wrapper.emitted('next')).toHaveLength(1);
    expect(wrapper.emitted('skip')).toHaveLength(1);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
