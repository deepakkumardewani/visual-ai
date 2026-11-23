import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useFeatureSubmit } from '@/composables/useFeatureSubmit';
import { shortcutsHelpOpen, useGlobalShortcuts } from '@/composables/useGlobalShortcuts';
import { usePlayerStore } from '@/stores/player';
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

    const withMeta = new KeyboardEvent('keydown', {
      key: '/',
      metaKey: true,
      cancelable: true,
    });
    window.dispatchEvent(withMeta);
    expect(withMeta.defaultPrevented).toBe(false);

    const withAlt = new KeyboardEvent('keydown', {
      key: '/',
      altKey: true,
      cancelable: true,
    });
    window.dispatchEvent(withAlt);
    expect(withAlt.defaultPrevented).toBe(false);

    const missingComposer = new KeyboardEvent('keydown', {
      key: '/',
      cancelable: true,
    });
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
      const event = new KeyboardEvent('keydown', {
        key: '/',
        cancelable: true,
      });
      Object.defineProperty(event, 'target', { value: target });
      window.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }

    const nonElement = new KeyboardEvent('keydown', {
      key: '/',
      cancelable: true,
    });
    Object.defineProperty(nonElement, 'target', { value: window });
    window.dispatchEvent(nonElement);
    expect(nonElement.defaultPrevented).toBe(true);
    wrapper.unmount();
  });
});

describe('useGlobalShortcuts media keys', () => {
  function press(key: string, init: KeyboardEventInit = {}, target: Element = document.body) {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...init,
    });
    target.dispatchEvent(event);
    return event;
  }

  function mountWithTrack() {
    const { wrapper } = mountShortcuts();
    const player = usePlayerStore();
    player.track = { id: 't', title: 'T', src: 'https://cdn.test/t.mp3' };
    return { wrapper, player };
  }

  beforeEach(() => {
    setActivePinia(createPinia());
    document.body.innerHTML = '';
    shortcutsHelpOpen.value = false;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('opens the shortcuts help on ? even with no track loaded', () => {
    const { wrapper } = mountShortcuts();
    const event = press('?');

    expect(shortcutsHelpOpen.value).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    wrapper.unmount();
  });

  it('ignores player keys when no track is loaded', () => {
    const { wrapper } = mountShortcuts();
    const player = usePlayerStore();
    const toggle = vi.spyOn(player, 'toggle');

    for (const key of [' ', 'ArrowLeft', 'ArrowRight', 'm', 'l']) {
      expect(press(key).defaultPrevented).toBe(false);
    }
    expect(toggle).not.toHaveBeenCalled();
    expect(player.muted).toBe(false);
    wrapper.unmount();
  });

  it('toggles playback on Space from a neutral target', () => {
    const { wrapper, player } = mountWithTrack();
    const toggle = vi.spyOn(player, 'toggle').mockImplementation(() => undefined);

    const event = press(' ');

    expect(toggle).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    wrapper.unmount();
  });

  it('leaves Space to natively activating elements', () => {
    const { wrapper, player } = mountWithTrack();
    const toggle = vi.spyOn(player, 'toggle').mockImplementation(() => undefined);
    const button = document.createElement('button');
    const inner = document.createElement('span');
    button.appendChild(inner);
    const slider = document.createElement('div');
    slider.setAttribute('role', 'slider');
    document.body.append(button, slider);

    expect(press(' ', {}, inner).defaultPrevented).toBe(false);
    expect(press(' ', {}, slider).defaultPrevented).toBe(false);
    expect(toggle).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('seeks five seconds back and forward from the current time', () => {
    const { wrapper, player } = mountWithTrack();
    const seek = vi.spyOn(player, 'seek').mockImplementation(() => undefined);
    player.currentTime = 20;

    press('ArrowLeft');
    press('ArrowRight');

    expect(seek).toHaveBeenNthCalledWith(1, 15);
    expect(seek).toHaveBeenNthCalledWith(2, 25);
    wrapper.unmount();
  });

  it('leaves arrows to tablists and already-handled events', () => {
    const { wrapper, player } = mountWithTrack();
    const seek = vi.spyOn(player, 'seek').mockImplementation(() => undefined);
    const tablist = document.createElement('div');
    tablist.setAttribute('role', 'tablist');
    const tab = document.createElement('button');
    tab.setAttribute('role', 'tab');
    tablist.appendChild(tab);
    document.body.appendChild(tablist);

    expect(press('ArrowRight', {}, tab).defaultPrevented).toBe(false);

    const handled = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    document.body.addEventListener('keydown', (e) => e.preventDefault(), {
      once: true,
    });
    document.body.dispatchEvent(handled);

    expect(seek).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('flips mute and loop on m and l', () => {
    const { wrapper, player } = mountWithTrack();

    press('m');
    press('l');
    expect([player.muted, player.loop]).toEqual([true, true]);

    press('m');
    press('l');
    expect([player.muted, player.loop]).toEqual([false, false]);
    wrapper.unmount();
  });

  it('does not consume unrelated keys', () => {
    const { wrapper } = mountWithTrack();
    expect(press('x').defaultPrevented).toBe(false);
    wrapper.unmount();
  });

  it('ignores media keys while typing in a field', () => {
    const { wrapper, player } = mountWithTrack();
    const input = document.createElement('input');
    document.body.appendChild(input);

    expect(press('m', {}, input).defaultPrevented).toBe(false);
    expect(player.muted).toBe(false);
    wrapper.unmount();
  });

  it('ignores media keys while a modal dialog is open', () => {
    const { wrapper, player } = mountWithTrack();
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    document.body.appendChild(dialog);

    press('l');
    expect(player.loop).toBe(false);
    expect(press('?').defaultPrevented).toBe(false);
    expect(shortcutsHelpOpen.value).toBe(false);
    wrapper.unmount();
  });

  it.each([{ metaKey: true }, { ctrlKey: true }, { altKey: true }])(
    'ignores media keys combined with %o',
    (modifier) => {
      const { wrapper, player } = mountWithTrack();
      press('m', modifier);
      expect(player.muted).toBe(false);
      wrapper.unmount();
    },
  );

  it('stops listening after unmount', () => {
    const { wrapper, player } = mountWithTrack();
    wrapper.unmount();
    press('m');
    expect(player.muted).toBe(false);
  });
});
