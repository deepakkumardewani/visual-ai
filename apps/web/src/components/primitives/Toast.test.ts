import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import Toast from '@/components/primitives/Toast.vue';

describe('Toast', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not render when hidden', () => {
    const wrapper = mount(Toast, {
      props: { modelValue: false, text: 'Saved' },
      attachTo: document.body,
    });
    expect(document.body.querySelector('[role="status"]')).toBeNull();
    wrapper.unmount();
  });

  it('renders status text when visible', () => {
    const wrapper = mount(Toast, {
      props: { modelValue: true, text: 'Copied to clipboard' },
      attachTo: document.body,
    });
    const toast = document.body.querySelector('[role="status"]');
    expect(toast?.textContent).toContain('Copied to clipboard');
    wrapper.unmount();
  });

  it('hides itself after the timeout', async () => {
    vi.useFakeTimers();
    const wrapper = mount(Toast, {
      props: { modelValue: false, text: 'Saved', timeout: 200 },
      attachTo: document.body,
    });
    await wrapper.setProps({ modelValue: true });
    await vi.advanceTimersByTimeAsync(200);
    await nextTick();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false]);
    wrapper.unmount();
  });

  it('stays visible when timeout is negative', async () => {
    vi.useFakeTimers();
    const wrapper = mount(Toast, {
      props: { modelValue: true, text: 'Pinned', timeout: -1 },
      attachTo: document.body,
    });
    await vi.advanceTimersByTimeAsync(5000);
    expect(document.body.querySelector('[role="status"]')).not.toBeNull();
    wrapper.unmount();
  });
});
