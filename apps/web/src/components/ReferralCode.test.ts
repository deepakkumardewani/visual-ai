import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@telemetrydeck/sdk', () => ({
  default: class TelemetryDeck {
    clientUser = '';
    signal = vi.fn();
  },
}));

import ReferralCode from '@/components/ReferralCode.vue';
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';

const stubs = { 'font-awesome-icon': true };

describe('ReferralCode', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('renders the referral code and uses the light theme color', () => {
    const userStore = useUserStore();
    const appStore = useAppStore();
    userStore.userDetails = { referralCode: 'VISUAL-ADA' } as never;
    appStore.isDark = false;

    const wrapper = mount(ReferralCode, { global: { stubs } });
    expect(wrapper.text()).toContain('VISUAL-ADA');
    expect(wrapper.get('button').attributes('style')).toContain('#C9A84C');
  });

  it('uses the dark theme button color', () => {
    const userStore = useUserStore();
    const appStore = useAppStore();
    userStore.userDetails = { referralCode: 'VISUAL-ADA' } as never;
    appStore.isDark = true;

    const wrapper = mount(ReferralCode, { global: { stubs } });
    expect(wrapper.get('button').attributes('style')).toContain('#C98A5A');
  });

  it('copies the referral code and opens a snackbar', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const userStore = useUserStore();
    const appStore = useAppStore();
    userStore.userDetails = { referralCode: 'VISUAL-ADA' } as never;

    const wrapper = mount(ReferralCode, { global: { stubs } });
    await wrapper.get('[aria-label="Copy referral code"]').trigger('click');
    await flushPromises();

    expect(writeText).toHaveBeenCalledWith('VISUAL-ADA');
    expect(appStore.snackbarText).toBe('Referral code copied to clipboard!');
    expect(appStore.snackbar).toBe(true);
  });

  it('copies an empty string when the user has no referral code', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    useUserStore().userDetails = null;

    const wrapper = mount(ReferralCode, { global: { stubs } });
    await wrapper.get('[aria-label="Copy referral code"]').trigger('click');
    await flushPromises();
    expect(writeText).toHaveBeenCalledWith('');
  });

  it('logs when the clipboard write fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    useUserStore().userDetails = { referralCode: 'VISUAL-ADA' } as never;

    const wrapper = mount(ReferralCode, { global: { stubs } });
    await wrapper.get('[aria-label="Copy referral code"]').trigger('click');
    await flushPromises();
    expect(error).toHaveBeenCalled();
    expect(useAppStore().snackbar).toBe(false);
  });
});
