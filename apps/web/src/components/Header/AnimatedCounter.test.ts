import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AnimatedCounter from '@/components/Header/AnimatedCounter.vue';

describe('AnimatedCounter', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the initial number', () => {
    const wrapper = mount(AnimatedCounter, { props: { number: 12 } });
    expect(wrapper.text()).toBe('12');
  });

  it('jumps immediately when animate is false', async () => {
    const wrapper = mount(AnimatedCounter, { props: { number: 5, animate: false } });
    await wrapper.setProps({ number: 40 });
    expect(wrapper.text()).toBe('40');
  });

  it('animates toward the new value when animate is true', async () => {
    vi.useFakeTimers();
    const wrapper = mount(AnimatedCounter, { props: { number: 0, animate: true } });
    await wrapper.setProps({ number: 20 });
    expect(wrapper.text()).toBe('0');
    await vi.advanceTimersByTimeAsync(400);
    expect(wrapper.text()).toBe('20');
  });

  it('counts down and ignores a no-op update to the same number', async () => {
    vi.useFakeTimers();
    const wrapper = mount(AnimatedCounter, { props: { number: 20, animate: true } });
    await wrapper.setProps({ number: 20 });
    expect(wrapper.text()).toBe('20');

    await wrapper.setProps({ number: 0 });
    await vi.advanceTimersByTimeAsync(400);
    expect(wrapper.text()).toBe('0');
  });

  it('restarts the interval when the target changes mid-animation', async () => {
    vi.useFakeTimers();
    const wrapper = mount(AnimatedCounter, { props: { number: 0, animate: true } });
    await wrapper.setProps({ number: 100 });
    await vi.advanceTimersByTimeAsync(40);
    await wrapper.setProps({ number: 5 });
    await vi.advanceTimersByTimeAsync(400);
    expect(wrapper.text()).toBe('5');
  });
});
