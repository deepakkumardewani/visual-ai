import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import AsideDisclosure from '@/components/Dashboard/Sidebar/AsideDisclosure.vue';

const stubs = { 'font-awesome-icon': true };

describe('AsideDisclosure', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders title and slot content when open by default', () => {
    const wrapper = mount(AsideDisclosure, {
      props: { title: 'Size', storageKey: 'size-section' },
      slots: { default: '<div data-testid="disclosure-body">Body</div>' },
      global: { stubs },
    });

    expect(wrapper.get('[data-testid="aside-disclosure-size-section"]').text()).toContain('Size');
    expect(wrapper.get('[data-testid="disclosure-body"]').text()).toBe('Body');
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('true');
  });

  it('toggles closed and persists the state', async () => {
    const wrapper = mount(AsideDisclosure, {
      props: { title: 'Quality', storageKey: 'quality-section', defaultOpen: true },
      slots: { default: '<span>panel</span>' },
      global: { stubs },
    });

    await wrapper.get('button').trigger('click');
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('false');
    expect(localStorage.getItem('quality-section')).toBe('false');
  });

  it('restores closed state from localStorage', async () => {
    localStorage.setItem('style-section', 'false');
    const wrapper = mount(AsideDisclosure, {
      props: { title: 'Style', storageKey: 'style-section', defaultOpen: true },
      slots: { default: '<span>panel</span>' },
      global: { stubs },
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.get('button').attributes('aria-expanded')).toBe('false');
  });
});
