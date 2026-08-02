/**
 * Tests for PromptEnhancePicker.vue component
 *
 * Verifies:
 * - Trigger shows the selected enhance mode label
 * - Opening the dropdown renders all three enhance modes with descriptions
 * - Selected mode is marked; selection emits update and closes the dropdown
 *
 * Note: the dropdown panel is teleported to document.body (see Popover.vue),
 * so options are queried via a DOMWrapper over document.body rather than
 * the mounted wrapper's own subtree.
 */

import { DOMWrapper, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ENHANCE_MODES, type EnhanceMode } from '@visual-ai/shared';

import PromptEnhancePicker from '@/components/Dashboard/Sidebar/PromptEnhancePicker.vue';

let activeWrapper: ReturnType<typeof mount> | null = null;

function mountPicker(modelValue: EnhanceMode) {
  activeWrapper = mount(PromptEnhancePicker, {
    attachTo: document.body,
    props: { modelValue },
  });
  return activeWrapper;
}

async function openPicker(wrapper: ReturnType<typeof mountPicker>) {
  await wrapper.find('[data-testid="prompt-enhance-picker"] button').trigger('click');
}

function body() {
  return new DOMWrapper(document.body);
}

afterEach(() => {
  activeWrapper?.unmount();
  activeWrapper = null;
  document.body.innerHTML = '';
});

describe('PromptEnhancePicker', () => {
  it('shows the selected mode label on the trigger', () => {
    const wrapper = mountPicker('auto');

    expect(wrapper.find('[data-testid="prompt-enhance-picker"]').text()).toContain('Auto');
  });

  it('renders all three enhance modes once opened', async () => {
    const wrapper = mountPicker('auto');

    await openPicker(wrapper);

    ENHANCE_MODES.forEach((mode) => {
      expect(body().find(`[data-testid="enhance-${mode}"]`).exists()).toBe(true);
    });
  });

  it('marks the selected mode with aria-selected=true', async () => {
    const wrapper = mountPicker('on');

    await openPicker(wrapper);

    const selected = body().find('[data-testid="enhance-on"]');
    expect(selected.attributes('aria-selected')).toBe('true');

    const unselected = body().find('[data-testid="enhance-off"]');
    expect(unselected.attributes('aria-selected')).toBe('false');
  });

  it('emits update:modelValue when a mode is selected', async () => {
    const wrapper = mountPicker('auto');

    await openPicker(wrapper);
    await body().find('[data-testid="enhance-off"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeDefined();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['off']);
  });

  it('has correct aria-label for accessibility', async () => {
    const wrapper = mountPicker('auto');

    await openPicker(wrapper);

    expect(body().find('[role="listbox"]').attributes('aria-label')).toBe('Prompt enhancement');
  });

  it('displays descriptive labels for each mode', async () => {
    const wrapper = mountPicker('auto');

    await openPicker(wrapper);

    expect(body().find('[data-testid="enhance-on"]').text()).toContain('On');
    expect(body().find('[data-testid="enhance-on"]').text()).toContain(
      'Prompts will always be refined to improve outputs.',
    );

    expect(body().find('[data-testid="enhance-off"]').text()).toContain('Off');
    expect(body().find('[data-testid="enhance-off"]').text()).toContain(
      'Prompts will not be modified.',
    );

    expect(body().find('[data-testid="enhance-auto"]').text()).toContain('Auto');
    expect(body().find('[data-testid="enhance-auto"]').text()).toContain(
      'Short prompts will be expanded. Long prompts will not be modified.',
    );
  });
});
