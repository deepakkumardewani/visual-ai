import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import EngineMenu from '@/components/Dashboard/Composer/VoiceInput/EngineMenu.vue';

const stubs = { 'font-awesome-icon': true };

function mountMenu(
  props: Partial<{
    engine: 'web-speech' | 'grok';
    webSpeechSupported: boolean;
    disabled: boolean;
    menuDisabled: boolean;
  }> = {},
) {
  return mount(EngineMenu, {
    props: {
      engine: 'grok',
      webSpeechSupported: true,
      disabled: false,
      menuDisabled: false,
      ...props,
    },
    global: { stubs },
  });
}

describe('EngineMenu', () => {
  it('starts closed with aria-expanded false', () => {
    const wrapper = mountMenu();
    const trigger = wrapper.get('[data-testid="voice-engine-menu-trigger"]');
    expect(trigger.attributes('aria-expanded')).toBe('false');
    expect(wrapper.find('[data-testid="voice-engine-menu"]').exists()).toBe(false);
  });

  it('opens the menu on trigger click and sets aria-expanded', async () => {
    const wrapper = mountMenu();
    await wrapper.get('[data-testid="voice-engine-menu-trigger"]').trigger('click');
    expect(
      wrapper.get('[data-testid="voice-engine-menu-trigger"]').attributes('aria-expanded'),
    ).toBe('true');
    expect(wrapper.find('[data-testid="voice-engine-menu"]').exists()).toBe(true);
  });

  it('does not open the menu when menuDisabled is true', async () => {
    const wrapper = mountMenu({ menuDisabled: true });
    const trigger = wrapper.get('[data-testid="voice-engine-menu-trigger"]');
    expect(trigger.attributes('disabled')).toBeDefined();
    await trigger.trigger('click');
    expect(wrapper.find('[data-testid="voice-engine-menu"]').exists()).toBe(false);
  });

  it('ignores toggleMenu when menuDisabled even if the trigger receives a click', async () => {
    const wrapper = mountMenu({ menuDisabled: true });
    const trigger = wrapper.get('[data-testid="voice-engine-menu-trigger"]');
    trigger.element.removeAttribute('disabled');
    await trigger.trigger('click');
    expect(wrapper.find('[data-testid="voice-engine-menu"]').exists()).toBe(false);
  });

  it('shows unsupported Web Speech label when the API is unavailable', async () => {
    const wrapper = mountMenu({ webSpeechSupported: false });
    await wrapper.get('[data-testid="voice-engine-menu-trigger"]').trigger('click');
    expect(wrapper.get('[data-testid="voice-engine-web-speech"]').text()).toContain(
      'Not supported in this browser',
    );
  });

  it('disables Web Speech when unsupported or busy', async () => {
    const unsupported = mountMenu({ webSpeechSupported: false });
    await unsupported.get('[data-testid="voice-engine-menu-trigger"]').trigger('click');
    expect(
      unsupported.get('[data-testid="voice-engine-web-speech"]').attributes('disabled'),
    ).toBeDefined();

    const busy = mountMenu({ disabled: true });
    await busy.get('[data-testid="voice-engine-menu-trigger"]').trigger('click');
    expect(
      busy.get('[data-testid="voice-engine-web-speech"]').attributes('disabled'),
    ).toBeDefined();
    expect(busy.get('[data-testid="voice-engine-grok"]').attributes('disabled')).toBeDefined();
  });

  it('does not emit when choosing unsupported Web Speech', async () => {
    const wrapper = mountMenu({ webSpeechSupported: false });
    await wrapper.get('[data-testid="voice-engine-menu-trigger"]').trigger('click');
    const item = wrapper.get('[data-testid="voice-engine-web-speech"]');
    item.element.removeAttribute('disabled');
    await item.trigger('click');
    expect(wrapper.emitted('update:engine')).toBeUndefined();
    expect(wrapper.find('[data-testid="voice-engine-menu"]').exists()).toBe(true);
  });

  it('shows the supported Web Speech label when the API is available', async () => {
    const wrapper = mountMenu({ webSpeechSupported: true });
    await wrapper.get('[data-testid="voice-engine-menu-trigger"]').trigger('click');
    expect(wrapper.get('[data-testid="voice-engine-web-speech"]').text()).toBe('Web Speech');
  });

  it('emits grok selection and closes the menu', async () => {
    const wrapper = mountMenu({ engine: 'web-speech' });
    await wrapper.get('[data-testid="voice-engine-menu-trigger"]').trigger('click');
    await wrapper.get('[data-testid="voice-engine-grok"]').trigger('click');
    expect(wrapper.emitted('update:engine')).toEqual([['grok']]);
    expect(wrapper.find('[data-testid="voice-engine-menu"]').exists()).toBe(false);
  });

  it('reflects aria-checked on the active engine', async () => {
    const wrapper = mountMenu({ engine: 'grok' });
    await wrapper.get('[data-testid="voice-engine-menu-trigger"]').trigger('click');
    expect(wrapper.get('[data-testid="voice-engine-grok"]').attributes('aria-checked')).toBe(
      'true',
    );
    expect(wrapper.get('[data-testid="voice-engine-web-speech"]').attributes('aria-checked')).toBe(
      'false',
    );
  });

  it('emits web-speech when supported and closes the menu', async () => {
    const wrapper = mountMenu({ engine: 'grok' });
    await wrapper.get('[data-testid="voice-engine-menu-trigger"]').trigger('click');
    await wrapper.get('[data-testid="voice-engine-web-speech"]').trigger('click');
    expect(wrapper.emitted('update:engine')).toEqual([['web-speech']]);
    expect(wrapper.find('[data-testid="voice-engine-menu"]').exists()).toBe(false);
  });

  it('does not emit grok when the menu is disabled via disabled prop', async () => {
    const wrapper = mountMenu({ disabled: true });
    await wrapper.get('[data-testid="voice-engine-menu-trigger"]').trigger('click');
    await wrapper.get('[data-testid="voice-engine-grok"]').trigger('click');
    expect(wrapper.emitted('update:engine')).toBeUndefined();
  });

  it('toggles the menu closed on a second trigger click', async () => {
    const wrapper = mountMenu();
    const trigger = wrapper.get('[data-testid="voice-engine-menu-trigger"]');
    await trigger.trigger('click');
    expect(wrapper.find('[data-testid="voice-engine-menu"]').exists()).toBe(true);
    await trigger.trigger('click');
    expect(wrapper.find('[data-testid="voice-engine-menu"]').exists()).toBe(false);
  });
});
