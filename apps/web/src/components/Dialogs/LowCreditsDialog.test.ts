import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import LowCreditsDialog from '@/components/Dialogs/LowCreditsDialog.vue';
import { FeatureType } from '@/types';
import { useAppStore } from '@/stores/app';
import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

const stubs = {
  AppModal: {
    props: ['open'],
    template:
      '<div v-if="open" data-testid="app-modal"><slot name="title" /><slot /><slot name="actions" /></div>',
  },
  'font-awesome-icon': true,
};

describe('LowCreditsDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('does not render when closed', () => {
    const wrapper = mount(LowCreditsDialog, { global: { stubs } });
    expect(wrapper.find('[data-testid="app-modal"]').exists()).toBe(false);
  });

  it('shows available credits and image cost for generate', () => {
    const userStore = useUserStore();
    userStore.credits = 4;
    userStore.dailyCredits = 2;
    const appStore = useAppStore();
    appStore.feature = FeatureType.IMAGE;
    const dialogStore = useDialogStore();
    dialogStore.showLowCredits();

    const wrapper = mount(LowCreditsDialog, { global: { stubs } });
    expect(wrapper.text()).toContain('Low credits');
    expect(wrapper.text()).toContain('generate an AI image');
    expect(wrapper.text()).toContain('1 credit is required');
    expect(wrapper.text()).toContain('6 credits available');
    expect(wrapper.find('.low__chip--critical').exists()).toBe(false);
  });

  it('uses utility copy and marks critical balances', () => {
    const userStore = useUserStore();
    userStore.credits = 2;
    userStore.dailyCredits = 1;
    const appStore = useAppStore();
    appStore.feature = FeatureType.UPSCALE;
    const dialogStore = useDialogStore();
    dialogStore.showLowCredits();

    const wrapper = mount(LowCreditsDialog, { global: { stubs } });
    expect(wrapper.text()).toContain('upscale an image');
    expect(wrapper.text()).toContain('2 credits are required');
    expect(wrapper.find('.low__chip--critical').exists()).toBe(true);
  });

  it('opens buy credits and closes itself', async () => {
    const dialogStore = useDialogStore();
    dialogStore.showLowCredits();
    const wrapper = mount(LowCreditsDialog, { global: { stubs } });
    await wrapper.find('.modal-btn--primary').trigger('click');
    expect(dialogStore.showLowCreditsDialog).toBe(false);
    expect(dialogStore.showBuyCreditsDialog).toBe(true);
  });

  it.each([
    [FeatureType.COLORIZE, 'colorize an image'],
    [FeatureType.REVIVE, 'revive an old photo'],
    [FeatureType.REMOVE_BG, 'remove a background'],
    ['image_upscaler', 'upscale an image'],
    ['colorize_image', 'colorize an image'],
    ['revive_old_photos', 'revive an old photo'],
    ['generate', 'generate an AI image'],
    ['unknown', 'generate an AI image'],
  ] as const)('uses copy for feature %s', (feature, copy) => {
    const appStore = useAppStore();
    appStore.feature = feature as never;
    const dialogStore = useDialogStore();
    dialogStore.showLowCredits();
    const wrapper = mount(LowCreditsDialog, { global: { stubs } });
    expect(wrapper.text()).toContain(copy);
  });
});
