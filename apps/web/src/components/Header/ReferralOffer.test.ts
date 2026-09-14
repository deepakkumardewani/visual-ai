import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mobileState = vi.hoisted(() => ({ mobile: false }));

vi.mock('@vueuse/core', async (importOriginal) => {
  const vue = await import('vue');
  const actual = await importOriginal<typeof import('@vueuse/core')>();
  return {
    ...actual,
    useMediaQuery: () => vue.computed(() => mobileState.mobile),
  };
});

import ReferralOffer from '@/components/Header/ReferralOffer.vue';
import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

describe('ReferralOffer', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mobileState.mobile = false;
  });

  it('renders nothing until user details load', () => {
    const wrapper = mount(ReferralOffer, {
      global: { stubs: { 'font-awesome-icon': true } },
    });
    expect(wrapper.find('[data-testid="referral-offer-desktop"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="referral-offer-mobile"]').exists()).toBe(false);
  });

  it('opens the referral offer dialog on desktop', async () => {
    const userStore = useUserStore();
    userStore.userDetails = { firstName: 'Ada' } as never;
    const dialogStore = useDialogStore();
    const wrapper = mount(ReferralOffer, {
      global: { stubs: { 'font-awesome-icon': true } },
    });
    const chip = wrapper.get('[data-testid="referral-offer-desktop"]');
    expect(chip.text()).toContain('Earn credits');
    await chip.trigger('click');
    expect(dialogStore.referralOfferDialog).toBe(true);
  });

  it('shows the mobile CTA on small screens', async () => {
    mobileState.mobile = true;
    const userStore = useUserStore();
    userStore.userDetails = { firstName: 'Ada' } as never;
    const dialogStore = useDialogStore();
    const wrapper = mount(ReferralOffer, {
      global: { stubs: { 'font-awesome-icon': true } },
    });
    const chip = wrapper.get('[data-testid="referral-offer-mobile"]');
    expect(chip.text()).toContain('Refer a friend');
    await chip.trigger('click');
    expect(dialogStore.referralOfferDialog).toBe(true);
  });
});
