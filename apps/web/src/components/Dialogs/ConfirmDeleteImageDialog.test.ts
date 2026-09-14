import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ConfirmDeleteImageDialog from '@/components/Dialogs/ConfirmDeleteImageDialog.vue';

const stubs = {
  AppModal: {
    props: ['open'],
    template:
      '<div v-if="open" data-testid="app-modal"><slot name="title" /><slot /><slot name="actions" /></div>',
  },
};

function mountDialog(props: Record<string, unknown> = {}) {
  return mount(ConfirmDeleteImageDialog, {
    props: { open: true, ...props },
    global: { stubs },
  });
}

describe('ConfirmDeleteImageDialog', () => {
  it('uses singular copy for one image', () => {
    const wrapper = mountDialog({ imageCount: 1 });
    expect(wrapper.text()).toContain('Delete generation');
    expect(wrapper.text()).toContain('this image');
  });

  it('uses plural copy for multiple images', () => {
    const wrapper = mountDialog({ imageCount: 3 });
    expect(wrapper.text()).toContain('these 3 images');
  });

  it('disables confirm and shows deleting state while loading', () => {
    const wrapper = mountDialog({ loading: true });
    const confirm = wrapper.find('.modal-btn--danger');
    expect(confirm.attributes('disabled')).toBeDefined();
    expect(confirm.text()).toContain('Deleting…');
  });

  it('emits close from Keep and confirm from Delete', async () => {
    const wrapper = mountDialog();
    await wrapper.find('.modal-btn--ghost').trigger('click');
    await wrapper.find('.modal-btn--danger').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
    expect(wrapper.emitted('confirm')).toBeTruthy();
  });

  it('does not render when closed', () => {
    const wrapper = mountDialog({ open: false });
    expect(wrapper.find('[data-testid="app-modal"]').exists()).toBe(false);
  });
});
