import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { EXPENSIVE_JOB_CREDITS } from '@visual-ai/shared';

import StudioActionBar from '@/components/Studio/StudioActionBar.vue';

const AnimatedCounterStub = defineComponent({
  props: { number: { type: Number, required: true }, animate: Boolean },
  setup: (props) => () =>
    h('span', { 'data-testid': 'counter', 'data-animate': String(props.animate) }, props.number),
});

// Mirrors the real dialog's contract: labelled container, a Cancel button, a Confirm button.
const ConfirmDialogStub = defineComponent({
  props: { open: Boolean, actionName: String, creditCost: Number },
  emits: ['close', 'confirm'],
  setup:
    (props, { emit }) =>
    () =>
      props.open
        ? h('div', { 'aria-labelledby': 'chain-confirm-title', 'data-testid': 'confirm-dialog' }, [
            h('span', { 'data-testid': 'confirm-cost' }, String(props.creditCost)),
            h('button', { class: 'modal-btn--ghost', onClick: () => emit('close') }, 'Cancel'),
            h('button', { class: 'modal-btn--primary', onClick: () => emit('confirm') }, 'Go'),
          ])
        : null,
});

let wrapper: VueWrapper | undefined;

function mountBar(props: Record<string, unknown> = {}) {
  wrapper = mount(StudioActionBar, {
    props: { cost: 10, ...props },
    attachTo: document.body,
    global: {
      stubs: {
        AnimatedCounter: AnimatedCounterStub,
        ConfirmChainActionDialog: ConfirmDialogStub,
        'font-awesome-icon': true,
      },
    },
  });
  return wrapper;
}

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  );
}

describe('StudioActionBar', () => {
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    vi.unstubAllGlobals();
  });

  it('shows the cost and emits generate on click for a cheap job', async () => {
    const bar = mountBar({ cost: EXPENSIVE_JOB_CREDITS - 1 });

    expect(bar.get('[data-testid="counter"]').text()).toBe(String(EXPENSIVE_JOB_CREDITS - 1));
    await bar.get('[data-testid="studio-generate"]').trigger('click');

    expect(bar.emitted('generate')).toHaveLength(1);
    expect(bar.find('[data-testid="confirm-dialog"]').exists()).toBe(false);
  });

  it('shows the Estimated tag only when estimated', () => {
    expect(mountBar({ estimated: true }).text()).toContain('Estimated');
    wrapper?.unmount();
    expect(mountBar({ estimated: false }).text()).not.toContain('Estimated');
  });

  it('labels the button Generate when idle and Generating... when busy', () => {
    expect(mountBar().get('[data-testid="studio-generate"]').text()).toBe('Generate');
    wrapper?.unmount();
    const busy = mountBar({ busy: true });
    const button = busy.get('[data-testid="studio-generate"]');

    expect(button.text()).toBe('Generating...');
    expect(button.attributes('aria-busy')).toBe('true');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('does not emit when busy', async () => {
    const bar = mountBar({ busy: true });

    await bar.get('[data-testid="studio-generate"]').trigger('click');

    expect(bar.emitted('generate')).toBeUndefined();
  });

  it('disables the button and shows the fallback reason when disabled without a reason', async () => {
    const bar = mountBar({ disabled: true });
    const button = bar.get('[data-testid="studio-generate"]');

    expect(button.attributes('disabled')).toBeDefined();
    expect(bar.get('[data-testid="studio-reason"]').text()).toBe(
      'Complete the required fields to generate.',
    );
    expect(button.attributes('aria-describedby')).toBe('studio-action-reason');
    await button.trigger('click');
    expect(bar.emitted('generate')).toBeUndefined();
  });

  it('still refuses to emit if a click reaches the handler while inactive', async () => {
    const bar = mountBar({ disabled: true });
    const button = bar.get('[data-testid="studio-generate"]');

    // A re-enabled DOM node (e.g. devtools or a stale browser state) must not bypass the guard.
    (button.element as HTMLButtonElement).disabled = false;
    await button.trigger('click');

    expect(bar.emitted('generate')).toBeUndefined();
  });

  it('shows a custom disabled reason', () => {
    const bar = mountBar({ disabled: true, disabledReason: 'Add a prompt first.' });

    expect(bar.get('[data-testid="studio-reason"]').text()).toBe('Add a prompt first.');
  });

  it('has no reason text or describedby when enabled', () => {
    const bar = mountBar({ disabledReason: 'ignored' });

    expect(bar.find('[data-testid="studio-reason"]').exists()).toBe(false);
    expect(
      bar.get('[data-testid="studio-generate"]').attributes('aria-describedby'),
    ).toBeUndefined();
  });

  it('asks for confirmation at the expensive threshold and does not emit until confirmed', async () => {
    const bar = mountBar({ cost: EXPENSIVE_JOB_CREDITS });

    await bar.get('[data-testid="studio-generate"]').trigger('click');

    expect(bar.get('[data-testid="confirm-cost"]').text()).toBe(String(EXPENSIVE_JOB_CREDITS));
    expect(bar.emitted('generate')).toBeUndefined();

    await bar.get('.modal-btn--primary').trigger('click');

    expect(bar.emitted('generate')).toHaveLength(1);
    expect(bar.find('[data-testid="confirm-dialog"]').exists()).toBe(false);
  });

  it('closes the confirmation on Cancel without emitting', async () => {
    const bar = mountBar({ cost: EXPENSIVE_JOB_CREDITS + 50 });

    await bar.get('[data-testid="studio-generate"]').trigger('click');
    await bar.get('.modal-btn--ghost').trigger('click');

    expect(bar.find('[data-testid="confirm-dialog"]').exists()).toBe(false);
    expect(bar.emitted('generate')).toBeUndefined();
  });

  it('moves focus to Cancel when the confirmation opens', async () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
    const bar = mountBar({ cost: EXPENSIVE_JOB_CREDITS });

    await bar.get('[data-testid="studio-generate"]').trigger('click');
    await bar.vm.$nextTick();
    await bar.vm.$nextTick();

    expect(document.activeElement).toBe(bar.get('.modal-btn--ghost').element);
  });

  it('animates the counter unless the user prefers reduced motion', () => {
    stubMatchMedia(false);
    expect(mountBar().get('[data-testid="counter"]').attributes('data-animate')).toBe('true');
    wrapper?.unmount();

    stubMatchMedia(true);
    expect(mountBar().get('[data-testid="counter"]').attributes('data-animate')).toBe('false');
  });
});
