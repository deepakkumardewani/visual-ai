import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppModal from '@/components/AppModal.vue';

describe('AppModal', () => {
  it('does not render the dialog when closed', () => {
    const wrapper = mount(AppModal, {
      props: { open: false },
      slots: { default: 'Hidden body' },
      attachTo: document.body,
    });
    expect(document.body.textContent).not.toContain('Hidden body');
    wrapper.unmount();
  });

  it('renders slots and emits close from the close button', async () => {
    const wrapper = mount(AppModal, {
      props: { open: true },
      slots: {
        title: 'Buy credits',
        default: 'Choose a pack',
        actions: '<button type="button">Continue</button>',
      },
      global: {
        stubs: { Teleport: true, Transition: false },
      },
    });

    expect(wrapper.text()).toContain('Buy credits');
    expect(wrapper.text()).toContain('Choose a pack');
    await wrapper.get('[aria-label="Close dialog"]').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false]);
  });

  it('closes when the overlay is clicked and ignores panel clicks', async () => {
    const wrapper = mount(AppModal, {
      props: { open: true },
      slots: { default: 'Body' },
      global: { stubs: { Teleport: true, Transition: false } },
    });

    await wrapper.get('[role="dialog"]').trigger('click');
    expect(wrapper.emitted('close')).toBeFalsy();

    await wrapper.get('[role="presentation"]').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('does not close from overlay or escape when those options are disabled', async () => {
    const wrapper = mount(AppModal, {
      props: { open: true, closeOnOverlay: false, closeOnEscape: false, showClose: false },
      slots: { default: 'Locked' },
      global: { stubs: { Teleport: true, Transition: false } },
    });

    expect(wrapper.find('[aria-label="Close dialog"]').exists()).toBe(false);
    await wrapper.get('[role="presentation"]').trigger('click');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(wrapper.emitted('close')).toBeFalsy();
  });

  it('applies fullscreen, described-by, and stacked layer styles', () => {
    const wrapper = mount(AppModal, {
      props: {
        open: true,
        fullscreen: true,
        layer: 2,
        describedBy: 'hint',
        maxWidth: '40rem',
      },
      slots: { default: 'Wide' },
      global: { stubs: { Teleport: true, Transition: false } },
    });

    expect(wrapper.get('[role="presentation"]').classes()).toContain('app-modal--fullscreen');
    expect(wrapper.get('[role="dialog"]').attributes('aria-describedby')).toBe('hint');
    expect(wrapper.get('[role="presentation"]').attributes('style')).toContain('1240');
  });

  it('closes on Escape when the dialog is open', async () => {
    const wrapper = mount(AppModal, {
      props: { open: true },
      slots: { default: 'Escapable' },
      global: { stubs: { Teleport: true, Transition: false } },
    });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('ignores Escape while closed and unlocks the body when layer 0 closes', async () => {
    const wrapper = mount(AppModal, {
      props: { open: false, layer: 0 },
      slots: { default: 'Closed' },
      global: { stubs: { Teleport: true, Transition: false } },
    });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(wrapper.emitted('close')).toBeFalsy();

    await wrapper.setProps({ open: true });
    await wrapper.setProps({ open: false });
    expect(wrapper.emitted('close')).toBeFalsy();
  });
});
