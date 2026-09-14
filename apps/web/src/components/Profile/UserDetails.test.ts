import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import UserDetails from '@/components/Profile/UserDetails.vue';
import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

vi.mock('vue-clerk', () => ({
  useUser: () => ({
    user: {
      value: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        imageUrl: '',
      },
    },
  }),
}));

const stubs = {
  Avatar: { template: '<span class="avatar-stub" />' },
  DeleteDialog: true,
  ProfileCreditsCard: { template: '<div class="credits-stub" />' },
  'font-awesome-icon': { template: '<span><slot /></span>', props: ['icon'] },
};

function seedUser(store: ReturnType<typeof useUserStore>) {
  store.userDetails = {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    userName: 'ada',
    fullName: 'Ada Lovelace',
  } as never;
}

function mountDetails() {
  return mount(UserDetails, { global: { stubs } });
}

describe('UserDetails', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders profile fields from the user store', () => {
    seedUser(useUserStore());
    const wrapper = mountDetails();
    expect(wrapper.text()).toMatch(/Ada Lovelace|ada@example.com|Username|Name/i);
  });

  it('falls back to Your profile when the name is empty', () => {
    const store = useUserStore();
    store.userDetails = { firstName: '', lastName: '', email: '', userName: '' } as never;
    const wrapper = mountDetails();
    expect(wrapper.text()).toContain('Your profile');
  });

  it('saves a name change and hides the checkmark after the timeout', async () => {
    vi.useFakeTimers();
    const store = useUserStore();
    seedUser(store);
    vi.spyOn(store, 'updateName').mockResolvedValue(true);

    const wrapper = mountDetails();
    const editButtons = wrapper.findAll('button').filter((btn) => btn.text() === 'Edit');
    await editButtons[0].trigger('click');
    await wrapper.get('input[autocomplete="given-name"]').setValue('Augusta');
    await wrapper
      .findAll('button')
      .find((btn) => btn.text() === 'Save')!
      .trigger('click');
    await flushPromises();

    expect(store.updateName).toHaveBeenCalledWith('Augusta', 'Lovelace');
    expect(wrapper.find('[aria-label="Name saved"]').exists()).toBe(true);
    await vi.advanceTimersByTimeAsync(2000);
    expect(wrapper.find('[aria-label="Name saved"]').exists()).toBe(false);
  });

  it('shows a save error when the name update fails and cancel restores values', async () => {
    const store = useUserStore();
    seedUser(store);
    vi.spyOn(store, 'updateName').mockResolvedValue(false);

    const wrapper = mountDetails();
    await wrapper
      .findAll('button')
      .filter((btn) => btn.text() === 'Edit')[0]
      .trigger('click');
    await wrapper.get('input[autocomplete="family-name"]').setValue('Byron');
    await wrapper
      .findAll('button')
      .find((btn) => btn.text() === 'Save')!
      .trigger('click');
    await flushPromises();

    expect(wrapper.get('[role="alert"]').text()).toContain('Couldn’t save');
    await wrapper
      .findAll('button')
      .find((btn) => btn.text() === 'Cancel')!
      .trigger('click');
    expect(wrapper.get('input[autocomplete="family-name"]').element).toHaveProperty(
      'value',
      'Lovelace',
    );
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('saves a username change and reports failures', async () => {
    vi.useFakeTimers();
    const store = useUserStore();
    seedUser(store);
    const updateUsername = vi.spyOn(store, 'updateUsername').mockResolvedValueOnce(true);

    const wrapper = mountDetails();
    await wrapper
      .findAll('button')
      .filter((btn) => btn.text() === 'Edit')[1]
      .trigger('click');
    await wrapper.get('input[autocomplete="username"]').setValue('countess');
    await wrapper
      .findAll('button')
      .find((btn) => btn.text() === 'Save')!
      .trigger('click');
    await flushPromises();

    expect(updateUsername).toHaveBeenCalledWith('countess');
    expect(wrapper.find('[aria-label="Username saved"]').exists()).toBe(true);
    await vi.advanceTimersByTimeAsync(2000);

    updateUsername.mockResolvedValueOnce(false);
    await wrapper
      .findAll('button')
      .filter((btn) => btn.text() === 'Edit')[1]
      .trigger('click');
    await wrapper.get('input[autocomplete="username"]').setValue('bad-name');
    await wrapper
      .findAll('button')
      .find((btn) => btn.text() === 'Save')!
      .trigger('click');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain('Couldn’t save');

    await wrapper
      .findAll('button')
      .find((btn) => btn.text() === 'Cancel')!
      .trigger('click');
    expect(wrapper.get('input[autocomplete="username"]').element).toHaveProperty('value', 'ada');
  });

  it('opens the delete-account dialog', async () => {
    seedUser(useUserStore());
    const dialogStore = useDialogStore();
    const wrapper = mountDetails();
    await wrapper
      .findAll('button')
      .find((btn) => btn.text() === 'Delete account')!
      .trigger('click');
    expect(dialogStore.showDeleteDialog).toBe(true);
  });

  it('disables Save until the name changes and shows Saving… while updating', async () => {
    const store = useUserStore();
    seedUser(store);
    const wrapper = mountDetails();
    await wrapper
      .findAll('button')
      .filter((btn) => btn.text() === 'Edit')[0]
      .trigger('click');
    expect(
      wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Save')!
        .attributes('disabled'),
    ).toBeDefined();

    store.isUpdatingName = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Saving…');
  });

  it('disables username Save until the value changes and shows Saving…', async () => {
    const store = useUserStore();
    seedUser(store);
    const wrapper = mountDetails();
    await wrapper
      .findAll('button')
      .filter((btn) => btn.text() === 'Edit')[1]
      .trigger('click');
    expect(
      wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Save')!
        .attributes('disabled'),
    ).toBeDefined();

    store.isUpdatingUsername = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Saving…');
  });

  it('hides the email line and syncs when the store user changes', async () => {
    const store = useUserStore();
    store.userDetails = { firstName: '', lastName: '', email: '', userName: '' } as never;
    const wrapper = mountDetails();
    expect(wrapper.find('.user-details__email').exists()).toBe(false);

    store.userDetails = {
      firstName: 'Alan',
      lastName: 'Turing',
      email: 'alan@example.com',
      userName: 'turing',
      fullName: 'Alan Turing',
    } as never;
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('alan@example.com');
    expect(wrapper.text()).toContain('Alan Turing');
  });
});
