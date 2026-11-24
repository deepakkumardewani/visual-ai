import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import DraftToggle from '@/components/Video/DraftToggle.vue';

function mountToggle(saving: number, modelValue = false) {
  return mount(DraftToggle, {
    props: {
      saving,
      modelValue,
      'onUpdate:modelValue': (value: boolean) => wrapperUpdates.push(value),
    },
  });
}
const wrapperUpdates: boolean[] = [];

describe('DraftToggle', () => {
  it('shows the credit saving beside the label', () => {
    const wrapper = mountToggle(12);
    expect(wrapper.get('[data-testid="draft-saving"]').text()).toBe(
      'Lower quality, saves 12 credits',
    );
    expect(wrapper.text()).toContain('Draft preview');
  });

  it('uses the singular for a one credit saving', () => {
    expect(mountToggle(1).get('[data-testid="draft-saving"]').text()).toContain('saves 1 credit');
    expect(mountToggle(1).get('[data-testid="draft-saving"]').text()).not.toContain('credits');
  });

  it('is an accessible switch described by its saving text', () => {
    const input = mountToggle(5).get('input');
    expect(input.attributes('role')).toBe('switch');
    expect(input.attributes('aria-describedby')).toBe('draft-toggle-hint');
  });

  it('reflects the model value and emits when toggled', async () => {
    wrapperUpdates.length = 0;
    const wrapper = mountToggle(5, true);
    const input = wrapper.get('input');
    expect((input.element as HTMLInputElement).checked).toBe(true);
    await input.setValue(false);
    expect(wrapperUpdates).toEqual([false]);
  });
});
