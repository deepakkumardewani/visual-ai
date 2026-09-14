import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import ReferralCopyDialog from '@/components/Dialogs/ReferralCopyDialog.vue';
import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

const stubs = {
  AppModal: {
    props: ['open'],
    template:
      '<div v-if="open" data-testid="app-modal"><slot name="title" /><slot /><slot name="actions" /></div>',
  },
  ReferralCode: { template: '<div data-testid="referral-code" />' },
  'font-awesome-icon': true,
};

describe('ReferralCopyDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('does not render when closed', () => {
    const wrapper = mount(ReferralCopyDialog, { global: { stubs } });
    expect(wrapper.find('[data-testid="app-modal"]').exists()).toBe(false);
  });

  it('shows current credits and referral offer when open', () => {
    const userStore = useUserStore();
    userStore.credits = 75;
    const dialogStore = useDialogStore();
    dialogStore.showCopyReferral();

    const wrapper = mount(ReferralCopyDialog, { global: { stubs } });
    expect(wrapper.text()).toContain('Your account balance');
    expect(wrapper.text()).toContain('75 credits');
    expect(wrapper.text()).toContain('Earn more credits');
    expect(wrapper.find('[data-testid="referral-code"]').exists()).toBe(true);
  });

  it('falls back to 0 credits when balance is empty', () => {
    const userStore = useUserStore();
    userStore.credits = undefined as unknown as number;
    const dialogStore = useDialogStore();
    dialogStore.showCopyReferral();

    const wrapper = mount(ReferralCopyDialog, { global: { stubs } });
    expect(wrapper.text()).toContain('0 credits');
  });

  it('closes from the close button', async () => {
    const dialogStore = useDialogStore();
    dialogStore.showCopyReferral();
    const wrapper = mount(ReferralCopyDialog, { global: { stubs } });
    await wrapper.get('[aria-label="Close dialog"]').trigger('click');
    expect(dialogStore.showCopyReferralDialog).toBe(false);
  });
});
