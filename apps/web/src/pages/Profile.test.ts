import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import Profile from '@/pages/Profile.vue';

const replace = vi.fn();
const route = { query: {} as Record<string, string> };

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRouter: () => ({ replace }),
    useRoute: () => route,
  };
});

describe('Profile', () => {
  it('renders account tabs and the profile panel by default', () => {
    route.query = {};
    const wrapper = mount(Profile, {
      global: {
        stubs: {
          History: { template: '<div class="history-stub" />' },
          Payments: { template: '<div class="payments-stub" />' },
          UserDetails: { template: '<div class="user-stub">User details</div>' },
        },
      },
    });

    expect(wrapper.text()).toContain('Account');
    expect(wrapper.text()).toContain('Profile');
    expect(wrapper.text()).toContain('Favorites');
    expect(wrapper.text()).toContain('Payments');
    expect(wrapper.find('.user-stub').exists()).toBe(true);
  });

  it('switches to payments and updates the query', async () => {
    route.query = {};
    replace.mockClear();
    const wrapper = mount(Profile, {
      global: {
        stubs: {
          History: { template: '<div class="history-stub" />' },
          Payments: { template: '<div class="payments-stub" />' },
          UserDetails: { template: '<div class="user-stub" />' },
        },
      },
    });

    const paymentsTab = wrapper.findAll('button').find((btn) => btn.text().includes('Payments'));
    await paymentsTab!.trigger('click');
    expect(replace).toHaveBeenCalled();
    expect(wrapper.find('.payments-stub').exists()).toBe(true);
  });

  it('syncs a valid tab from the route and ignores unknown tabs', async () => {
    route.query = { tab: 'favorites' };
    const wrapper = mount(Profile, {
      global: {
        stubs: {
          History: { template: '<div class="history-stub" />' },
          Payments: { template: '<div class="payments-stub" />' },
          UserDetails: { template: '<div class="user-stub" />' },
        },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[aria-selected="true"]').text()).toContain('Favorites');
    expect(wrapper.find('.history-stub').exists()).toBe(true);
    expect(wrapper.get('.profile__panel').classes()).toContain('profile__panel--flush');
  });

  it('falls back to the profile panel for an invalid tab query', () => {
    route.query = { tab: 'unknown' };
    const wrapper = mount(Profile, {
      global: {
        stubs: {
          History: { template: '<div class="history-stub" />' },
          Payments: { template: '<div class="payments-stub" />' },
          UserDetails: { template: '<div class="user-stub" />' },
        },
      },
    });
    expect(wrapper.find('.user-stub').exists()).toBe(true);
  });

  it('moves between tabs with the keyboard', async () => {
    route.query = {};
    replace.mockClear();
    const wrapper = mount(Profile, {
      global: {
        stubs: {
          History: { template: '<div class="history-stub" />' },
          Payments: { template: '<div class="payments-stub" />' },
          UserDetails: { template: '<div class="user-stub" />' },
        },
      },
    });

    const profileTab = wrapper.get('[role="tab"]');
    await profileTab.trigger('keydown', { key: 'ArrowRight' });
    expect(replace).toHaveBeenCalled();
    expect(wrapper.find('.history-stub').exists()).toBe(true);

    await wrapper.get('[aria-selected="true"]').trigger('keydown', { key: 'End' });
    expect(wrapper.find('.payments-stub').exists()).toBe(true);

    await wrapper.get('[aria-selected="true"]').trigger('keydown', { key: 'Home' });
    expect(wrapper.find('.user-stub').exists()).toBe(true);

    replace.mockClear();
    await wrapper.get('[aria-selected="true"]').trigger('click');
    expect(replace).not.toHaveBeenCalled();
  });
});
