import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import Tooltip from '@/components/primitives/Tooltip.vue';

describe('Tooltip', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the trigger slot without a tip', () => {
    const wrapper = mount(Tooltip, {
      props: { text: 'More info' },
      slots: { default: '<button>Help</button>' },
      attachTo: document.body,
    });
    expect(wrapper.text()).toContain('Help');
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('does not show an empty tooltip', async () => {
    vi.useFakeTimers();
    const wrapper = mount(Tooltip, {
      props: { text: '' },
      slots: { default: '<button>Help</button>' },
      attachTo: document.body,
    });
    await wrapper.trigger('mouseenter');
    await vi.advanceTimersByTimeAsync(200);
    await nextTick();
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('shows and hides tooltip text on hover', async () => {
    vi.useFakeTimers();
    const wrapper = mount(Tooltip, {
      props: { text: 'Download image' },
      slots: { default: '<button>DL</button>' },
      attachTo: document.body,
    });
    await wrapper.trigger('mouseenter');
    await vi.advanceTimersByTimeAsync(180);
    await nextTick();
    expect(document.body.querySelector('[role="tooltip"]')?.textContent).toContain(
      'Download image',
    );

    await wrapper.trigger('mouseleave');
    await nextTick();
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('positions the tip below the trigger when placement is bottom', async () => {
    vi.useFakeTimers();
    const wrapper = mount(Tooltip, {
      props: { text: 'Below', placement: 'bottom' },
      slots: { default: '<button>Help</button>' },
      attachTo: document.body,
    });
    await wrapper.trigger('mouseenter');
    await wrapper.trigger('mouseenter');
    await vi.advanceTimersByTimeAsync(180);
    await nextTick();
    const tip = document.body.querySelector('[role="tooltip"]') as HTMLElement | null;
    expect(tip).not.toBeNull();
    expect(tip?.style.transform).toBe('translateX(-50%)');

    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
    await nextTick();
    expect(document.body.querySelector('[role="tooltip"]')).not.toBeNull();
    wrapper.unmount();
  });

  it('shows on focusin, hides on focusout, and clears a pending timer on unmount', async () => {
    vi.useFakeTimers();
    const wrapper = mount(Tooltip, {
      props: { text: 'Focus tip' },
      slots: { default: '<button>Help</button>' },
      attachTo: document.body,
    });
    await wrapper.trigger('focusin');
    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(200);
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull();

    const again = mount(Tooltip, {
      props: { text: 'Focus tip' },
      slots: { default: '<button>Help</button>' },
      attachTo: document.body,
    });
    await again.trigger('focusin');
    await vi.advanceTimersByTimeAsync(180);
    await nextTick();
    expect(document.body.querySelector('[role="tooltip"]')?.textContent).toContain('Focus tip');
    await again.trigger('focusout');
    await nextTick();
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
    again.unmount();
  });
});
