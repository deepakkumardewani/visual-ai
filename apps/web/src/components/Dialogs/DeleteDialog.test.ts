import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.fn();
const useFetch = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/composables/useFetch', () => ({
  useFetch: (...args: unknown[]) => useFetch(...args),
}));

import DeleteDialog from '@/components/Dialogs/DeleteDialog.vue';
import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

const stubs = {
  AppModal: {
    props: ['open'],
    template:
      '<div v-if="open" data-testid="app-modal"><slot name="title" /><slot /><slot name="actions" /></div>',
  },
};

describe('DeleteDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    push.mockReset();
    useFetch.mockReset();
  });

  it('does not render while closed', () => {
    const wrapper = mount(DeleteDialog, { global: { stubs } });
    expect(wrapper.find('[data-testid="app-modal"]').exists()).toBe(false);
  });

  it('renders warning and keeps delete disabled until checkbox is checked', async () => {
    const dialogStore = useDialogStore();
    dialogStore.showDelete();
    const wrapper = mount(DeleteDialog, { global: { stubs } });

    expect(wrapper.text()).toContain('Delete account');
    expect(wrapper.text()).toContain('irreversible');
    const confirm = wrapper.find('.modal-btn--danger');
    expect(confirm.attributes('disabled')).toBeDefined();

    await wrapper.find('input[type="checkbox"]').setValue(true);
    expect(wrapper.find('.modal-btn--danger').attributes('disabled')).toBeUndefined();
  });

  it('closes without deleting when going back', async () => {
    const dialogStore = useDialogStore();
    dialogStore.showDelete();
    const wrapper = mount(DeleteDialog, { global: { stubs } });
    await wrapper.find('.modal-btn--ghost').trigger('click');
    expect(dialogStore.showDeleteDialog).toBe(false);
    expect(useFetch).not.toHaveBeenCalled();
  });

  it('deletes the account and navigates home on success', async () => {
    useFetch.mockResolvedValue({ data: { ok: true }, error: null });
    const pinia = createPinia();
    setActivePinia(pinia);
    const userStore = useUserStore();
    userStore.userId = 'user-1';
    const dialogStore = useDialogStore();
    dialogStore.showDelete();

    const wrapper = mount(DeleteDialog, { global: { plugins: [pinia], stubs } });
    await wrapper.find('input[type="checkbox"]').setValue(true);
    await wrapper.find('.modal-btn--danger').trigger('click');
    await flushPromises();

    expect(useFetch).toHaveBeenCalledWith(
      '/api/users/user-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(dialogStore.showDeleteDialog).toBe(false);
    expect(push).toHaveBeenCalledWith('/');
  });

  it('stays open and logs when delete fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    useFetch.mockResolvedValue({ data: null, error: 'failed' });
    const dialogStore = useDialogStore();
    dialogStore.showDelete();

    const wrapper = mount(DeleteDialog, { global: { stubs } });
    await wrapper.find('input[type="checkbox"]').setValue(true);
    await wrapper.find('.modal-btn--danger').trigger('click');
    await flushPromises();

    expect(dialogStore.showDeleteDialog).toBe(true);
    expect(push).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
