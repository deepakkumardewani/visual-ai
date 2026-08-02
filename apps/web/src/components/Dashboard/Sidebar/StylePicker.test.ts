/**
 * Tests for StylePicker.vue component
 *
 * Verifies:
 * - Trigger shows the selected style label
 * - Opening the dropdown renders all style presets
 * - Selected style is marked; selection emits update and closes the dropdown
 *
 * Note: the dropdown panel is teleported to document.body (see Popover.vue),
 * so options are queried via a DOMWrapper over document.body rather than
 * the mounted wrapper's own subtree.
 */

import { DOMWrapper, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { STYLE_PRESETS } from '@visual-ai/shared';

import StylePicker from '@/components/Dashboard/Sidebar/StylePicker.vue';

let activeWrapper: ReturnType<typeof mount> | null = null;

function mountPicker(modelValue: string) {
  activeWrapper = mount(StylePicker, {
    attachTo: document.body,
    props: { modelValue },
  });
  return activeWrapper;
}

async function openPicker(wrapper: ReturnType<typeof mountPicker>) {
  await wrapper.find('[data-testid="style-picker"] button').trigger('click');
}

function body() {
  return new DOMWrapper(document.body);
}

afterEach(() => {
  activeWrapper?.unmount();
  activeWrapper = null;
  document.body.innerHTML = '';
});

describe('StylePicker', () => {
  it('shows the selected style label on the trigger', () => {
    const wrapper = mountPicker('dynamic');

    expect(wrapper.find('[data-testid="style-picker"]').text()).toContain('Dynamic');
  });

  it('renders all style presets once opened', async () => {
    const wrapper = mountPicker('dynamic');

    await openPicker(wrapper);

    STYLE_PRESETS.forEach((preset) => {
      expect(body().find(`[data-testid="style-${preset.id}"]`).exists()).toBe(true);
    });
  });

  it('marks the selected style with aria-selected=true', async () => {
    const wrapper = mountPicker('photography');

    await openPicker(wrapper);

    const selected = body().find('[data-testid="style-photography"]');
    expect(selected.attributes('aria-selected')).toBe('true');

    const unselected = body().find('[data-testid="style-anime"]');
    expect(unselected.attributes('aria-selected')).toBe('false');
  });

  it('emits update:modelValue when a style is selected', async () => {
    const wrapper = mountPicker('dynamic');

    await openPicker(wrapper);
    await body().find('[data-testid="style-portrait"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeDefined();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['portrait']);
  });

  it('has correct aria-label for accessibility', async () => {
    const wrapper = mountPicker('dynamic');

    await openPicker(wrapper);

    expect(body().find('[role="listbox"]').attributes('aria-label')).toBe('Style preset');
  });
});
