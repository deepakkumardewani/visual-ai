import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import ReferralOfferDialog from '@/components/Dialogs/ReferralOfferDialog.vue';
import { useDialogStore } from '@/stores/dialog';

const stubs = {
  AppModal: {
    props: ['open'],
    template:
      '<div v-if="open" data-testid="app-modal"><slot name="title" /><slot /><slot name="actions" /></div>',
  },
  ReferralCode: { template: '<div data-testid="referral-code" />' },
  'font-awesome-icon': true,
};

describe('ReferralOfferDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('does not render when closed', () => {
    const wrapper = mount(ReferralOfferDialog, { global: { stubs } });
    expect(wrapper.find('[data-testid="app-modal"]').exists()).toBe(false);
  });

  it('renders offer copy when open', () => {
    const dialogStore = useDialogStore();
    dialogStore.showReferralOffer();
    const wrapper = mount(ReferralOfferDialog, { global: { stubs } });
    expect(wrapper.text()).toContain('Special referral offer');
    expect(wrapper.text()).toContain('50 free credits');
    expect(wrapper.find('[data-testid="referral-code"]').exists()).toBe(true);
  });

  it('closes from the Close action', async () => {
    const dialogStore = useDialogStore();
    dialogStore.showReferralOffer();
    const wrapper = mount(ReferralOfferDialog, { global: { stubs } });
    await wrapper.find('.modal-btn--primary').trigger('click');
    expect(dialogStore.referralOfferDialog).toBe(false);
  });
});
