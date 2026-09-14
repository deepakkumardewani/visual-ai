import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@img-comparison-slider/vue', () => ({
  ImgComparisonSlider: { template: '<div data-testid="comparison-slider" />' },
}));

import SignupDialog from '@/components/Dialogs/SignupDialog.vue';
import { useDialogStore } from '@/stores/dialog';

const stubs = {
  AppModal: {
    props: ['open'],
    template:
      '<div v-if="open" data-testid="app-modal"><slot name="title" /><slot /><slot name="actions" /></div>',
  },
};

describe('SignupDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    push.mockReset();
  });

  it('does not render when closed', () => {
    const wrapper = mount(SignupDialog, { global: { stubs } });
    expect(wrapper.find('[data-testid="app-modal"]').exists()).toBe(false);
  });

  it('renders signup copy when open', () => {
    const dialogStore = useDialogStore();
    dialogStore.showSignup();
    const wrapper = mount(SignupDialog, { global: { stubs } });
    expect(wrapper.text()).toContain('Sign up for free');
    expect(wrapper.text()).toContain('Ready to create?');
  });

  it('navigates to signup and closes', async () => {
    const dialogStore = useDialogStore();
    dialogStore.showSignup();
    const wrapper = mount(SignupDialog, { global: { stubs } });
    await wrapper.find('.signup__btn--primary').trigger('click');
    expect(dialogStore.signupDialog).toBe(false);
    expect(push).toHaveBeenCalledWith('/signup');
  });

  it('navigates to signin and closes', async () => {
    const dialogStore = useDialogStore();
    dialogStore.showSignup();
    const wrapper = mount(SignupDialog, { global: { stubs } });
    await wrapper.find('.signup__btn--ghost').trigger('click');
    expect(dialogStore.signupDialog).toBe(false);
    expect(push).toHaveBeenCalledWith('/signin');
  });

  it('renders feature cards and hides via the modal close handler', async () => {
    const dialogStore = useDialogStore();
    dialogStore.showSignup();
    const wrapper = mount(SignupDialog, {
      global: {
        stubs: {
          AppModal: {
            props: ['open'],
            template:
              '<div v-if="open" data-testid="app-modal" @click="$emit(\'close\')"><slot name="title" /><slot /><slot name="actions" /></div>',
          },
          ImgComparisonSlider: { template: '<div class="slider-stub"><slot /></div>' },
        },
      },
    });

    expect(wrapper.text()).toContain('Create stunning images');
    expect(wrapper.text()).toContain('Enhance resolution');
    expect(wrapper.text()).toContain('Colorize photos');
    await wrapper.get('[data-testid="app-modal"]').trigger('click');
    expect(dialogStore.signupDialog).toBe(false);
  });
});
