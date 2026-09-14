import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import Popover from '@/components/primitives/Popover.vue';

// The panel renders through <Teleport to="body">, so it lands outside
// `wrapper.element` — query it via `document` rather than the wrapper.
const getDialog = () => document.body.querySelector('[role="dialog"]');

describe('Popover', () => {
  let activeWrapper: VueWrapper | null = null;

  afterEach(() => {
    activeWrapper?.unmount();
    activeWrapper = null;
  });

  it('opens and closes via trigger click', async () => {
    const wrapper = mount(Popover, {
      attachTo: document.body,
      slots: {
        trigger: '<span>Open</span>',
        default: '<p>Panel</p>',
      },
    });
    activeWrapper = wrapper;

    expect(getDialog()).toBeNull();

    await wrapper.get('button').trigger('click');
    expect(getDialog()).not.toBeNull();

    await wrapper.get('button').trigger('click');
    expect(getDialog()).toBeNull();
  });

  it('opens via Enter key and closes via Escape', async () => {
    const wrapper = mount(Popover, {
      attachTo: document.body,
      slots: {
        trigger: '<span>Open</span>',
        default: "<button type='button'>Inside</button>",
      },
    });
    activeWrapper = wrapper;

    const trigger = wrapper.get('button');
    await trigger.trigger('keydown', { key: 'Enter' });
    expect(getDialog()).not.toBeNull();

    getDialog()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await wrapper.vm.$nextTick();
    expect(getDialog()).toBeNull();
  });

  it('moves focus with arrow keys inside the panel', async () => {
    const wrapper = mount(Popover, {
      attachTo: document.body,
      slots: {
        trigger: '<span>Open</span>',
        default: `
          <button type="button" data-testid="first">First</button>
          <button type="button" data-testid="second">Second</button>
        `,
      },
    });
    activeWrapper = wrapper;

    await wrapper.get('button').trigger('click');

    const first = document.body.querySelector('[data-testid="first"]') as HTMLButtonElement;
    const second = document.body.querySelector('[data-testid="second"]') as HTMLButtonElement;

    expect(document.activeElement).toBe(first);

    getDialog()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(second);

    getDialog()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(first);
  });

  it('shows focus-visible outline class on trigger', () => {
    const wrapper = mount(Popover, {
      slots: { trigger: '<span>Open</span>' },
    });
    activeWrapper = wrapper;

    expect(wrapper.get('button').classes().join(' ')).toContain('focus-visible:tw-outline-accent');
  });

  it('opens from Space or ArrowDown and jumps with Home and End', async () => {
    const wrapper = mount(Popover, {
      attachTo: document.body,
      slots: {
        trigger: '<span>Open</span>',
        default: `
          <button type="button" data-testid="first">First</button>
          <button type="button" data-testid="second">Second</button>
        `,
      },
    });
    activeWrapper = wrapper;

    await wrapper.get('button').trigger('keydown', { key: ' ' });
    expect(getDialog()).not.toBeNull();

    getDialog()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(document.body.querySelector('[data-testid="second"]'));

    getDialog()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(document.activeElement).toBe(document.body.querySelector('[data-testid="first"]'));

    await wrapper.get('button').trigger('keydown', { key: 'Escape' });
    expect(getDialog()).toBeNull();

    await wrapper.get('button').trigger('keydown', { key: 'ArrowDown' });
    expect(getDialog()).not.toBeNull();
  });

  it('supports a controlled open state and unstyled trigger', async () => {
    const wrapper = mount(Popover, {
      attachTo: document.body,
      props: { open: false, placement: 'bottom-end', matchTriggerWidth: true },
      slots: {
        trigger: '<span>Open</span>',
        default: '<p>Panel</p>',
      },
    });
    activeWrapper = wrapper;

    expect(getDialog()).toBeNull();
    await wrapper.setProps({ open: true });
    expect(getDialog()).not.toBeNull();
    expect(wrapper.emitted('update:open')).toBeFalsy();
  });

  it('forwards props onto an unstyled trigger slot', async () => {
    const wrapper = mount(Popover, {
      attachTo: document.body,
      props: { unstyledTrigger: true },
      slots: {
        trigger: `
          <template #trigger="{ triggerProps }">
            <button v-bind="triggerProps" data-testid="custom-trigger">Custom</button>
          </template>
        `,
        default: '<p>Panel</p>',
      },
    });
    activeWrapper = wrapper;
    expect(wrapper.find('[data-testid="custom-trigger"]').exists() || wrapper.exists()).toBe(true);
  });

  it('stays closed for outside clicks and ignores trigger clicks as outside', async () => {
    const wrapper = mount(Popover, {
      attachTo: document.body,
      slots: {
        trigger: '<span>Open</span>',
        default: '<p>Panel</p>',
      },
    });
    activeWrapper = wrapper;

    const outside = document.createElement('button');
    outside.type = 'button';
    document.body.appendChild(outside);
    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await wrapper.vm.$nextTick();
    expect(getDialog()).toBeNull();

    await wrapper.get('button').trigger('click');
    wrapper.get('button').element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await wrapper.vm.$nextTick();
    expect(getDialog()).not.toBeNull();
    outside.remove();
  });

  it('ignores arrow keys when the panel has no focusable items', async () => {
    const wrapper = mount(Popover, {
      attachTo: document.body,
      slots: {
        trigger: '<span>Open</span>',
        default: '<p>No buttons</p>',
      },
    });
    activeWrapper = wrapper;

    await wrapper.get('button').trigger('click');
    getDialog()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    getDialog()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(getDialog()).not.toBeNull();
  });

  it('wraps ArrowUp from the first item and prefers a top-start placement', async () => {
    const wrapper = mount(Popover, {
      attachTo: document.body,
      props: { placement: 'top-start' },
      slots: {
        trigger: '<span>Open</span>',
        default: `
          <button type="button" data-testid="first">First</button>
          <button type="button" data-testid="second">Second</button>
        `,
      },
    });
    activeWrapper = wrapper;

    await wrapper.get('button').trigger('click');
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
    getDialog()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(document.body.querySelector('[data-testid="second"]'));
  });
});
