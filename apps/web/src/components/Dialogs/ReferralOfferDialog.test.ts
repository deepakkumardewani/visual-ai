import { REFERRAL_BONUS } from '@visual-ai/shared';
import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ReferralOfferDialog from '@/components/Dialogs/ReferralOfferDialog.vue';
import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

const stubs = {
  AppModal: {
    props: ['open'],
    emits: ['close'],
    template:
      '<div v-if="open" data-testid="app-modal"><button type="button" data-testid="modal-close" @click="$emit(\'close\')">Close</button><slot name="title" /><slot /></div>',
  },
  'font-awesome-icon': true,
};

describe('ReferralOfferDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('does not render when closed', () => {
    const wrapper = mount(ReferralOfferDialog, { global: { stubs } });
    expect(wrapper.find('[data-testid="app-modal"]').exists()).toBe(false);
  });

  it('renders offer copy when open', () => {
    const userStore = useUserStore();
    userStore.userDetails = { referralCode: 'FRIEND123' } as never;

    const dialogStore = useDialogStore();
    dialogStore.showReferralOffer();
    const wrapper = mount(ReferralOfferDialog, { global: { stubs } });
    expect(wrapper.text()).toContain('Refer a friend');
    expect(wrapper.text()).toContain(`${REFERRAL_BONUS} free credits`);
    expect(wrapper.get('[data-testid="referral-offer-code"]').text()).toBe('FRIEND123');
  });

  it('closes from the modal close control', async () => {
    const dialogStore = useDialogStore();
    dialogStore.showReferralOffer();
    const wrapper = mount(ReferralOfferDialog, { global: { stubs } });
    await wrapper.get('[data-testid="modal-close"]').trigger('click');
    expect(dialogStore.referralOfferDialog).toBe(false);
  });

  it('copies the referral code and shows Copied', async () => {
    vi.useFakeTimers();
    const userStore = useUserStore();
    userStore.userDetails = { referralCode: 'FRIEND123' } as never;

    const dialogStore = useDialogStore();
    dialogStore.showReferralOffer();
    const wrapper = mount(ReferralOfferDialog, { global: { stubs } });

    await wrapper.get('[data-testid="referral-offer-copy-btn"]').trigger('click');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('FRIEND123');
    expect(wrapper.get('[data-testid="referral-offer-copy-btn"]').text()).toBe('Copied');
    expect(wrapper.get('[data-testid="referral-offer-copy-btn"]').attributes('aria-label')).toBe(
      'Referral code copied',
    );
    expect(wrapper.get('.offer__live').text()).toContain('clipboard');

    await vi.advanceTimersByTimeAsync(2000);
    expect(wrapper.get('[data-testid="referral-offer-copy-btn"]').text()).toBe('Copy code');
    vi.useRealTimers();
  });

  it('does not copy when the referral code is missing', async () => {
    const dialogStore = useDialogStore();
    dialogStore.showReferralOffer();
    const wrapper = mount(ReferralOfferDialog, { global: { stubs } });
    await wrapper.get('[data-testid="referral-offer-copy-btn"]').trigger('click');
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it('resets the copied state timer when copy is triggered again', async () => {
    vi.useFakeTimers();
    const userStore = useUserStore();
    userStore.userDetails = { referralCode: 'FRIEND123' } as never;
    const dialogStore = useDialogStore();
    dialogStore.showReferralOffer();
    const wrapper = mount(ReferralOfferDialog, { global: { stubs } });

    await wrapper.get('[data-testid="referral-offer-copy-btn"]').trigger('click');
    await vi.advanceTimersByTimeAsync(1500);
    await wrapper.get('[data-testid="referral-offer-copy-btn"]').trigger('click');
    expect(wrapper.get('[data-testid="referral-offer-copy-btn"]').text()).toBe('Copied');

    await vi.advanceTimersByTimeAsync(1500);
    expect(wrapper.get('[data-testid="referral-offer-copy-btn"]').text()).toBe('Copied');

    await vi.advanceTimersByTimeAsync(500);
    expect(wrapper.get('[data-testid="referral-offer-copy-btn"]').text()).toBe('Copy code');
    vi.useRealTimers();
  });

  it('logs when clipboard write fails', async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('denied'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const userStore = useUserStore();
    userStore.userDetails = { referralCode: 'FRIEND123' } as never;
    const dialogStore = useDialogStore();
    dialogStore.showReferralOffer();
    const wrapper = mount(ReferralOfferDialog, { global: { stubs } });

    await wrapper.get('[data-testid="referral-offer-copy-btn"]').trigger('click');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('clears pending revert timer on unmount', async () => {
    vi.useFakeTimers();
    const userStore = useUserStore();
    userStore.userDetails = { referralCode: 'FRIEND123' } as never;
    const dialogStore = useDialogStore();
    dialogStore.showReferralOffer();
    const wrapper = mount(ReferralOfferDialog, { global: { stubs } });
    await wrapper.get('[data-testid="referral-offer-copy-btn"]').trigger('click');
    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(2000);
    vi.useRealTimers();
  });

  it('closes when Escape is pressed on the modal', async () => {
    const dialogStore = useDialogStore();
    dialogStore.showReferralOffer();
    const wrapper = mount(ReferralOfferDialog, {
      global: {
        stubs: {
          Teleport: true,
          Transition: false,
          'font-awesome-icon': true,
        },
      },
    });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await wrapper.vm.$nextTick();
    expect(dialogStore.referralOfferDialog).toBe(false);
    wrapper.unmount();
  });
});
