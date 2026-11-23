import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import StudioErrorState from '@/components/Studio/StudioErrorState.vue';
import { NO_CHARGE_SENTENCE } from '@/composables/useMediaJob';

describe('StudioErrorState', () => {
  it('says what happened and that no credits were used, as an alert', () => {
    const wrapper = mount(StudioErrorState, { props: { message: 'Generation failed.' } });

    expect(wrapper.attributes('role')).toBe('alert');
    expect(wrapper.text()).toContain('Generation failed.');
    expect(wrapper.text()).toContain('No credits were used.');
  });

  it('offers exactly one action with the default label', () => {
    const wrapper = mount(StudioErrorState, { props: { message: 'Failed.' } });

    expect(wrapper.findAll('button')).toHaveLength(1);
    expect(wrapper.get('button').text()).toBe('Try again');
  });

  it('uses a custom action label and emits action on click', async () => {
    const wrapper = mount(StudioErrorState, {
      props: { message: 'Failed.', actionLabel: 'Edit prompt' },
    });

    await wrapper.get('[data-testid="studio-error-action"]').trigger('click');

    expect(wrapper.get('button').text()).toBe('Edit prompt');
    expect(wrapper.emitted('action')).toHaveLength(1);
  });

  it('shows the no-charge sentence once when the message already carries it', () => {
    const wrapper = mount(StudioErrorState, {
      props: { message: `Moderated. ${NO_CHARGE_SENTENCE}` },
    });

    expect(wrapper.text().split(NO_CHARGE_SENTENCE)).toHaveLength(2);
  });

  it('omits the no-charge line when the failure was charged', () => {
    const wrapper = mount(StudioErrorState, { props: { message: 'Failed.', noCharge: false } });

    expect(wrapper.text()).not.toContain(NO_CHARGE_SENTENCE);
  });
});
