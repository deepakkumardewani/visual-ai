import { computed, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const reducedMotionRef = vi.hoisted(() => ({ value: false }));

vi.mock('@/composables/useReducedMotion', () => ({
  useReducedMotion: () => computed(() => reducedMotionRef.value),
}));

import { useMagnetic } from '@/composables/useMagnetic';

function mountMagnetic(el: ReturnType<typeof ref<HTMLElement | null>>, strength?: number) {
  return mount({
    setup() {
      useMagnetic(el, strength);
      return {};
    },
    template: '<div />',
  });
}

describe('useMagnetic', () => {
  beforeEach(() => {
    reducedMotionRef.value = false;
  });

  it('is a no-op when strength is 0', () => {
    const node = document.createElement('button');
    const add = vi.spyOn(node, 'addEventListener');
    const wrapper = mountMagnetic(ref(node), 0);
    expect(add).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('translates the node toward the pointer and resets on leave', () => {
    const node = document.createElement('button');
    document.body.appendChild(node);
    vi.spyOn(node, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 40,
      right: 100,
      bottom: 40,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const wrapper = mountMagnetic(ref(node), 0.5);
    node.dispatchEvent(new MouseEvent('mouseenter'));
    expect(node.style.transition).toContain('transform 0.1s');

    node.dispatchEvent(new MouseEvent('mousemove', { clientX: 80, clientY: 30 }));
    expect(node.style.transform).toBe('translate(15px, 5px)');

    node.dispatchEvent(new MouseEvent('mouseleave'));
    expect(node.style.transform).toBe('');
    wrapper.unmount();
    node.remove();
  });

  it('does not move when reduced motion is preferred', () => {
    reducedMotionRef.value = true;
    const node = document.createElement('button');
    document.body.appendChild(node);
    vi.spyOn(node, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 40,
      right: 100,
      bottom: 40,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const wrapper = mountMagnetic(ref(node));
    node.dispatchEvent(new MouseEvent('mousemove', { clientX: 90, clientY: 10 }));
    expect(node.style.transform).toBe('');
    wrapper.unmount();
    node.remove();
  });

  it('unwraps a component $el and no-ops when the node is missing', () => {
    const node = document.createElement('button');
    document.body.appendChild(node);
    const el = ref<{ $el: HTMLElement } | HTMLElement | null>({ $el: node });
    const wrapper = mountMagnetic(el as never, 0.4);

    node.dispatchEvent(new MouseEvent('mouseenter'));
    expect(node.style.transition).toContain('transform 0.1s');

    el.value = null;
    node.dispatchEvent(new MouseEvent('mousemove', { clientX: 10, clientY: 10 }));
    node.dispatchEvent(new MouseEvent('mouseenter'));
    node.dispatchEvent(new MouseEvent('mouseleave'));
    wrapper.unmount();
    node.remove();
  });

  it('ignores invalid refs on mount', () => {
    const wrapper = mountMagnetic(ref({} as never), 0.4);
    wrapper.unmount();
    const empty = mountMagnetic(ref(null), 0.4);
    empty.unmount();
  });
});
