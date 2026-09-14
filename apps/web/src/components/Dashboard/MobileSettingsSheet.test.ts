import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import MobileSettingsSheet from '@/components/Dashboard/MobileSettingsSheet.vue';

const stubs = { 'font-awesome-icon': true };

describe('MobileSettingsSheet', () => {
  it('does not render the dialog when closed', () => {
    const wrapper = mount(MobileSettingsSheet, {
      props: { modelValue: false },
      slots: { default: '<div data-testid="sheet-body">Settings body</div>' },
      global: { stubs },
    });

    expect(wrapper.find('[data-testid="mobile-settings-sheet"]').exists()).toBe(false);
  });

  it('renders title, slot, and close controls when open', () => {
    const wrapper = mount(MobileSettingsSheet, {
      props: { modelValue: true },
      slots: { default: '<div data-testid="sheet-body">Settings body</div>' },
      attachTo: document.body,
      global: { stubs },
    });

    const sheet = document.querySelector('[data-testid="mobile-settings-sheet"]');
    expect(sheet?.getAttribute('role')).toBe('dialog');
    expect(sheet?.textContent).toContain('Settings');
    expect(document.querySelector('[data-testid="sheet-body"]')?.textContent).toBe('Settings body');
    wrapper.unmount();
  });

  it('emits update:modelValue false when close or scrim is clicked', async () => {
    const wrapper = mount(MobileSettingsSheet, {
      props: { modelValue: true },
      attachTo: document.body,
      global: { stubs },
    });

    document.querySelector<HTMLButtonElement>('[data-testid="mobile-settings-close"]')?.click();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);

    document.querySelector<HTMLButtonElement>('[data-testid="mobile-settings-scrim"]')?.click();
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([false]);
    wrapper.unmount();
  });
});
