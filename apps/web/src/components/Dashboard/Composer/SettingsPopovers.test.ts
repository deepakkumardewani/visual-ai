import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const pushMock = vi.fn();

vi.mock('vue-clerk', () => ({
  useUser: () => ({ user: ref(null) }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}));

import SettingsPopovers from '@/components/Dashboard/Composer/SettingsPopovers.vue';
import { useAsideStore } from '@/stores/aside';
import { useUserStore } from '@/stores/user';
import { ASPECT_RATIOS, FLUX_MODES, IMAGE_FORMATS, MODEL_IDS } from '@/utils/constants';

describe('SettingsPopovers', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    pushMock.mockClear();
  });

  it('mounts chip triggers bound to aside store defaults', () => {
    const wrapper = mount(SettingsPopovers);
    const store = useAsideStore();

    expect(wrapper.find('[data-testid="settings-popovers"]').exists()).toBe(true);
    expect(wrapper.text()).toContain(ASPECT_RATIOS[0].title);
    expect(store.imageFormat.title).toBe(IMAGE_FORMATS[0].title);
    expect(store.noOfOutputs).toBe(1);
  });

  it('redirects non-pro users selecting pro aspect ratio to pricing', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const userStore = useUserStore();
    userStore.isPro = false;

    const wrapper = mount(SettingsPopovers, { global: { plugins: [pinia] } });
    const store = useAsideStore();

    await wrapper.findAll("button[aria-haspopup='dialog']")[0].trigger('click');
    await wrapper.vm.$nextTick();

    const proRatio = ASPECT_RATIOS.find((ratio) => ratio.isPro)!;
    const buttons = wrapper.findAll('[role="radio"]');
    const proButton = buttons.find((button) => button.text() === proRatio.title);
    expect(proButton).toBeTruthy();
    await proButton!.trigger('click');

    expect(store.aspectRatio.title).toBe(ASPECT_RATIOS[0].title);
    expect(pushMock).toHaveBeenCalledWith('/pricing');
  });

  it('steps count via stepper and blocks pro flux models', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const wrapper = mount(SettingsPopovers, { global: { plugins: [pinia] } });
    const store = useAsideStore();

    await wrapper.findAll("button[aria-haspopup='dialog']")[2].trigger('click');
    await wrapper.vm.$nextTick();

    await wrapper.get('[aria-label="Increase value"]').trigger('click');
    expect(store.noOfOutputs).toBe(2);

    store.mode = FLUX_MODES.find((mode) => mode.id === MODEL_IDS.FLUX_PRO)!;
    await wrapper.vm.$nextTick();

    const increase = wrapper.get('[aria-label="Increase value"]');
    expect(increase.attributes('disabled')).toBeDefined();
  });
});
