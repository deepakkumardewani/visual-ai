import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ConfirmColorizeDialog from '@/components/Dialogs/ConfirmColorizeDialog.vue';

const stubs = {
  AppModal: {
    props: ['open'],
    template:
      '<div v-if="open" data-testid="app-modal"><slot name="title" /><slot /><slot name="actions" /></div>',
  },
};

describe('ConfirmColorizeDialog', () => {
  it('renders warning copy when open', () => {
    const wrapper = mount(ConfirmColorizeDialog, {
      props: { open: true },
      global: { stubs },
    });
    expect(wrapper.text()).toContain('Already looks colored');
    expect(wrapper.text()).toContain('Colorize anyway');
  });

  it('does not render when closed', () => {
    const wrapper = mount(ConfirmColorizeDialog, {
      props: { open: false },
      global: { stubs },
    });
    expect(wrapper.find('[data-testid="app-modal"]').exists()).toBe(false);
  });

  it('emits close and confirm from actions', async () => {
    const wrapper = mount(ConfirmColorizeDialog, {
      props: { open: true },
      global: { stubs },
    });
    await wrapper.find('.modal-btn--ghost').trigger('click');
    await wrapper.find('.modal-btn--primary').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
    expect(wrapper.emitted('confirm')).toBeTruthy();
  });
});
