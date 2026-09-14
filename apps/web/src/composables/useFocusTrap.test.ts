import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';

import { useFocusTrap } from '@/composables/useFocusTrap';

function markFocusable(root: HTMLElement) {
  for (const el of root.querySelectorAll<HTMLElement>('button, input, a, textarea')) {
    Object.defineProperty(el, 'offsetParent', { configurable: true, get: () => document.body });
  }
}

function mountTrap(container: HTMLElement, active = ref(true)) {
  const containerRef = ref<HTMLElement | null>(container);
  const wrapper = mount({
    setup() {
      useFocusTrap(containerRef, active);
      return {};
    },
    template: '<div />',
  });
  return { wrapper, containerRef, active };
}

describe('useFocusTrap', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('focuses the first focusable element when activated', async () => {
    const container = document.createElement('div');
    const first = document.createElement('button');
    const last = document.createElement('button');
    first.textContent = 'Close';
    last.textContent = 'Save';
    container.append(first, last);
    markFocusable(container);
    document.body.appendChild(container);

    mountTrap(container);
    await nextTick();
    expect(document.activeElement).toBe(first);
  });

  it('wraps Tab from last to first and Shift+Tab from first to last', async () => {
    const container = document.createElement('div');
    const first = document.createElement('button');
    const last = document.createElement('button');
    container.append(first, last);
    markFocusable(container);
    document.body.appendChild(container);

    mountTrap(container);
    await nextTick();

    last.focus();
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(first);

    first.focus();
    container.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
    );
    expect(document.activeElement).toBe(last);
  });

  it('does not trap when inactive', async () => {
    const container = document.createElement('div');
    const first = document.createElement('button');
    container.append(first);
    markFocusable(container);
    document.body.appendChild(container);

    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();

    const active = ref(false);
    mountTrap(container, active);
    await nextTick();
    expect(document.activeElement).toBe(outside);

    active.value = true;
    await nextTick();
    expect(document.activeElement).toBe(first);
  });
});
