import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Contact from '@/pages/Contact.vue';
import { contactForm } from '@/utils/helpers';

vi.mock('@/composables/usePageSeo', () => ({
  usePageSeo: () => undefined,
}));

vi.mock('@/utils/helpers', () => ({
  contactForm: vi.fn(),
}));

describe('Contact', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  function mountPage() {
    return mount(Contact, {
      global: {
        stubs: { LandingFooter: { template: '<footer class="footer-stub" />' } },
      },
    });
  }

  it('renders the contact form', () => {
    const wrapper = mountPage();
    expect(wrapper.text()).toContain('Get in Touch');
    expect(wrapper.find('#firstName').exists()).toBe(true);
    expect(wrapper.find('.footer-stub').exists()).toBe(true);
  });

  it('shows validation errors after an empty submit', async () => {
    const wrapper = mountPage();
    await wrapper.find('form').trigger('submit');
    expect(wrapper.text()).toContain('First Name is required');
    expect(contactForm).not.toHaveBeenCalled();
  });

  it('submits a valid form and shows success copy', async () => {
    vi.mocked(contactForm).mockResolvedValueOnce(undefined);
    const wrapper = mountPage();

    await wrapper.find('#firstName').setValue('Ada');
    await wrapper.find('#lastName').setValue('Lovelace');
    await wrapper.find('#email').setValue('ada@example.com');
    await wrapper.find('#subject').setValue('Hello Visual');
    await wrapper.find('#message').setValue('Please help with credits.');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(contactForm).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      subject: 'Hello Visual',
      message: 'Please help with credits.',
    });
  });

  it('shows field-specific length and email errors', async () => {
    const wrapper = mountPage();
    await wrapper.find('#firstName').setValue('A');
    await wrapper.find('#lastName').setValue('B');
    await wrapper.find('#email').setValue('not-an-email');
    await wrapper.find('#subject').setValue('Hi');
    await wrapper.find('#message').setValue('Too short');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.text()).toContain('First Name must be at least 2 characters');
    expect(wrapper.text()).toContain('Last Name must be at least 2 characters');
    expect(wrapper.text()).toContain('Email must be valid');
    expect(wrapper.text()).toContain('Subject must be at least 5 characters');
    expect(wrapper.text()).toContain('Message must be at least 10 characters');
    expect(contactForm).not.toHaveBeenCalled();
  });

  it('shows a failure snackbar and uses the dark submit color', async () => {
    vi.mocked(contactForm).mockRejectedValueOnce(new Error('down'));
    const { useAppStore } = await import('@/stores/app');
    const appStore = useAppStore();
    appStore.isDark = true;

    const wrapper = mountPage();
    await wrapper.find('#firstName').setValue('Ada');
    await wrapper.find('#lastName').setValue('Lovelace');
    await wrapper.find('#email').setValue('ada@example.com');
    await wrapper.find('#subject').setValue('Hello Visual');
    await wrapper.find('#message').setValue('Please help with credits.');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(appStore.snackbarText).toBe('Failed to send message. Please try again.');
    expect(appStore.snackbar).toBe(true);
    expect(wrapper.get('button[type="submit"]').attributes('style')).toContain('#C98A5A');
  });

  it('prefills name and email when the signed-in user loads', async () => {
    const { useUserStore } = await import('@/stores/user');
    const wrapper = mountPage();
    const userStore = useUserStore();
    userStore.userDetails = {
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.com',
    } as never;
    await flushPromises();
    expect((wrapper.get('#firstName').element as HTMLInputElement).value).toBe('Grace');
    expect((wrapper.get('#email').element as HTMLInputElement).value).toBe('grace@example.com');
  });
});
