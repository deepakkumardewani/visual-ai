import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useFeatureSubmit } from '@/composables/useFeatureSubmit';
import { useGlobalShortcuts } from '@/composables/useGlobalShortcuts';
import { useAppStore } from '@/stores/app';
import { FeatureType } from '@/types';

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>();
  const { ref } = await import('vue');
  return {
    ...actual,
    useEventSource: () => ({
      event: ref(null),
      data: ref(null),
      status: ref('CLOSED'),
      error: ref(null),
      open: vi.fn(),
      close: vi.fn(),
    }),
  };
});

function mountShortcuts(featureId = FeatureType.IMAGE, canSubmit = true, submit = vi.fn()) {
  const wrapper = mount({
    setup() {
      useFeatureSubmit(featureId, { canSubmit: () => canSubmit, submit });
      useGlobalShortcuts();
      return {};
    },
    template: '<div />',
  });
  return { wrapper, submit };
}

describe('useGlobalShortcuts', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('submits the active feature on Cmd+Enter from the generate tab', () => {
    const { wrapper, submit } = mountShortcuts();
    const app = useAppStore();
    app.tab = 1;
    app.feature = FeatureType.IMAGE;

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', metaKey: true }));
    expect(submit).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('ignores generate shortcuts on other tabs', () => {
    const { wrapper, submit } = mountShortcuts();
    useAppStore().tab = 0;

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true }));
    expect(submit).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('focuses the composer textarea on / when not typing', () => {
    const textarea = document.createElement('textarea');
    textarea.dataset.testid = 'composer-textarea-input';
    document.body.appendChild(textarea);

    const { wrapper } = mountShortcuts();
    useAppStore().tab = 1;

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
    expect(document.activeElement).toBe(textarea);
    wrapper.unmount();
  });

  it('does not steal / while an input is focused', () => {
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');
    textarea.dataset.testid = 'composer-textarea-input';
    document.body.append(input, textarea);

    const { wrapper } = mountShortcuts();
    useAppStore().tab = 1;
    input.focus();

    const event = new KeyboardEvent('keydown', { key: '/', cancelable: true });
    Object.defineProperty(event, 'target', { value: input });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(input);
    wrapper.unmount();
  });

  it('submits on Ctrl+Enter using the event code when feature is empty', () => {
    const { wrapper, submit } = mountShortcuts();
    const app = useAppStore();
    app.tab = 1;
    app.feature = '' as never;

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', ctrlKey: true }));
    expect(submit).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('ignores slash shortcuts with modifier keys or when the composer is missing', () => {
    const { wrapper } = mountShortcuts();
    useAppStore().tab = 1;

    const withMeta = new KeyboardEvent('keydown', { key: '/', metaKey: true, cancelable: true });
    window.dispatchEvent(withMeta);
    expect(withMeta.defaultPrevented).toBe(false);

    const withAlt = new KeyboardEvent('keydown', { key: '/', altKey: true, cancelable: true });
    window.dispatchEvent(withAlt);
    expect(withAlt.defaultPrevented).toBe(false);

    const missingComposer = new KeyboardEvent('keydown', { key: '/', cancelable: true });
    window.dispatchEvent(missingComposer);
    expect(missingComposer.defaultPrevented).toBe(true);
    wrapper.unmount();
  });

  it('treats select, contenteditable, and nested editable nodes as typing targets', () => {
    const select = document.createElement('select');
    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    const nested = document.createElement('span');
    const parent = document.createElement('div');
    parent.setAttribute('contenteditable', 'true');
    parent.appendChild(nested);
    document.body.append(select, editable, parent);

    const { wrapper } = mountShortcuts();
    useAppStore().tab = 1;

    for (const target of [select, editable, nested]) {
      const event = new KeyboardEvent('keydown', { key: '/', cancelable: true });
      Object.defineProperty(event, 'target', { value: target });
      window.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }

    const nonElement = new KeyboardEvent('keydown', { key: '/', cancelable: true });
    Object.defineProperty(nonElement, 'target', { value: window });
    window.dispatchEvent(nonElement);
    expect(nonElement.defaultPrevented).toBe(true);
    wrapper.unmount();
  });
});
