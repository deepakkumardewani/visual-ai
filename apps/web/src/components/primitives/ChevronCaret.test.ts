import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ChevronCaret from '@/components/primitives/ChevronCaret.vue';

describe('ChevronCaret', () => {
  it('renders a boxed caret by default', () => {
    const wrapper = mount(ChevronCaret, {
      global: { stubs: { 'font-awesome-icon': true } },
    });
    const caret = wrapper.get('[data-testid="chevron-caret"]');
    expect(caret.classes().join(' ')).toContain('tw-h-6');
    expect(caret.classes().join(' ')).not.toContain('tw-rotate-180');
  });

  it('rotates when open', () => {
    const wrapper = mount(ChevronCaret, {
      props: { open: true },
      global: { stubs: { 'font-awesome-icon': true } },
    });
    expect(wrapper.get('[data-testid="chevron-caret"]').classes().join(' ')).toContain(
      'tw-rotate-180',
    );
  });

  it('uses the inline size when not boxed', () => {
    const wrapper = mount(ChevronCaret, {
      props: { boxed: false },
      global: { stubs: { 'font-awesome-icon': true } },
    });
    expect(wrapper.get('[data-testid="chevron-caret"]').classes().join(' ')).toContain('tw-h-4');
  });
});
