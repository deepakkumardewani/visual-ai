import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';

import ModelPickerSheet from '@/components/Dashboard/ModelPicker/ModelPickerSheet.vue';
import { installMatchMedia } from '@/test/matchMediaMock';

const BACKDROP = '[data-testid="model-picker-sheet-backdrop"]';
const SHEET = '[data-testid="model-picker-sheet"]';

const Host = defineComponent({
  props: { open: { type: Boolean, default: false } },
  emits: ['close'],
  setup(props, { emit }) {
    return () =>
      h('div', [
        h('button', { id: 'trigger' }, 'trigger'),
        h(
          ModelPickerSheet,
          {
            open: props.open,
            label: 'Select a model',
            onClose: () => emit('close'),
          },
          () => [h('button', { id: 'first' }, 'first'), h('button', { id: 'last' }, 'last')],
        ),
      ]);
  },
});

describe('ModelPickerSheet', () => {
  let wrapper: VueWrapper | null = null;
  let media: ReturnType<typeof installMatchMedia>;

  beforeEach(() => {
    media = installMatchMedia();
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    media.restore();
    document.body.style.overflow = '';
    document.body.innerHTML = '';
  });

  function mountSheet(open: boolean) {
    // Real Transition so the animation classes are observable (VTU stubs it by default).
    wrapper = mount(Host, {
      props: { open },
      attachTo: document.body,
      global: { stubs: { transition: false } },
    });
    return wrapper;
  }

  it('renders nothing while closed', () => {
    mountSheet(false);
    expect(document.querySelector(BACKDROP)).toBeNull();
  });

  it('renders a labelled modal dialog with the slot content, teleported to body', async () => {
    const w = mountSheet(false);
    await w.setProps({ open: true });

    const sheet = document.body.querySelector(SHEET)!;
    expect(sheet.getAttribute('role')).toBe('dialog');
    expect(sheet.getAttribute('aria-modal')).toBe('true');
    expect(sheet.getAttribute('aria-label')).toBe('Select a model');
    expect(sheet.querySelector('#first')).not.toBeNull();
    expect(w.element.querySelector(SHEET)).toBeNull();
  });

  it('emits close when the backdrop itself is clicked', async () => {
    const w = mountSheet(true);
    await nextTick();
    document.body.querySelector<HTMLElement>(BACKDROP)!.click();
    expect(w.emitted('close')).toHaveLength(1);
  });

  it('does not close when the click lands inside the sheet', async () => {
    const w = mountSheet(true);
    await nextTick();
    document.body.querySelector<HTMLElement>('#first')!.click();
    document.body.querySelector<HTMLElement>(SHEET)!.click();
    expect(w.emitted('close')).toBeUndefined();
  });

  it('emits close on Escape while open', async () => {
    const w = mountSheet(true);
    await nextTick();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    expect(w.emitted('close')).toHaveLength(1);
  });

  it('ignores Escape while closed', () => {
    const w = mountSheet(false);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(w.emitted('close')).toBeUndefined();
  });

  it('locks body scroll while open and releases it on close', async () => {
    const w = mountSheet(false);
    expect(document.body.style.overflow).not.toBe('hidden');

    await w.setProps({ open: true });
    expect(document.body.style.overflow).toBe('hidden');

    await w.setProps({ open: false });
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('focuses the sheet itself on open so the on-screen keyboard stays down', async () => {
    const w = mountSheet(false);
    await w.setProps({ open: true });
    await nextTick();
    expect(document.activeElement).toBe(document.body.querySelector(SHEET));
  });

  it('returns focus to the previously focused element on close', async () => {
    const w = mountSheet(false);
    const trigger = (w.element as HTMLElement).querySelector<HTMLElement>('#trigger')!;
    trigger.focus();

    await w.setProps({ open: true });
    await nextTick();
    expect(document.activeElement).not.toBe(trigger);

    await w.setProps({ open: false });
    expect(document.activeElement).toBe(trigger);
  });

  it('does not restore focus to an element that left the document', async () => {
    const w = mountSheet(false);
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();

    await w.setProps({ open: true });
    await nextTick();
    outside.remove();
    await w.setProps({ open: false });

    expect(document.activeElement).not.toBe(outside);
  });

  it('has nothing to restore when the opener was not an HTML element', async () => {
    const w = mountSheet(false);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('tabindex', '0');
    document.body.appendChild(svg);
    svg.focus();

    await w.setProps({ open: true });
    await nextTick();
    await w.setProps({ open: false });

    expect(document.activeElement).not.toBe(svg);
    expect(w.emitted('close')).toBeUndefined();
  });

  it('traps Tab inside the sheet', async () => {
    const w = mountSheet(false);
    await w.setProps({ open: true });
    await nextTick();

    const sheet = document.body.querySelector<HTMLElement>(SHEET)!;
    const first = sheet.querySelector<HTMLElement>('#first')!;
    const last = sheet.querySelector<HTMLElement>('#last')!;
    // happy-dom has no layout, so offsetParent is null; give the trap measurable elements.
    for (const el of [first, last]) {
      Object.defineProperty(el, 'offsetParent', {
        value: sheet,
        configurable: true,
      });
    }

    last.focus();
    sheet.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(document.activeElement).toBe(first);
  });

  it('uses the transition css classes by default', async () => {
    const w = mountSheet(false);
    await w.setProps({ open: true });
    const backdrop = document.body.querySelector(BACKDROP)!;
    expect(backdrop.className).toContain('picker-sheet-enter');
  });

  it('disables the animation classes under reduced motion', async () => {
    media.setReducedMotion(true);
    const w = mountSheet(false);
    await w.setProps({ open: true });
    const backdrop = document.body.querySelector(BACKDROP)!;
    expect(backdrop.className).not.toContain('picker-sheet-enter');
    expect(backdrop.className).not.toContain('picker-sheet-leave');
  });
});
