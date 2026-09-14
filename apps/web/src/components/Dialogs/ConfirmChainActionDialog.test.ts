import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ConfirmChainActionDialog from '@/components/Dialogs/ConfirmChainActionDialog.vue';

const modalStubs = {
  AppModal: {
    props: ['open'],
    emits: ['close'],
    template:
      '<div v-if="open" data-testid="app-modal"><slot name="title" /><slot /><slot name="actions" /></div>',
  },
  CreditCostBadge: {
    props: ['cost'],
    template: '<span data-testid="credit-cost">{{ cost }}</span>',
  },
};

function mountDialog(props: Record<string, unknown> = {}) {
  return mount(ConfirmChainActionDialog, {
    props: {
      open: true,
      actionName: 'Upscale',
      creditCost: 2,
      ...props,
    },
    global: { stubs: modalStubs },
  });
}

describe('ConfirmChainActionDialog', () => {
  it('renders action name and credit cost when open', () => {
    const wrapper = mountDialog();
    expect(wrapper.text()).toContain('Upscale');
    expect(wrapper.get('[data-testid="credit-cost"]').text()).toBe('2');
    expect(wrapper.text()).toContain('Continue?');
  });

  it('hides extra copy when empty', () => {
    const wrapper = mountDialog({ extraCopy: '' });
    expect(wrapper.find('.chain-confirm__copy').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Extra warning');
  });

  it('shows extra copy when provided', () => {
    const wrapper = mountDialog({ extraCopy: 'This may take a minute.' });
    expect(wrapper.text()).toContain('This may take a minute.');
  });

  it('does not render when closed', () => {
    const wrapper = mountDialog({ open: false });
    expect(wrapper.find('[data-testid="app-modal"]').exists()).toBe(false);
  });

  it('emits close on cancel and confirm on continue', async () => {
    const wrapper = mountDialog();
    const buttons = wrapper.findAll('button');
    await buttons[0].trigger('click');
    await buttons[1].trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(wrapper.emitted('confirm')).toHaveLength(1);
  });
});
