import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import Popover from '@/components/primitives/Popover.vue';

const PANEL = `
  <input data-testid="q" type="text" />
  <button type="button" data-testid="clear">Clear</button>
  <div role="option" tabindex="0" data-testid="o1">One</div>
  <div role="option" tabindex="0" data-testid="o2">Two</div>
  <div role="option" tabindex="0" data-testid="o3">Three</div>
`;

const byId = (id: string) => document.body.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]')!;
const press = (el: HTMLElement, key: string) => {
  el.focus();
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
};
const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe('Popover opt-in props', () => {
  let wrapper: VueWrapper | null = null;

  const open = async (props: Record<string, unknown>) => {
    wrapper = mount(Popover, {
      attachTo: document.body,
      props: { open: false, ...props },
      slots: { trigger: '<span>Open</span>', default: PANEL },
    });
    await wrapper.setProps({ open: true });
    await flush();
  };

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  describe('autofocusSelector', () => {
    it('focuses the element matching the selector on open', async () => {
      await open({ autofocusSelector: '[data-testid="q"]' });
      expect(document.activeElement).toBe(byId('q'));
    });

    it('falls back to the first default item when nothing matches', async () => {
      await open({ autofocusSelector: '.does-not-exist' });
      expect(document.activeElement).toBe(byId('clear'));
    });

    it('without the prop focuses the first button, as before', async () => {
      await open({});
      expect(document.activeElement).toBe(byId('clear'));
    });
  });

  describe('navigateOptionsFromInput', () => {
    it('focuses the first option on open when no selector is given (buttons are skipped)', async () => {
      await open({ navigateOptionsFromInput: true });
      expect(document.activeElement).toBe(byId('o1'));
    });

    it('ArrowDown from the input focuses the first option, skipping the clear button', async () => {
      await open({
        navigateOptionsFromInput: true,
        autofocusSelector: '[data-testid="q"]',
      });
      press(byId('q'), 'ArrowDown');
      expect(document.activeElement).toBe(byId('o1'));
    });

    it('ArrowDown/ArrowUp move across options and wrap', async () => {
      await open({ navigateOptionsFromInput: true });
      press(byId('o1'), 'ArrowDown');
      expect(document.activeElement).toBe(byId('o2'));
      press(byId('o2'), 'ArrowUp');
      expect(document.activeElement).toBe(byId('o1'));
      press(byId('o1'), 'ArrowUp');
      expect(document.activeElement).toBe(byId('o3'));
      press(byId('o3'), 'ArrowDown');
      expect(document.activeElement).toBe(byId('o1'));
    });

    it('Home and End jump to first and last option', async () => {
      await open({ navigateOptionsFromInput: true });
      press(byId('o2'), 'End');
      expect(document.activeElement).toBe(byId('o3'));
      press(byId('o3'), 'Home');
      expect(document.activeElement).toBe(byId('o1'));
    });

    it.each(['ArrowUp', 'Home', 'End'])(
      '%s inside the input keeps native behaviour (not prevented, focus stays)',
      async (key) => {
        await open({
          navigateOptionsFromInput: true,
          autofocusSelector: '[data-testid="q"]',
        });
        const event = new KeyboardEvent('keydown', {
          key,
          bubbles: true,
          cancelable: true,
        });
        byId('q').dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);
        expect(document.activeElement).toBe(byId('q'));
      },
    );

    it('Escape from the input still closes the popover', async () => {
      await open({
        navigateOptionsFromInput: true,
        autofocusSelector: '[data-testid="q"]',
      });
      press(byId('q'), 'Escape');
      await flush();
      expect(wrapper!.emitted('update:open')?.at(-1)).toEqual([false]);
    });

    it('does nothing when the panel has no options', async () => {
      wrapper = mount(Popover, {
        attachTo: document.body,
        props: { open: false, navigateOptionsFromInput: true },
        slots: { trigger: 'T', default: '<input data-testid="q2" />' },
      });
      await wrapper.setProps({ open: true });
      await flush();
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
      });
      dialog().querySelector('input')!.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe('defaults', () => {
    it('ArrowDown from the first button reaches the next default item including options', async () => {
      await open({});
      press(byId('clear'), 'ArrowDown');
      expect(document.activeElement).toBe(byId('o1'));
    });
  });
});
