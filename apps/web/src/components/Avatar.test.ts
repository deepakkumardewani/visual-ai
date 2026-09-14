import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type ClerkUser = {
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
};

const userRef = vi.hoisted(() => ({
  value: {
    firstName: 'Ada',
    lastName: 'Lovelace',
    imageUrl: 'https://example.com/ada.jpg',
  } as ClerkUser | null,
}));

vi.mock('vue-clerk', () => ({
  useUser: () => ({
    user: userRef,
  }),
}));

import Avatar from '@/components/Avatar.vue';

describe('Avatar', () => {
  beforeEach(() => {
    userRef.value = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      imageUrl: 'https://example.com/ada.jpg',
    };
  });

  it('renders the clerk image when available', () => {
    const wrapper = mount(Avatar, { props: { size: 'medium' } });
    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('https://example.com/ada.jpg');
    expect(wrapper.attributes('aria-label')).toContain('AL');
    expect(wrapper.attributes('style')).toContain('48px');
  });

  it('falls back to initials when the image errors', async () => {
    const wrapper = mount(Avatar);
    await wrapper.find('img').trigger('error');
    expect(wrapper.find('.avatar__initials').text()).toBe('AL');
  });

  it.each([
    ['small', '36px'],
    ['large', '64px'],
    ['x-large', '96px'],
  ] as const)('sizes %s avatars to %s', (size, px) => {
    const wrapper = mount(Avatar, { props: { size } });
    expect(wrapper.attributes('style')).toContain(px);
  });

  it('shows a generic label when there is no signed-in user', () => {
    userRef.value = null;
    const wrapper = mount(Avatar);
    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.attributes('aria-label')).toBe('User avatar');
  });

  it('uses empty initials and no image when names and imageUrl are missing', () => {
    userRef.value = { firstName: undefined, lastName: undefined, imageUrl: undefined };
    const wrapper = mount(Avatar);
    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.find('.avatar__initials').text()).toBe('');
    expect(wrapper.attributes('aria-label')).toBe('User avatar');
  });
});
