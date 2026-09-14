import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const applyReferralCode = vi.fn();

vi.mock('@/utils/helpers', () => ({
  applyReferralCode: (...args: unknown[]) => applyReferralCode(...args),
}));

import ReferralDialog from '@/components/Dialogs/ReferralDialog.vue';
import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

const stubs = {
  AppModal: {
    props: ['open'],
    template:
      '<div v-if="open" data-testid="app-modal"><slot name="title" /><slot /><slot name="actions" /></div>',
  },
  'font-awesome-icon': true,
};

describe('ReferralDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    applyReferralCode.mockReset();
  });

  it('does not render when closed', () => {
    const wrapper = mount(ReferralDialog, { global: { stubs } });
    expect(wrapper.find('[data-testid="app-modal"]').exists()).toBe(false);
  });

  it('keeps apply disabled for empty or short codes', async () => {
    const dialogStore = useDialogStore();
    dialogStore.showReferral();
    const wrapper = mount(ReferralDialog, { global: { stubs } });
    const apply = wrapper.find('.modal-btn--primary');
    expect(apply.attributes('disabled')).toBeDefined();

    await wrapper.find('input').setValue('AB');
    expect(wrapper.find('[role="alert"]').text()).toContain('6 characters');
    expect(wrapper.find('.modal-btn--primary').attributes('disabled')).toBeDefined();
  });

  it('rejects the user own referral code', async () => {
    const userStore = useUserStore();
    userStore.userDetails = { referralCode: 'ABCDEF' } as never;
    const dialogStore = useDialogStore();
    dialogStore.showReferral();

    const wrapper = mount(ReferralDialog, { global: { stubs } });
    await wrapper.find('input').setValue('ABCDEF');
    expect(wrapper.find('[role="alert"]').text()).toContain('your own referral code');
    expect(wrapper.find('.modal-btn--primary').attributes('disabled')).toBeDefined();
  });

  it('applies a valid code', async () => {
    applyReferralCode.mockResolvedValue(undefined);
    const dialogStore = useDialogStore();
    dialogStore.showReferral();
    const wrapper = mount(ReferralDialog, { global: { stubs } });
    await wrapper.find('input').setValue('XYZ123');
    await wrapper.find('.modal-btn--primary').trigger('click');
    await flushPromises();
    expect(applyReferralCode).toHaveBeenCalledWith('XYZ123');
  });

  it('shows an error when apply fails', async () => {
    applyReferralCode.mockRejectedValue(new Error('Code already used'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const dialogStore = useDialogStore();
    dialogStore.showReferral();
    const wrapper = mount(ReferralDialog, { global: { stubs } });
    await wrapper.find('input').setValue('XYZ123');
    await wrapper.find('.modal-btn--primary').trigger('click');
    await flushPromises();
    expect(wrapper.find('[role="alert"]').text()).toBe('Code already used');
    errorSpy.mockRestore();
  });

  it('shows a generic error for non-Error rejections and clears on close', async () => {
    applyReferralCode.mockRejectedValue('nope');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const dialogStore = useDialogStore();
    dialogStore.showReferral();
    const wrapper = mount(ReferralDialog, {
      global: {
        stubs: {
          AppModal: {
            props: ['open'],
            template:
              '<div v-if="open" data-testid="app-modal"><slot name="title" /><slot /><slot name="actions" /><button type="button" data-testid="close" @click="$emit(\'close\')">x</button></div>',
          },
          'font-awesome-icon': true,
        },
      },
    });
    await wrapper.find('input').setValue('XYZ123');
    await wrapper.find('.modal-btn--primary').trigger('click');
    await flushPromises();
    expect(wrapper.find('[role="alert"]').text()).toBe('Something went wrong');

    await wrapper.get('[data-testid="close"]').trigger('click');
    expect(dialogStore.showReferralDialog).toBe(false);
    errorSpy.mockRestore();
  });
});
