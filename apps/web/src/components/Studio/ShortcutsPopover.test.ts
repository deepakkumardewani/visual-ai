import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import { MEDIA_SHORTCUTS } from '@visual-ai/shared';

import ShortcutsPopover from '@/components/Studio/ShortcutsPopover.vue';
import { shortcutsHelpOpen } from '@/composables/useGlobalShortcuts';

let wrapper: VueWrapper | undefined;

const popover = () => document.querySelector('[data-testid="shortcuts-popover"]');

describe('ShortcutsPopover', () => {
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    shortcutsHelpOpen.value = false;
    document.body.innerHTML = '';
  });

  it('is not rendered while the help flag is closed', () => {
    wrapper = mount(ShortcutsPopover, { attachTo: document.body });

    expect(popover()).toBeNull();
  });

  it('lists every media shortcut with its key label and description when opened', async () => {
    wrapper = mount(ShortcutsPopover, { attachTo: document.body });

    shortcutsHelpOpen.value = true;
    await wrapper.vm.$nextTick();

    const text = popover()!.textContent ?? '';
    expect(text).toContain('Keyboard shortcuts');
    for (const shortcut of MEDIA_SHORTCUTS) {
      expect(text).toContain(shortcut.label);
      expect(text).toContain(shortcut.description);
    }
    expect(popover()!.querySelectorAll('kbd')).toHaveLength(MEDIA_SHORTCUTS.length);
  });

  it('closes on Escape', async () => {
    wrapper = mount(ShortcutsPopover, { attachTo: document.body });
    shortcutsHelpOpen.value = true;
    await wrapper.vm.$nextTick();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await wrapper.vm.$nextTick();

    expect(shortcutsHelpOpen.value).toBe(false);
  });
});
