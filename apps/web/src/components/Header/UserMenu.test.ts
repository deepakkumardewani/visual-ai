import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.fn();
const signOut = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  useRoute: () => ({ name: 'create', params: {}, query: {} }),
}));

vi.mock('vue-clerk', () => ({
  useClerk: () => ({ signOut }),
  useUser: () => ({ user: { value: null } }),
}));

import UserMenu from '@/components/Header/UserMenu.vue';
import { useAppStore } from '@/stores/app';
import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

const stubs = {
  'font-awesome-icon': true,
  ReferralDialog: { template: '<div data-testid="referral-dialog-stub" />' },
  ReferralCopyDialog: { template: '<div data-testid="referral-copy-stub" />' },
};

describe('UserMenu', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    push.mockReset();
    signOut.mockReset();
  });

  it('shows initials when there is no avatar', () => {
    const userStore = useUserStore();
    userStore.userDetails = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      imageUrl: '',
    } as never;

    const wrapper = mount(UserMenu, { global: { stubs } });
    expect(wrapper.get('[data-testid="user-menu-trigger"]').text()).toContain('AL');
  });

  it('opens the menu and navigates to profile', async () => {
    const wrapper = mount(UserMenu, { global: { stubs } });
    expect(wrapper.find('[data-testid="user-menu-panel"]').exists()).toBe(false);
    await wrapper.get('[data-testid="user-menu-trigger"]').trigger('click');
    expect(wrapper.find('[data-testid="user-menu-panel"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Your account');
    await wrapper.get('[data-testid="user-menu-item-profile"]').trigger('click');
    expect(push).toHaveBeenCalledWith({ name: 'profile' });
    expect(wrapper.find('[data-testid="user-menu-panel"]').exists()).toBe(false);
  });

  it('opens referral dialogs from menu items', async () => {
    const dialogStore = useDialogStore();
    const wrapper = mount(UserMenu, { global: { stubs } });
    await wrapper.get('[data-testid="user-menu-trigger"]').trigger('click');
    await wrapper.get('[data-testid="user-menu-item-use-referral"]').trigger('click');
    expect(dialogStore.showReferralDialog).toBe(true);

    await wrapper.get('[data-testid="user-menu-trigger"]').trigger('click');
    await wrapper.get('[data-testid="user-menu-item-refer-earn"]').trigger('click');
    expect(dialogStore.showCopyReferralDialog).toBe(true);
  });

  it('toggles theme and signs out', async () => {
    const appStore = useAppStore();
    const toggle = vi.spyOn(appStore, 'toggleTheme');
    const wrapper = mount(UserMenu, { global: { stubs } });
    await wrapper.get('[data-testid="user-menu-trigger"]').trigger('click');
    expect(wrapper.text()).toMatch(/Light Mode|Dark Mode/);
    await wrapper.get('[data-testid="user-menu-item-theme"]').trigger('click');
    expect(toggle).toHaveBeenCalled();
    await wrapper.get('[data-testid="user-menu-item-logout"]').trigger('click');
    expect(signOut).toHaveBeenCalledWith({ redirectUrl: '/' });
  });

  it('shows an avatar image and signed-in identity when present', async () => {
    const userStore = useUserStore();
    userStore.userDetails = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      imageUrl: 'https://cdn.example.com/ada.png',
    } as never;

    const wrapper = mount(UserMenu, { global: { stubs } });
    expect(wrapper.find('img').attributes('src')).toBe('https://cdn.example.com/ada.png');
    await wrapper.get('[data-testid="user-menu-trigger"]').trigger('click');
    expect(wrapper.text()).toContain('Ada Lovelace');
    expect(wrapper.text()).toContain('ada@example.com');
  });

  it('navigates to favorites and payments from the signed-in menu', async () => {
    const wrapper = mount(UserMenu, { global: { stubs } });
    await wrapper.get('[data-testid="user-menu-trigger"]').trigger('click');
    await wrapper.get('[data-testid="user-menu-item-favorites"]').trigger('click');
    expect(push).toHaveBeenCalledWith({ name: 'profile', query: { tab: 'favorites' } });

    await wrapper.get('[data-testid="user-menu-trigger"]').trigger('click');
    await wrapper.get('[data-testid="user-menu-item-payments"]').trigger('click');
    expect(push).toHaveBeenCalledWith({ name: 'profile', query: { tab: 'payments' } });
  });

  it('opens from the trigger keyboard and closes on Escape', async () => {
    const wrapper = mount(UserMenu, { global: { stubs } });
    await wrapper.get('[data-testid="user-menu-trigger"]').trigger('keydown', { key: 'Enter' });
    expect(wrapper.find('[data-testid="user-menu-panel"]').exists()).toBe(true);

    const first = wrapper.get('[data-testid="user-menu-item-profile"]');
    await first.trigger('keydown', { key: 'ArrowDown' });
    await first.trigger('keydown', { key: 'ArrowUp' });
    await first.trigger('keydown', { key: 'Home' });
    await first.trigger('keydown', { key: 'End' });
    await first.trigger('keydown', { key: 'Escape' });
    expect(wrapper.find('[data-testid="user-menu-panel"]').exists()).toBe(false);
  });

  it('returns empty initials when the user has no name', () => {
    const userStore = useUserStore();
    userStore.userDetails = { firstName: '', lastName: '', fullName: '', email: '' } as never;
    const wrapper = mount(UserMenu, { global: { stubs } });
    expect(wrapper.get('[data-testid="user-menu-trigger"]').text().trim()).toBe('');
  });

  it('uses a single initial when only a first name is present', () => {
    const userStore = useUserStore();
    userStore.userDetails = { firstName: 'Ada', lastName: '', fullName: 'Ada', email: '' } as never;
    const wrapper = mount(UserMenu, { global: { stubs } });
    expect(wrapper.get('[data-testid="user-menu-trigger"]').text()).toContain('A');
  });

  it('keeps a blank identity when user details have not loaded', () => {
    const userStore = useUserStore();
    userStore.userDetails = null;
    const wrapper = mount(UserMenu, { global: { stubs } });
    expect(wrapper.get('[data-testid="user-menu-trigger"]').text().trim()).toBe('');
  });

  it('closes an open menu on a second trigger click', async () => {
    const wrapper = mount(UserMenu, { global: { stubs } });
    await wrapper.get('[data-testid="user-menu-trigger"]').trigger('click');
    expect(wrapper.find('[data-testid="user-menu-panel"]').exists()).toBe(true);
    await wrapper.get('[data-testid="user-menu-trigger"]').trigger('click');
    expect(wrapper.find('[data-testid="user-menu-panel"]').exists()).toBe(false);
  });

  it('wraps arrow keys on the last item and opens from Space', async () => {
    const wrapper = mount(UserMenu, { global: { stubs } });
    await wrapper.get('[data-testid="user-menu-trigger"]').trigger('keydown', { key: ' ' });
    const last = wrapper.get('[data-testid="user-menu-item-refer-earn"]');
    await last.trigger('keydown', { key: 'ArrowDown' });
    await last.trigger('keydown', { key: 'ArrowUp' });
    expect(wrapper.find('[data-testid="user-menu-panel"]').exists()).toBe(true);
  });

  it('labels the theme control for both light and dark modes', async () => {
    const appStore = useAppStore();
    appStore.isDark = false;
    const light = mount(UserMenu, { global: { stubs } });
    await light.get('[data-testid="user-menu-trigger"]').trigger('click');
    expect(light.text()).toContain('Dark Mode');
    expect(light.text()).toContain('Light');

    appStore.isDark = true;
    const dark = mount(UserMenu, { global: { stubs } });
    await dark.get('[data-testid="user-menu-trigger"]').trigger('click');
    expect(dark.text()).toContain('Light Mode');
    expect(dark.text()).toContain('Dark');
  });
});
