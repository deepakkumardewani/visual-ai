import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

  it.each([
    [390, 'referral-offer-mobile', 'referral-offer-desktop'],
    [767, 'referral-offer-mobile', 'referral-offer-desktop'],
    [768, 'referral-offer-desktop', 'referral-offer-mobile'],
    [1024, 'referral-offer-desktop', 'referral-offer-mobile'],
  ])('at %ipx only renders %s', (width, shown, hidden) => {
    mobileState.mobile = width < 768;
    useUserStore().userDetails = { firstName: 'Ada' } as never;
    const wrapper = mount(ReferralOffer, {
      global: { stubs: { 'font-awesome-icon': true } },
    });
    expect(wrapper.find(`[data-testid="${shown}"]`).exists()).toBe(true);
    expect(wrapper.find(`[data-testid="${hidden}"]`).exists()).toBe(false);
  });

  it('appears once user details arrive after mount', async () => {
    const userStore = useUserStore();
    const wrapper = mount(ReferralOffer, {
      global: { stubs: { 'font-awesome-icon': true } },
    });
    expect(wrapper.find('[data-testid="referral-offer-desktop"]').exists()).toBe(false);
    userStore.userDetails = { firstName: 'Ada' } as never;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="referral-offer-desktop"]').exists()).toBe(true);
  });
  describe('iconOnly', () => {
    const mountIconOnly = () => {
      useUserStore().userDetails = { firstName: 'Ada' } as never;
      return mount(ReferralOffer, {
        props: { iconOnly: true },
        attachTo: document.body,
        global: { stubs: { 'font-awesome-icon': true } },
      });
    };
    const getTip = () => document.body.querySelector('[role="tooltip"]');

    afterEach(() => {
      vi.useRealTimers();
    });

    it('renders an icon-only button with an aria-label and no visible text', () => {
      const wrapper = mountIconOnly();
      const chip = wrapper.get('[data-testid="referral-offer-desktop"]');
      expect(chip.attributes('aria-label')).toBe('Earn credits');
      expect(chip.text()).toBe('');
      wrapper.unmount();
    });

    it('shows the tooltip on hover', async () => {
      vi.useFakeTimers();
      const wrapper = mountIconOnly();
      const chip = wrapper.get('[data-testid="referral-offer-desktop"]');
      expect(getTip()).toBeNull();
      chip.element.parentElement!.dispatchEvent(new MouseEvent('mouseenter'));
      await vi.advanceTimersByTimeAsync(300);
      expect(getTip()?.textContent?.trim()).toBe('Earn credits');
      wrapper.unmount();
    });

    it('shows the tooltip on keyboard focus', async () => {
      vi.useFakeTimers();
      const wrapper = mountIconOnly();
      const chip = wrapper.get('[data-testid="referral-offer-desktop"]');
      chip.element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await vi.advanceTimersByTimeAsync(300);
      expect(getTip()?.textContent?.trim()).toBe('Earn credits');
      wrapper.unmount();
    });

    it('opens the referral dialog on click', async () => {
      const wrapper = mountIconOnly();
      await wrapper.get('[data-testid="referral-offer-desktop"]').trigger('click');
      expect(useDialogStore().referralOfferDialog).toBe(true);
      wrapper.unmount();
    });

    it('keeps the mobile CTA on small screens even when iconOnly', () => {
      mobileState.mobile = true;
      const wrapper = mountIconOnly();
      expect(wrapper.find('[data-testid="referral-offer-mobile"]').exists()).toBe(true);
      wrapper.unmount();
    });
  });

  it('gives the mobile CTA a 44px minimum height', () => {
    mobileState.mobile = true;
    useUserStore().userDetails = { firstName: 'Ada' } as never;
    const wrapper = mount(ReferralOffer, {
      global: { stubs: { 'font-awesome-icon': true } },
    });
    const chip = wrapper.get('[data-testid="referral-offer-mobile"]');
    expect(chip.classes()).toContain('tw-min-h-11');
  });
});
